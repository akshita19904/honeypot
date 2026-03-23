import socket
import datetime
import hashlib
import time

HOST = "0.0.0.0"
PORT = 2222

def receive_input(client):
    data = client.recv(1024).decode()
    return data.replace("\r", "").replace("\n", "").strip()

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind((HOST, PORT))
server.listen(5)

print("🚨 Honeypot running on port 2222...")

while True:
    client, addr = server.accept()
    print(f"Connection from {addr}")

    try:
        client.send(b"SSH-2.0-OpenSSH_7.4\r\n")
        time.sleep(0.5)

        # USERNAME
        client.send(b"Username: ")
        username = receive_input(client)

        # PASSWORD
        client.send(b"Password: ")
        password = receive_input(client)

        print(f"[DEBUG] Username: {username}, Password: {password}")

        # HASH PASSWORD
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        log = f"{datetime.datetime.now()} | {addr[0]} | {username} | {hashed_password}\n"

        with open("logs.txt", "a") as f:
            f.write(log)

        client.send(b"Login failed\r\n")

    except Exception as e:
        print("Error:", e)

    finally:
        client.close()
