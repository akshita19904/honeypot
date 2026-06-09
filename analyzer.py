import json
import sys
from collections import defaultdict

log_file = "logs.txt"
data_file = "data.json"

common_targets = [
    "admin",
    "root",
    "administrator",
    "guest"
]

suspicious_usernames = []
alerts = []

time_data = defaultdict(int)
ip_count = defaultdict(int)
username_count = defaultdict(int)

total_attempts = 0
brute_force_ips = []
skipped_lines = 0

try:
    with open(log_file, "r") as file:
        for line_num, line in enumerate(file, start=1):

            parts = line.strip().split("|")

            # Skip malformed lines
            if len(parts) < 4:
                print(f"[!] Skipping malformed line {line_num}: {line.strip()!r}")
                skipped_lines += 1
                continue

            total_attempts += 1

            timestamp = parts[0].strip()
            ip = parts[1].strip()
            username = parts[2].strip()
            password_hash = parts[3].strip()

            # Time-based analysis
            hour = timestamp[:13]
            time_data[hour] += 1

            # Count attacks
            ip_count[ip] += 1
            username_count[username] += 1

            # Suspicious usernames
            if username.lower() in common_targets:
                suspicious_usernames.append(username)

except FileNotFoundError:
    print(f"[!] {log_file} not found")
    sys.exit(1)

if skipped_lines:
    print(f"[!] {skipped_lines} malformed line(s) were skipped.")

# Brute-force detection
for ip, count in ip_count.items():
    if count >= 3:
        brute_force_ips.append(ip)

# Severity classification
if total_attempts < 3:
    severity = "LOW"
elif total_attempts < 8:
    severity = "MEDIUM"
else:
    severity = "HIGH"

# Generate alerts
if brute_force_ips:
    alerts.append("Brute force attack detected")

if suspicious_usernames:
    alerts.append("Suspicious usernames detected")

# Final report
data = {
    "total_attempts": total_attempts,
    "unique_ips": len(ip_count),
    "ip_data": dict(ip_count),
    "username_data": dict(username_count),
    "brute_force_ips": brute_force_ips,
    "suspicious_usernames": suspicious_usernames,
    "severity": severity,
    "alerts": alerts,
    "time_distribution": dict(time_data)
}

with open(data_file, "w") as file:
    json.dump(data, file, indent=4)

print(" Analysis complete.")
print(f" {data_file} created.")
print(f" Total Attempts: {total_attempts}")
print(f" Unique IPs: {len(ip_count)}")
print(f" Severity Level: {severity}")