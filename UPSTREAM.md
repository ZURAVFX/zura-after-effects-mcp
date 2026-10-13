# Provenance

The bridge transport, private-directory checks, CEP bootstrap and shared panel stylesheet are adapted from [Zura Premiere MCP](https://github.com/ZURAVFX/zura-premiere-mcp), based on the MIT-licensed leancoderkavy/premiere-pro-mcp. The original contributor notice remains in LICENSE.

The authoring catalogue and implementation design were compared with [Dakkshin/after-effects-mcp](https://github.com/Dakkshin/after-effects-mcp) and [ionutsss1/after-effects-mcp](https://github.com/ionutsss1/after-effects-mcp). This server implements its own validated dispatcher instead of copying their shared command/result loop. Dakkshin's MIT notice is preserved in THIRD_PARTY_NOTICES.md for attribution.

[energration/adobe-mcp-rs](https://github.com/energration/adobe-mcp-rs), reviewed at 0c4561effba2f6070914f7d4dbd8cf226e863a99, informed the comparison of instance routing and timeout recovery. Its Rust broker and script runtime are not included. Adobe CEP resources informed the panel lifecycle.

No upstream update service is enabled. Releases and installers use ZURAVFX source only.
