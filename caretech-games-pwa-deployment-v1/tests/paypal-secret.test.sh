#!/usr/bin/env bash
# Verifies PayPal credentials never leave the server: pricing files and the public pricing endpoint.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8765}"
fail() { echo "FAIL: $1"; exit 1; }

# 1. No credential keys in any shipped JSON/PHP default.
if grep -rEq '"paypalClient(Id|Secret)"[[:space:]]*:' config portal; then fail "credential key in pricing.json"; fi
if grep -Eq "'paypalClient(Id|Secret)'[[:space:]]*=>" portal/api.php; then fail "hardcoded credential in api.php"; fi
echo "ok - no credentials in public files"

# 2. Endpoint strips credentials even if someone puts them back in pricing.json.
WORK="$(mktemp -d)"; trap 'kill "${SERVER_PID:-}" 2>/dev/null || true; rm -rf "$WORK"' EXIT
mkdir -p "$WORK/public_html/games/config" "$WORK/caretech-private"
cp portal/api.php "$WORK/public_html/games/api.php"
python3 -I - "$WORK/public_html/games/config/pricing.json" config/pricing.json <<'PY'
import json, sys
d = json.load(open(sys.argv[2])); d["paypalClientId"] = "TEST_ID_SHOULD_NOT_LEAK"; d["paypalClientSecret"] = "TEST_SECRET_SHOULD_NOT_LEAK"; d["webhookSecret"] = "TEST_WEBHOOK_SHOULD_NOT_LEAK"
json.dump(d, open(sys.argv[1], "w"))
PY
php -S "127.0.0.1:$PORT" -t "$WORK/public_html" >/dev/null 2>&1 & SERVER_PID=$!
for _ in $(seq 1 50); do curl -s "http://127.0.0.1:$PORT/" >/dev/null 2>&1 && break; sleep 0.1; done
for url in "/games/api.php?action=pricing" "/games/api.php/api/v1/games/pricing"; do
  body="$(curl -s "http://127.0.0.1:$PORT$url")"
  echo "$body" | grep -q '"success":true' || fail "$url did not return pricing"
  echo "$body" | grep -q '"plans"' || fail "$url lost plans"
  echo "$body" | grep -qiE 'SHOULD_NOT_LEAK|clientSecret|clientId' && fail "$url leaks credentials"
  echo "ok - $url returns pricing without credentials"
done

# 3. Credentials load from the private file outside the web root.
cat > "$WORK/caretech-private/paypal.php" <<'PHP'
<?php return ['clientId' => 'id-from-private', 'clientSecret' => 'secret-from-private'];
PHP
php -r '
$_SERVER["DOCUMENT_ROOT"] = $argv[1]; $_GET = []; $_SERVER["REQUEST_METHOD"] = "CLI"; $_SERVER["REQUEST_URI"] = "/noop";
ob_start(); include $argv[1] . "/games/api.php"; ob_end_clean();
$ok = ($privatePaypalConfig["clientId"] ?? null) === "id-from-private" && ($privatePaypalConfig["clientSecret"] ?? null) === "secret-from-private";
exit($ok ? 0 : 1);
' "$WORK/public_html" || fail "credentials not loaded from private file"
echo "ok - credentials load from caretech-private/paypal.php"
echo "PASS"
