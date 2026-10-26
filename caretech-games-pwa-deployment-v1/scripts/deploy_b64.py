import base64
import os
import subprocess

zip_path = "/Users/alexistarrifa/Documents/antigravity/clever-bardeen/caretech-games.zip"
with open(zip_path, "rb") as f:
    b64_data = base64.b64encode(f.read()).decode("utf-8")

print(f"Zip base64 length: {len(b64_data)}")

expect_script = f"""
set timeout 120
spawn ssh -p 65002 -o StrictHostKeyChecking=no u845296761@5.183.10.22 "cat > ~/domains/caretechservices.com/public_html/caretech-games.b64 && cd ~/domains/caretechservices.com/public_html && base64 -d caretech-games.b64 > caretech-games.zip && rm -f caretech-games.b64 && unzip -o caretech-games.zip && rm -f caretech-games.zip && echo 'DEPLOY_SUCCESS'"
expect {{
    "password:" {{
        send "Esteban\\$3451\\$\r"
        exp_continue
    }}
    "DEPLOY_SUCCESS" {{
        puts "DEPLOY_COMPLETED_OK"
        exp_continue
    }}
    eof
}}
"""

with open("/Users/alexistarrifa/Documents/antigravity/clever-bardeen/caretech-games-pwa-deployment-v1/scripts/deploy_pipe.exp", "w") as f:
    f.write(expect_script)

p = subprocess.Popen(
    ["expect", "/Users/alexistarrifa/Documents/antigravity/clever-bardeen/caretech-games-pwa-deployment-v1/scripts/deploy_pipe.exp"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

stdout, stderr = p.communicate(input=b64_data)
print("STDOUT:", stdout)
print("STDERR:", stderr)
