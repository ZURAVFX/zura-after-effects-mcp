# Zura After Effects MCP

Control the currently open Adobe After Effects project from Codex or another MCP client. Create editable compositions, text, shapes and layers; inspect properties; apply effects and masks; animate with keyframes and easing; queue renders and export previews.

Part of the Zura connector family with [Zura Premiere MCP](https://github.com/ZURAVFX/zura-premiere-mcp). This is an independent MCP. It does not install or require Premiere Reels.

## Install from one Codex prompt

Paste this into Codex:

```text
Install Zura After Effects MCP from https://github.com/ZURAVFX/zura-after-effects-mcp and follow its INSTALL.md to complete automatic setup for Codex.
```

The platform installers can download a per-user Node 24 runtime from nodejs.org and verify its published SHA-256. The setup installs the official Codex CLI in an isolated user directory if a suitable CLI entry point is unavailable. No sign-in is needed to register this local MCP. Adobe must be installed separately.

Codex downloads the public ZIP, runs the appropriate installer and checks the installation receipt. You do not need Git, GitHub CLI or a GitHub account. The installer also verifies the installed panel files and CEP activation settings. It checks MCP startup without creating or changing any Adobe project.

Setup uses a permanent user directory, so removing the source download does not break the server. It registers only `zura-after-effects-mcp` and leaves other MCP entries alone. No Adobe application is restarted automatically. An already open AE session needs restarting to discover a newly installed panel; a new Codex chat loads its tools.

For another MCP client, run `npm ci`, `npm run build` and `npm run install-cep`, then register your absolute Node executable and the absolute `dist/index.js` path. The package is distributed as source; it is not published to npm.

## Coverage

| Area | Operations |
| --- | --- |
| Inspection | Project items, active composition, stable layer IDs, property tree, values, keyframes, installed effects, render queue and templates |
| Authoring | Compositions, folders, footage, native text, rectangle/ellipse shapes, solids, nulls, lights and cameras |
| Layers | Timing and flags, duplication/removal, parenting, reordering, source replacement, blend modes, track mattes, precomposition and markers |
| Properties | Scalar/vector values, text editing, shape vertices/tangents, effects and masks |
| Animation | Bulk keyframes, interpolation, temporal easing and spatial tangents; opt-in expressions |
| Output | Project saving, image-sequence import/FPS interpretation, PNG frames, render queue outputs and Essential Graphics/MOGRT operations |
| Efficiency | Bounded edit batches, paginated discovery and correlated request/results |

The tool catalogue is generated from `src/tools.ts`. Inspect `get_capabilities` for the enabled catalogue. Default capabilities are `inspect,edit,export,filesystem`; `unsafe-script` is disabled. Configure `AFTER_EFFECTS_MCP_CAPABILITIES` to narrow access. Configure `AFTER_EFFECTS_MCP_TEMP_DIR` only when both client and panel need a custom bridge location.

## Result contract

Mutations return `verified` only when their stated readback condition passed. `committed_unverified` means an operation returned but needs further inspection. `possibly_modified` means failure after a mutation began, so automatic retries can duplicate or damage work. Batches are not transactions: prior steps remain after failure. Undo groups make deliberate recovery easier.

AE layer IDs require AE 22+. Some APIs, including modern track mattes, have additional host version requirements. Unsupported APIs fail with an explanation. The Windows live smoke test was run in AE 26.3; every tool and every host version has not been individually validated. macOS installation is checked in CI, with live Mac AE validation still needed.

Native `saveFrameToPng` is asynchronous; the server waits for a fresh PNG with matching dimensions. Auto preview now uses a temporary one-frame PNG render queue output on 32-bit projects, preserving queue selections and removing its temporary queue item. This corrected the colour discrepancy observed in live testing. Explicit native previews retain a colour warning. File verification is not artistic approval.

## Development

Use Node 20.19+ (Node 24 recommended). `npm ci` then `npm run check`. Unit/contract tests and a real stdio client test cover guards, escaping, readback, batch failures and discovery. `node scripts/live-check.mjs` explicitly creates a named test composition in the open AE project and exports a frame; it never runs during installation.

See [the comparison and remaining gaps](docs/architecture-audit.md) and [provenance](UPSTREAM.md). Independent project, not affiliated with Adobe.

