/**
 * ==============================================================================
 * GIDEON AI HQ — PHASE 3A: PORT ALLOCATOR & ATOMIC LEASE MANAGER
 * 
 * Invariants Enforced:
 * 1. Port Pool Bounds: Strictly within [4100, 4199] (100 total assignable ports).
 * 2. Critical Non-Collision: NEVER allocates 3000, 3001 (HQ Dev Server) or 18789 (OpenClaw).
 * 3. Atomic Claim: Acquisition sequence (claim candidate -> TCP probe -> ACTIVE / RELEASE).
 *    Guarantees 20 concurrent allocation requests cannot double-bind the same port.
 * 4. Physical Availability First: If port is occupied on loopback, treated as unavailable.
 * 5. Lease Heartbeat & TTL Reclamation: Stale/unrenewed leases auto-reclaimed on expiry.
 * ==============================================================================
 */

import net from 'net';
import crypto from 'crypto';
import { ProjectRunnerLease } from '@gideon/shared';

export const PORT_RANGE_START = 4100;
export const PORT_RANGE_END = 4199;
export const PROTECTED_PORTS = new Set([3000, 3001, 18789]);

export class PortExhaustionError extends Error {
  constructor(message: string = 'All ports in the 4100-4199 pool are currently leased or physically occupied.') {
    super(message);
    this.name = 'PortExhaustionError';
  }
}

export class PortCollisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortCollisionError';
  }
}

export interface ILeasePersistenceAdapter {
  saveLease(lease: ProjectRunnerLease): Promise<void>;
  getActiveLeases(): Promise<ProjectRunnerLease[]>;
  updateHeartbeat(leaseId: string, expiresAt: string): Promise<void>;
  terminateLease(leaseId: string, status: 'RELEASED' | 'EXPIRED' | 'TERMINATED', exitCode?: number): Promise<void>;
}

export class PortAllocator {
  private static instance: PortAllocator;
  private activeLeases: Map<number, ProjectRunnerLease> = new Map();
  private inFlightReservations: Set<number> = new Set();
  private persistenceAdapter?: ILeasePersistenceAdapter;
  private mutex: Promise<void> = Promise.resolve();

  constructor(persistenceAdapter?: ILeasePersistenceAdapter) {
    this.persistenceAdapter = persistenceAdapter;
  }

  public static getInstance(adapter?: ILeasePersistenceAdapter): PortAllocator {
    if (!PortAllocator.instance) {
      PortAllocator.instance = new PortAllocator(adapter);
    }
    return PortAllocator.instance;
  }

  /**
   * Serializes async operations requiring atomic port reservation.
   */
  private async withMutex<T>(operation: () => Promise<T>): Promise<T> {
    let release: () => void = () => {};
    const nextMutex = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentMutex = this.mutex;
    this.mutex = (async () => {
      try {
        await currentMutex;
      } catch {}
      await nextMutex;
    })();

    await currentMutex;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  /**
   * Active TCP loopback availability probe.
   * Attempts to bind to the port. If another process is listening, fails closed.
   */
  public static async isTcpPortAvailable(port: number, host: string = '127.0.0.1'): Promise<boolean> {
    if (PROTECTED_PORTS.has(port) || port < PORT_RANGE_START || port > PORT_RANGE_END) {
      return false;
    }

    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();

      server.once('error', () => {
        resolve(false);
      });

      server.once('listening', () => {
        server.close(() => {
          resolve(true);
        });
      });

      try {
        server.listen(port, host);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Atomically allocates the first available port in [4100, 4199] for a project.
   * Concurrency guarantee: In-flight reservation lock prevents race collisions.
   */
  public async allocatePort(projectId: string, ttlMs: number = 60000): Promise<ProjectRunnerLease> {
    if (!projectId || typeof projectId !== 'string') {
      throw new Error('Project ID is required to allocate a port lease.');
    }

    // Step 1: Reclaim expired leases first
    await this.reclaimStaleLeases();

    // Step 2: Atomic Candidate Selection under Mutex Lock
    const allocatedLease = await this.withMutex(async () => {
      // Check if project already has an active lease
      for (const existing of this.activeLeases.values()) {
        if (existing.projectId === projectId && existing.status === 'ACTIVE') {
          // Verify physical availability or return existing valid lease
          const now = Date.now();
          if (new Date(existing.expiresAt).getTime() > now) {
            return existing;
          }
        }
      }

      // Search range [4100, 4199]
      for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
        // Invariant 1 & 2: Boundary and Protected Ports
        if (PROTECTED_PORTS.has(port)) {
          continue;
        }

        // Check if leased in active memory map
        if (this.activeLeases.has(port)) {
          const lease = this.activeLeases.get(port)!;
          if (lease.status === 'ACTIVE' && new Date(lease.expiresAt).getTime() > Date.now()) {
            continue;
          }
        }

        // Check if currently reserved by an in-flight probe
        if (this.inFlightReservations.has(port)) {
          continue;
        }

        // Atomically claim in-flight reservation
        this.inFlightReservations.add(port);

        // Physical Availability Probe
        const isPhysicallyFree = await PortAllocator.isTcpPortAvailable(port);
        if (!isPhysicallyFree) {
          // Port occupied by unmanaged process outside Gideon. Release reservation & skip.
          this.inFlightReservations.delete(port);
          continue;
        }

        // Port is free & physically open! Seal the lease.
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttlMs).toISOString();
        const lease: ProjectRunnerLease = {
          id: `lease_${port}_${crypto.randomBytes(4).toString('hex')}`,
          projectId,
          runnerId: 'runner_build_lab',
          pid: process.pid,
          port,
          status: 'ACTIVE',
          startedAt: now.toISOString(),
          heartbeatAt: now.toISOString(),
          expiresAt
        };

        this.activeLeases.set(port, lease);
        this.inFlightReservations.delete(port);

        // Async persistence if adapter configured
        if (this.persistenceAdapter) {
          try {
            await this.persistenceAdapter.saveLease(lease);
          } catch (err: any) {
            console.warn(`[PortAllocator] Failed to persist lease: ${err.message}`);
          }
        }

        return lease;
      }

      throw new PortExhaustionError();
    });

    return allocatedLease;
  }

  /**
   * Releases an active port lease by port number or lease ID.
   */
  public async releasePort(portOrLeaseId: number | string): Promise<boolean> {
    return this.withMutex(async () => {
      let targetLease: ProjectRunnerLease | undefined;

      if (typeof portOrLeaseId === 'number') {
        targetLease = this.activeLeases.get(portOrLeaseId);
      } else {
        for (const l of this.activeLeases.values()) {
          if (l.id === portOrLeaseId) {
            targetLease = l;
            break;
          }
        }
      }

      if (!targetLease || targetLease.status !== 'ACTIVE') {
        return false;
      }

      targetLease.status = 'RELEASED';
      this.activeLeases.delete(targetLease.port);
      this.inFlightReservations.delete(targetLease.port);

      if (this.persistenceAdapter) {
        try {
          await this.persistenceAdapter.terminateLease(targetLease.id, 'RELEASED');
        } catch {}
      }

      return true;
    });
  }

  /**
   * Updates the heartbeat of an active lease, extending its TTL.
   */
  public async heartbeat(leaseId: string, extensionMs: number = 60000): Promise<boolean> {
    let foundLease: ProjectRunnerLease | undefined;
    for (const lease of this.activeLeases.values()) {
      if (lease.id === leaseId && lease.status === 'ACTIVE') {
        foundLease = lease;
        break;
      }
    }

    if (!foundLease) {
      return false;
    }

    const now = new Date();
    foundLease.heartbeatAt = now.toISOString();
    foundLease.expiresAt = new Date(now.getTime() + extensionMs).toISOString();

    if (this.persistenceAdapter) {
      try {
        await this.persistenceAdapter.updateHeartbeat(leaseId, foundLease.expiresAt);
      } catch {}
    }

    return true;
  }

  /**
   * Reclaims all active leases whose TTL has expired.
   */
  public async reclaimStaleLeases(): Promise<number> {
    const now = Date.now();
    const expiredPorts: number[] = [];

    for (const [port, lease] of this.activeLeases.entries()) {
      if (lease.status === 'ACTIVE' && new Date(lease.expiresAt).getTime() <= now) {
        expiredPorts.push(port);
      }
    }

    for (const port of expiredPorts) {
      const lease = this.activeLeases.get(port);
      if (lease) {
        lease.status = 'EXPIRED';
        this.activeLeases.delete(port);
        this.inFlightReservations.delete(port);
        if (this.persistenceAdapter) {
          try {
            await this.persistenceAdapter.terminateLease(lease.id, 'EXPIRED');
          } catch {}
        }
      }
    }

    return expiredPorts.length;
  }

  /**
   * Returns copy of all active leases.
   */
  public getActiveLeases(): ProjectRunnerLease[] {
    const now = Date.now();
    return Array.from(this.activeLeases.values())
      .filter(l => l.status === 'ACTIVE' && new Date(l.expiresAt).getTime() > now);
  }

  /**
   * Returns active lease for a specific project if present.
   */
  public getLeaseByProject(projectId: string): ProjectRunnerLease | undefined {
    const now = Date.now();
    for (const l of this.activeLeases.values()) {
      if (l.projectId === projectId && l.status === 'ACTIVE' && new Date(l.expiresAt).getTime() > now) {
        return l;
      }
    }
    return undefined;
  }

  /**
   * Returns lease for a specific port.
   */
  public getLeaseByPort(port: number): ProjectRunnerLease | undefined {
    return this.activeLeases.get(port);
  }

  /**
   * Resets all in-memory state (useful for test tear-downs).
   */
  public reset(): void {
    this.activeLeases.clear();
    this.inFlightReservations.clear();
  }
}
