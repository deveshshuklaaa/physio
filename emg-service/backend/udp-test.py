import socket
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.bind(('0.0.0.0', 8888))
print("listening on 8888")
while 1:
    print(s.recvfrom(1024))
