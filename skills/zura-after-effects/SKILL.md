---
name: zura-after-effects
description: Edit the currently open Adobe After Effects project using the Zura After Effects MCP. Use for native compositions, text, shapes, effects, masks, animation and render queue work.
---

Use the registered `zura-after-effects-mcp` tools. Begin with `get_capabilities` and `get_project`; inspect the selected composition and stable layer IDs. Use the current project. Send its saved path as `expected_project_path` on mutations. Never launch a hidden AE process or replace the open project to complete an edit.

Resolve property paths with `list_properties` and use locale-independent match names. The host may return three components for 2D Position/Scale; match the inspected value dimensions. Discover installed effects and render templates instead of guessing their display names. Native font requests may be substituted; inspect the actual text document font.

Use `set_keyframes` for complete tracks and `batch_edit` for independent operations on known IDs. Batches stop on first failure and do not roll back completed edits. Creation returns IDs; inspect those before constructing a dependent batch. A single undo group is a convenience, not transactional rollback.

Require `verified` results or explicit readback. For `committed_unverified` or `possibly_modified`, inspect the affected objects before retrying. Do not repeat creation or destructive operations after an ambiguous timeout. Render queue completion is separate from a visually correct export. Inspect actual files, dimensions, timing and representative frames. `export_frame` verifies PNG format and dimensions, not appearance; auto preview uses a colour-managed one-frame render on 32-bit projects; explicitly requested native previews can differ from final renders. Preserve project colour settings and use a render queue output for final colour review.

Expressions require the user's explicit `unsafe-script` capability. Do not enable it to cover a missing ordinary tool. Use Computer Use only for an essential host operation absent from supported tools after identifying the precise gap. Routine inspection, editing, animation and export use MCP.

Installation is handled by the public repository's platform installer. It builds a durable per-user runtime, installs the CEP panel and this skill, and verifies an absolute Codex MCP registration. Restart AE only if it was open during installation; use a new Codex chat for the refreshed MCP catalogue.
