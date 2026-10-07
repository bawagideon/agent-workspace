# Gideon AI HQ — Release Readiness & Staging Checklist

## 1. Executive Summary
This document defines the release readiness criteria for missions executed by the autonomous workforce (Atlas, Forge, Sentinel, Ledger, and Release).

## 2. Release Gates & Verification Criteria
- [x] **Autonomous Implementation (Forge)**: All feature controllers, schema migrations, and route handlers implemented without syntax or TypeScript errors.
- [x] **Adversarial QA Audit (Sentinel)**: Automated test suite executed, zero security boundary vulnerabilities detected, QA scorecard at 100/100.
- [x] **Financial Governance (Ledger)**: Token spend accounted for against mission budget cap, strict $0.00 cash rule enforced until external fiat receipt is verified.
- [x] **Repository Cleanliness (Release)**: Git status verified, uncommitted diffs reviewed, zero secret files or keys staged in release commits.

## 3. Deployment Artifacts
- **Runtime Environment**: Node.js 22 LTS / Next.js 15
- **Monorepo Packages**: `@gideon/shared`, `@gideon/policy`, `@gideon/tools`, `@gideon/runner`, `@gideon/agents`, `@gideon/runtime`, `@gideon/memory`
- **Dashboard Surface**: Gideon HQ Web (`apps/hq`)
- **Gateway**: OpenClaw Gateway (Port 18789)

## 4. Rollback Strategy
- Immediate reversion of uncommitted changes via Git reset.
- Automated kill switch triggers in `<50ms` on abnormal token burn or policy breach.
- Rollback target: Previous stable release tag.
