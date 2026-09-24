# docker commands. me write. you read.

grunt this file say what command me type, and why. short word. no fancy.

---

## step 1. me look first, not build blind

```
cat backend/tools/test_k_compose.py
cat backend/tools/test_k_gate.py
```
why: test file say what pass mean. me no guess. me read law first.

```
ls -la
ls backend
cat backend/Dockerfile
ls emg-service
cat emg-service/backend/app.py
ls frontend
cat backend/app/services/emg_client.py
```
why: look what already here before add new thing. no build twice.

---

## step 2. me check docker alive

```
id -nG
sg docker -c "docker info"
```
why: this shell no have docker group yet. `sg docker -c "..."` = borrow docker group for one command. no sudo. no touch permission file.

---

## step 3. static check, no docker needed yet

```
cd backend && ../venv/bin/python tools/test_k_compose.py
```
why: check compose file shape and env var wiring, fast, no daemon needed. run early, run often, cheap.

---

## step 4. real docker gate, first try

```
cd backend && sg docker -c "../venv/bin/python tools/test_k_gate.py"
```
this builds image, run container, poke it, tear down. slow. me wait.

first try fail. numpy want python 3.12, image had python 3.11. me fix dockerfile:
```
FROM python:3.12-slim
```
(also fix emg-service and frontend dockerfile same way)

---

## step 5. try again, hit new wall: port taken

```
sg docker -c "docker ps"
```
why: see who eat port 8080. found: `traefik` container, not ours, some other project on same machine.

me no touch traefik. not mine. me no kill other guy stuff.

so me tell test to use different port, with env var test already understand:
```
K_FRONTEND_URL=http://127.0.0.1:8081 \
COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml \
sg docker -c "cd backend && ../venv/bin/python tools/test_k_gate.py"
```

`docker-compose.override.yml` = small extra file, say frontend port go 8081 not 8080. `COMPOSE_FILE=a:b` env var = tell docker compose "read both file, second file win." docker compose merge port list by add, not swap — so override file use `!override` tag to really replace:
```yaml
services:
  frontend:
    ports: !override
      - "8081:3000"
```

check compose see it right:
```
sg docker -c "COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml docker compose config"
```

---

## step 6. backend container die on boot

```
sg docker -c "docker logs final_project-backend-1"
```
error say: `python-multipart` missing, fastapi route need it at import time. venv on host have it (hidden, not pinned). me add to `backend/requirements.txt`:
```
python-multipart==0.0.32
```

clean up dead containers before retry:
```
sg docker -c "COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml docker compose down -v"
```

---

## step 7. run gate again, this time win

```
cd backend && sg docker -c "K_FRONTEND_URL=http://127.0.0.1:8081 COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml ../venv/bin/python tools/test_k_gate.py"
```
output say `PHASE K GATE PASSED`. good. gate script itself run `docker compose build`, `up -d`, poke stuff, `down -v` when done — me no type those by hand, script do it.

---

## step 8. clean up scratch file

```
rm docker-compose.override.yml
```
why: was just for this machine port fight. real `docker-compose.yml` still say port 8080, like spec want. delete scratch file so repo stay clean.

---

## step 9. final check both, for record

```
cd backend && ../venv/bin/python tools/test_k_compose.py
sg docker -c "cd backend && ../venv/bin/python tools/test_k_gate.py"
```
first one pass clean. second one, on THIS machine, still hit port 8080 fight with that other `traefik` container (not ours). on clean machine with no port 8080 squatter, same command just work, no env var trick needed.

---

## useful docker command, plain list

| command | what it do |
|---|---|
| `docker compose up --build` | build image, start all 3 service |
| `docker compose down -v` | stop and remove container + volume |
| `docker compose ps` | show what running |
| `docker compose logs <name>` | show log for one service |
| `docker ps -a` | show ALL container, even dead one |
| `docker logs <container>` | show log for one container by name |
| `sg docker -c "..."` | run docker command with docker group power, this shell session |

done. grunt out.
