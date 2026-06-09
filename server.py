import socket
import datetime
import hashlib
import time

HOST = "0.0.0.0"
PORT = 2222


def receive_input(client):
    """
    Receives input from client and cleans carriage returns/newlines.
    Returns 'EMPTY' if no data entered.
    """
    data = client.recv(1024).decode(errors="ignore")
    data = data.replace("\r", "").replace("\n", "").strip()

    if not data:
        return "EMPTY"

    return data


# Create honeypot socket
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Allow immediate port reuse after restart
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

server.bind((HOST, PORT))
server.listen(5)

print(f"[+] Honeypot running on {HOST}:{PORT}")

while True:
    client, addr = server.accept()
    attacker_ip = addr[0]

    print(f"[+] Connection received from {attacker_ip}")

    try:
        # Simulate SSH banner
        client.send(b"SSH-2.0-OpenSSH_7.4\r\n")
        time.sleep(0.5)

        # Ask for username
        client.send(b"Username: ")
        username = receive_input(client)

        # Ask for password
        client.send(b"Password: ")
        password = receive_input(client)

        print(f"[DEBUG] Captured -> Username: {username}, Password: {password}")

        # Hash password using SHA-256
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        # Create log entry
        log_entry = (
            f"{datetime.datetime.now()} | "
            f"{attacker_ip} | "
            f"{username} | "
            f"{hashed_password}\n"
        )

        # Save to logs
        with open("logs.txt", "a") as log_file:
            log_file.write(log_entry)

        # Always deny login
        client.send(b"Login failed\r\n")

    except Exception as e:
        print(f"[ERROR] {e}")

    finally:
        client.close()