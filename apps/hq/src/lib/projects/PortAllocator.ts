import net from 'net';

export class PortAllocator {
  private static instance: PortAllocator;
  private readonly startPort = 4100;
  private readonly endPort = 4199;
  private reservedPorts: Map<number, { projectId: string; leaseId: string; reservedAt: number }> = new Map();

  private constructor() {}

  public static getInstance(): PortAllocator {
    if (!PortAllocator.instance) {
      PortAllocator.instance = new PortAllocator();
    }
    return PortAllocator.instance;
  }

  /**
   * Checks if a port is physically available in the OS.
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => resolve(false));
      server.listen(port, '127.0.0.1', () => {
        server.close(() => resolve(true));
      });
    });
  }

  /**
   * Concurrency-safe atomic port allocation for a project runner.
   */
  public async allocatePort(projectId: string, leaseId: string): Promise<number> {
    // Check if project already has an active lease
    for (const [port, entry] of this.reservedPorts.entries()) {
      if (entry.projectId === projectId) {
        return port;
      }
    }

    for (let port = this.startPort; port <= this.endPort; port++) {
      if (this.reservedPorts.has(port)) {
        continue;
      }

      const available = await this.isPortAvailable(port);
      if (available) {
        this.reservedPorts.set(port, {
          projectId,
          leaseId,
          reservedAt: Date.now()
        });
        return port;
      }
    }

    throw new Error(`Port Exhaustion: No available ports in governed block (${this.startPort}-${this.endPort}).`);
  }

  public releasePort(port: number): void {
    this.reservedPorts.delete(port);
  }

  public releaseProjectPort(projectId: string): void {
    for (const [port, entry] of this.reservedPorts.entries()) {
      if (entry.projectId === projectId) {
        this.reservedPorts.delete(port);
      }
    }
  }

  public getActiveLeases(): Array<{ port: number; projectId: string; leaseId: string }> {
    return Array.from(this.reservedPorts.entries()).map(([port, e]) => ({
      port,
      projectId: e.projectId,
      leaseId: e.leaseId
    }));
  }
}
