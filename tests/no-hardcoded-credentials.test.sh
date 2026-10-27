#!/usr/bin/env bash
# Fails if any tracked text file assigns a literal password/secret/token, and checks the
# Hostinger scripts refuse to run without environment credentials.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -I - <<'PY'
import re, subprocess, sys
pat = re.compile(r"""(password|passwd|secret|token)\s*[:=]\s*['"]([^'"]{6,})['"]""", re.I)
bad = []
for f in subprocess.run(["git", "ls-files"], capture_output=True, text=True, check=True).stdout.split():
    if f.endswith((".png", ".jpg", ".webp", ".svg", ".zip", ".ico")) or f.startswith("tests/"):
        continue
    try:
        text = open(f, encoding="utf-8", errors="ignore").read()
    except OSError:
        continue
    for n, line in enumerate(text.splitlines(), 1):
        m = pat.search(line)
        if m and not re.search(r"REPLACE|YOUR|TU_|example", m.group(2), re.I):
            bad.append(f"{f}:{n}")
if bad:
    print("FAIL: literal credentials in", ", ".join(bad)); sys.exit(1)
print("ok - no literal credentials in tracked files")
PY
STUB="$(mktemp -d)"; trap 'rm -rf "$STUB"' EXIT
mkdir -p "$STUB/ssh2" && echo "module.exports = { Client: function () { throw new Error('must not connect'); } };" > "$STUB/ssh2/index.js"
for s in scripts/backup-hostinger.js caretech-games-pwa-deployment-v1/scripts/backup-hostinger.js caretech-games-pwa-deployment-v1/scripts/deploy-hostinger.js; do
  if out="$(env -i PATH="$PATH" NODE_PATH="$STUB" node "$s" 2>&1)"; then echo "FAIL: $s ran without credentials"; exit 1; fi
  echo "$out" | grep -q "Faltan variables" || { echo "FAIL: $s did not report missing variables"; exit 1; }
  echo "ok - $s refuses to run without credentials"
done
echo "PASS"
