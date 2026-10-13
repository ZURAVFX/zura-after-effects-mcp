#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/ZuraAfterEffectsMCP"
case "$(uname -s)" in Darwin) ;; *) echo "macOS is required" >&2; exit 1;; esac
if [ -L "$DEST" ]; then echo "CEP destination is a link; use a normal directory." >&2; exit 1; fi
if [ "${1:-}" != "--diagnose" ]; then
  mkdir -p "$DEST"
  cp -R "$ROOT/cep-plugin/." "$DEST/"
  for version in 9 10 11 12 13 14; do defaults write "com.adobe.CSXS.$version" PlayerDebugMode 1; done
fi
diff -r "$ROOT/cep-plugin" "$DEST"
for version in 9 10 11 12 13 14; do
  [ "$(defaults read "com.adobe.CSXS.$version" PlayerDebugMode)" = "1" ] || { echo "CEP activation verification failed for CSXS.$version" >&2; exit 1; }
done
echo "Zura After Effects MCP panel verified. Restart After Effects if already open, then choose Window > Extensions > Zura After Effects MCP."
