#!/usr/bin/env python3
"""APP-T5 / APP-T6 -- derive the test clone's env files from production's.

Run from inside the TEST clone, pointing at the production checkout:

    venv/bin/python scripts/make_test_env.py ~/final_project
    venv/bin/python scripts/make_test_env.py ~/final_project --write

Without --write it prints what it would do and touches nothing.

Why a script and not hand-editing: docs/20 §2.3 makes one thing load-bearing --
the production MONGO_URI must not appear in the test env files, in any form,
commented out included.  Test shares production's CSFLE keys, so the crypto
layer authorises writes to both databases and this env var is the entire
barrier.  Editing that by hand, in a file full of secrets, over a chat window,
is how a prod URI survives into test.  This refuses to write a file that still
contains one.

.env.secrets is copied byte-for-byte on purpose (docs/20 §2.2): the test DB is a
copy of production's documents and is unreadable without production's keys.
That is lawful only while D35 holds -- no real patients, all data is test data --
and it reverses the day the first real patient registers.
"""

import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# What the test clone overrides.  Everything absent here is inherited by being
# identical, which is the whole constraint in docs/20 §0.
OVERRIDES = {
    "COMPOSE_PROJECT_NAME": "hemotest",
    "HTTP_PORT": "8080",
    "NODE_ENV": "development",
}

# Keys dropped entirely from the test env.
#   MONGO_URI_STAGE -- names hemophilia_stage, which APP-C9 reserves for the
#   Phase 9 migration dry run.  Leaving it would also trip the APP-T12 C4 guard.
DROP = {"MONGO_URI_STAGE"}

# Any env value naming one of these databases fails the write.
FORBIDDEN_DBS = ("hemophilia", "hemophilia_stage")

TEST_DB = "hemophilia_test"


def split_line(line):
    m = re.match(r"^(\s*)([A-Za-z_][A-Za-z0-9_]*)=(.*)$", line)
    return (m.group(2), m.group(3)) if m else (None, None)


def redact(s):
    return re.sub(r"://[^@/\s]*@", "://***@", s)


def retarget(value):
    """Point a mongodb URI at TEST_DB, whatever database it currently names."""
    return re.sub(
        r"(mongodb(?:\+srv)?://[^/\s'\"]+/)[A-Za-z0-9_-]*",
        lambda m: m.group(1) + TEST_DB,
        value,
    )


def forbidden(value):
    """True if value names a production/stage database."""
    for m in re.finditer(r"mongodb(?:\+srv)?://[^/\s'\"]+/([A-Za-z0-9_-]*)", value):
        if m.group(1) in FORBIDDEN_DBS:
            return m.group(1)
    return None


def build(prod_env: Path):
    out, seen, notes = [], set(), []
    for raw in prod_env.read_text().splitlines():
        key, value = split_line(raw)
        if key is None:
            # Comments and blanks are kept -- except a commented-out URI, which
            # docs/20 §2.3 bans explicitly.
            if forbidden(raw):
                notes.append(f"dropped comment naming a production DB: {redact(raw.strip())[:60]}")
                continue
            out.append(raw)
            continue
        if key in DROP:
            notes.append(f"dropped {key} (reserved for the Phase 9 dry run, APP-C9)")
            continue
        if key in OVERRIDES:
            out.append(f"{key}={OVERRIDES[key]}")
            notes.append(f"{key} -> {OVERRIDES[key]}")
            seen.add(key)
            continue
        hit = forbidden(value)
        if hit:
            new = retarget(value)
            out.append(f"{key}={new}")
            notes.append(f"{key}: database '{hit}' -> '{TEST_DB}'")
            continue
        out.append(raw)

    for key, val in OVERRIDES.items():
        if key not in seen and not any(split_line(l)[0] == key for l in out):
            out.append(f"{key}={val}")
            notes.append(f"{key}={val} (added)")

    out += [
        "",
        "# --- APP-T3: set this on the aarch64 VPS to the directory holding the",
        "# matching mongo_crypt_v1.so, copied from the production checkout (it is",
        "# NOT in git -- docs/19 §14.11).  Leave unset on x86_64.",
        "# SECURITY.md 2.4: a library that cannot load does NOT fail the boot;",
        "# CSFLE degrades to cleartext.  './dev verify' C5 checks the arch.",
        "# CRYPT_SHARED_DIR=mongo_crypt_shared_v1-linux-aarch64-enterprise-...",
        "",
        "# --- APP-C14, deferred: the attached block volume for photo bytes.",
        "# Not the boot volume -- a photo flood must not fill the OS disk.",
        "# PHOTO_DIR=/mnt/photos",
    ]
    return "\n".join(out) + "\n", notes


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    prod = Path(sys.argv[1]).expanduser().resolve()
    write = "--write" in sys.argv

    if prod == ROOT:
        sys.exit(f"source and destination are the same checkout ({ROOT}).\n"
                 "Run this from the TEST clone, passing the PRODUCTION checkout as the argument.")
    for name in (".env", ".env.secrets"):
        if not (prod / name).is_file():
            sys.exit(f"{prod/name} not found -- is {prod} the production checkout?")

    body, notes = build(prod / ".env")

    hit = forbidden(body)
    if hit:
        sys.exit(f"REFUSING TO WRITE: the result still names database '{hit}'.\n"
                 "  docs/20 §2.3 -- with keys shared, this env var is the only barrier\n"
                 "  between test code and production data. Fix the source or this script.")

    print(f"production : {prod}")
    print(f"test clone : {ROOT}")
    print()
    for n in notes:
        print(f"  {n}")
    print("  .env.secrets: copied byte-for-byte (shared CSFLE keys, docs/20 §2.2)")
    print()

    if not write:
        print("dry run -- nothing written. Re-run with --write to apply.")
        return

    for name in (".env", ".env.secrets"):
        dst = ROOT / name
        if dst.exists():
            bak = dst.with_suffix(dst.suffix + ".bak")
            shutil.copy2(dst, bak)
            print(f"  backed up existing {name} -> {bak.name}")

    (ROOT / ".env").write_text(body)
    (ROOT / ".env").chmod(0o600)
    shutil.copy2(prod / ".env.secrets", ROOT / ".env.secrets")
    (ROOT / ".env.secrets").chmod(0o600)
    print("\nwritten, mode 600. Now run:  ./dev verify")


if __name__ == "__main__":
    main()
