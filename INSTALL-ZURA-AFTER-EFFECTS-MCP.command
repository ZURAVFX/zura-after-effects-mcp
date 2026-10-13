#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.local/bin:$PATH:/opt/homebrew/bin:/usr/local/bin"
if ! command -v node >/dev/null 2>&1 || ! node -e 'let [a,b]=process.versions.node.split(".").map(Number);process.exit(a>20||(a===20&&b>=19)?0:1)'; then
  BASE="$HOME/Library/Application Support/Adobe/ZuraAfterEffectsMCP/node"
  mkdir -p "$BASE"
  ARCH="$(uname -m)"; [ "$ARCH" = "x86_64" ] && ARCH=x64
  VERSION="$(curl -fsSL https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt | sed -n "s/.*  node-\(v24[^ ]*\)-darwin-$ARCH.tar.gz/\1/p" | head -1)"
  [ -n "$VERSION" ] || { echo "Could not resolve Node 24 download" >&2; exit 1; }
  NAME="node-$VERSION-darwin-$ARCH"
  curl -fsSL "https://nodejs.org/dist/$VERSION/$NAME.tar.gz" -o "$BASE/$NAME.tar.gz"
  EXPECTED="$(curl -fsSL "https://nodejs.org/dist/$VERSION/SHASUMS256.txt" | awk -v name="$NAME.tar.gz" '$2==name {print $1}')"
  ACTUAL="$(shasum -a 256 "$BASE/$NAME.tar.gz" | awk '{print $1}')"
  [ -n "$EXPECTED" ] && [ "$ACTUAL" = "$EXPECTED" ] || { echo "Node checksum mismatch" >&2; exit 1; }
  tar -xzf "$BASE/$NAME.tar.gz" -C "$BASE"
  export PATH="$BASE/$NAME/bin:$PATH"
fi
exec node scripts/install.mjs
