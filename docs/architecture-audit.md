# Connector comparison and remaining gaps

Reviewed public source on 13 October 2026. Tool counts alone are not proof of working host coverage.

| Source | Useful approach | Zura decision |
| --- | --- | --- |
| Dakkshin/after-effects-mcp | Named composition/layer/shape/mask operations and a native open-host bridge | Retain that authoring scope; replace shared result files and queued-success replies with correlated synchronous results |
| ionutsss1/after-effects-mcp, 7cf55f58db80d3b65bc2c67dcf0400f286ced934 | Whole animation tracks in a single call; stable composition IDs; explicit documented limitations | Bulk keyframes and bounded edit batches, stable composition/layer IDs, easing and explicit partial failure |
| energration/adobe-mcp-rs, 0c4561effba2f6070914f7d4dbd8cf226e863a99 | Broker scheduling, instance routing, retained request results and explicit unsafe script boundaries | Keep Zura's simpler existing CEP transport for deployment; retain capability boundaries. Multiple-instance targeting and retained late results remain open gaps |
| Zura Premiere MCP, d7351eb3754731626229dd7de955d4970e0b8506 | Private bridge ACLs, atomic command publication, UUID correlation, heartbeat, event-driven response watching, bounded scripts and verified edits | Reuse these foundations with a separate AE channel and product namespace |
| Adobe CEP/UXP resources | Host lifecycle and documented API boundaries | Use CEP for AE; keep Premiere's documented UXP path. Do not migrate AE to a speculative UXP API |

## Implemented boundaries

No background/headless Adobe launch. No raw arbitrary script tool by default. A saved-project guard is checked before mutation. Tool schemas bound dimensions, key counts and edit batch sizes. Strings are serialized as ES3-safe literals. Native layer/property IDs and match names are inspected instead of inferred from display names. Host errors after mutation are not retry-safe. Panel readiness does not claim an MCP client is connected.

Both public MCPs share the panel stylesheet, green palette, responsive layout, typography and recovery language. AE is independent of the private Premiere Reels workflow.

## Known gaps and priorities

1. Multi-instance targeting: the current connector assumes one active AE desktop instance per user bridge. A process-aware broker needs separate design and live tests before this becomes safe.
2. Late-result recovery after client timeout: the transport reports unknown mutation state; users must inspect before retry. A retained request receipt service is not yet implemented.
3. Full type-specific property editing: custom/plugin property values, advanced TextDocument styling and all shape operators need dedicated schemas/readback. Generic numeric/vector paths cover many native properties but do not replace these types.
4. MOGRT expose/export API returns are intentionally unverified pending stronger filesystem/control readback. Third-party effects are discoverable but not individually supported or tested.
5. Render cancellation/progress: native queue rendering currently blocks the command until completion. A cancellable job protocol needs host scheduling tests.
6. Mac live host validation and broad native feature fixtures remain required. CI checks installation and protocol; mocks do not prove Adobe behaviour.
7. Native preview PNG colour behaviour on 32-bit projects was corrected with a one-frame render queue fallback. A live pixel check matched the requested green (175,255,65). Broader colour-space fixtures remain needed; no project colour settings are changed.

Premiere already has focused tool packs, supported static framing, footage interpretation, export discovery and runtime UXP probing. The comparison did not justify substituting an unsafe batch/QE timeline assembly path. Existing Premiere full-suite failures remain a separate validation debt; its changed panel receives targeted checks.

