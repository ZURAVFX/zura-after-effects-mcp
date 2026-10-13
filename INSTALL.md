# Automatic Codex setup

When the user asks to install this MCP, complete setup without asking them to install Git, GitHub CLI, Node, npm or Codex CLI manually.

1. Download the public source ZIP from `https://github.com/ZURAVFX/zura-after-effects-mcp/archive/refs/heads/main.zip` into a normal local directory and extract it. An existing source checkout is also suitable. No GitHub login is required.
2. On Windows run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File INSTALL-ZURA-AFTER-EFFECTS-MCP.ps1`. On macOS run `bash INSTALL-ZURA-AFTER-EFFECTS-MCP.command`. Run from the extracted repository root. The platform installer bootstraps a compatible Node runtime if needed.
3. The installer builds and copies the server into a permanent user directory, installs and verifies the Adobe panel, installs the editing skill, registers the local MCP using absolute paths, and verifies an actual MCP startup. Missing Codex CLI is installed automatically into the product's user directory. Registration needs no separate CLI login.
4. Read `installation.json` under the product's permanent user directory. Only report setup complete after the installer exits successfully and the receipt says `installed_verified`. A receipt from an earlier run does not override a failure in the current run.
5. If AE was already open, ask the user to save and restart it. A new Codex chat loads the newly registered tools. Once available, call `get_project` to verify the live connection. Never report a live Adobe connection solely from an installation receipt.

Do not use Computer Use to install or register this connector. Do not restart Adobe automatically, replace unrelated MCP entries, require a GitHub account or enable unsafe scripting to repair setup. If setup fails, retain the exact failing command and error; diagnose that step rather than repeat the entire installation blindly.

Repeated installation reuses matching dependencies and builds. The installed server does not depend on retaining the downloaded source folder.
