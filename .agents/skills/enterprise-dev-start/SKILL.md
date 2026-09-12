---
name: enterprise-dev-start
description: Quickly start the EnterpriseManageSystem local development stack (MariaDB, NestJS backend, and Vite frontend). Use when the user asks to start, run, launch, or reopen this project's frontend and backend; do not use for unrelated repositories.
---

# Enterprise Dev Start

Run `scripts/start-dev.ps1` instead of rediscovering package scripts, ports, database paths, or environment settings.

## Workflow

1. From the repository root, execute:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".agents\skills\enterprise-dev-start\scripts\start-dev.ps1"
   ```

2. Run the command with escalated sandbox permissions. MariaDB writes under `C:\Program Files`, and Vite's `esbuild` may fail with `spawn EPERM` inside the sandbox.
3. Report the URLs printed by the script. Do not repeat manual discovery or restart ports that are already healthy.
4. On failure, inspect only the log paths printed by the helper. Do not reinstall dependencies unless a log shows they are missing.

The helper skips MariaDB on port `3306`, the backend on `3000`, and the frontend on `5173` when already reachable. It launches all new processes with `-WindowStyle Hidden`.
