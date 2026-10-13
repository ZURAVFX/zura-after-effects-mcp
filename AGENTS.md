# Repository instructions

Product: Zura After Effects MCP. Independent of Premiere Reels. Follow INSTALL.md for installation requests; the platform installer owns prerequisites, panel setup, skill installation and Codex registration.

Keep host scripts ECMAScript 3 compatible. Escape all user values through the script builder. Preserve private bridge ownership checks and default capability restrictions. Use stable item/layer IDs and verify mutation postconditions. A failed batch can leave earlier steps applied: do not retry it blindly.

Keep project files, footage, local receipts, credentials and generated artifacts out of commits. Test fixtures are not proof of live Adobe compatibility. Run `npm run check` for changes when verification is requested. Document unverified APIs honestly.
