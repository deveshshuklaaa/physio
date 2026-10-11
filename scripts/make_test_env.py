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
    # Both stacks live on one box, so every published host port must differ --
    # otherwise starting a profiled service in test fails with a bind error that
    # reads like a code fault. Prod keeps 5001 and 8888 by default (APP-T2).
    "STAGE_PORT": "5101",
    "EMG_UDP_PORT": "8889",
}

# Keys dropped entirely from the test env.
#   MONGO_URI_STAGE -- names hemophilia_stage, which APP-C9 reserves for the
#   Phase 9 migration dry run.  Leaving it would also trip the APP-T12 C4 guard.
DROP = {"MONGO_URI_STAGE"}

# Any env value naming one of these databases fails the write.
FORBIDDEN_DBS = ("hemophilia", "hemophilia_stage")

TEST_DB = "hemophilia_test"

# Keys that belong in .env.secrets.  The production checkout may predate the
# secrets split (branch `server` keeps them inside .env), in which case they are
# moved out here rather than left where config/secrets.js will not look.
SECRET_KEYS = ("JWT_SECRET", "CSFLE_MASTER_KEY", "CSFLE_DATA_KEY_ID")


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
        "# --- APP-T3: CRYPT_SHARED_LIB is inherited from production's env file when",
        "# present -- same variable the 'server' deploy branch uses. On aarch64 it is",
        "# ./mongodb_crypt/lib/mongo_crypt_v1.so; on x86_64 leave it unset and the",
        "# committed x86_64 build is used.",
        "# SECURITY.md 2.4: a library that cannot load does NOT fail the boot;",
        "# CSFLE degrades to cleartext.  './dev verify' C5 checks the arch.",
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
    if not (prod / ".env").is_file():
        sys.exit(f"{prod/'.env'} not found -- is {prod} the production checkout?")
    split_needed = not (prod / ".env.secrets").is_file()

    body, notes = build(prod / ".env")

    # Split the secrets out of .env when the source has no .env.secrets.
    secrets_lines, kept = [], []
    keep_existing_secrets = False
    if split_needed:
        for line in body.splitlines():
            key, _ = split_line(line)
            if key in SECRET_KEYS:
                secrets_lines.append(line)
            else:
                kept.append(line)
        missing = [k for k in SECRET_KEYS if not any(split_line(l)[0] == k for l in secrets_lines)]
        if missing:
            # The source may keep these outside .env entirely -- the `server`
            # deploy branch reads the master key from master-key.txt, so .env
            # legitimately has no CSFLE_* at all. Accept an .env.secrets that is
            # already present here (same cluster, same vault, same single DEK)
            # and leave it untouched rather than inventing values.
            here = ROOT / ".env.secrets"
            have = [k for k in missing
                    if (here.is_file() and any(split_line(l)[0] == k
                                               for l in here.read_text().splitlines()))]
            if sorted(have) != sorted(missing):
                still = [k for k in missing if k not in have]
                sys.exit(
                    f"cannot find {still}.\n"
                    f"  The source .env does not carry them -- the production checkout keeps the\n"
                    f"  master key in part2/Hemophillia-confirm/backend/master-key.txt instead, so\n"
                    f"  there is nothing to split out.\n\n"
                    f"  This branch's config/secrets.js reads them from .env.secrets and fails\n"
                    f"  closed, so they must be supplied. Copy the working .env.secrets in:\n"
                    f"      scp <laptop>:<repo>/.env.secrets {ROOT}/.env.secrets\n"
                    f"      chmod 600 {ROOT}/.env.secrets\n"
                    f"  Same Atlas cluster, same encryption.__keyVault, same single DEK, so the\n"
                    f"  values are identical by design (docs/20 §2.2). Then re-run this.")
            keep_existing_secrets = True
            notes.append(f"{', '.join(missing)} taken from the existing .env.secrets here "
                         f"(the source keeps them outside .env)")
            # Do not re-add a key the destination already defines: duplicates in
            # an env file are resolved by last-wins, which silently picks whichever
            # value happens to come last if the two ever differ.
            present = {split_line(l)[0] for l in here.read_text().splitlines()
                       if split_line(l)[0]} if here.is_file() else set()
            secrets_lines = [l for l in secrets_lines
                             if split_line(l)[0] not in missing
                             and split_line(l)[0] not in present]
        body = "\n".join(kept) + "\n"
        if secrets_lines:
            notes.append(f"split {', '.join(split_line(l)[0] for l in secrets_lines)} out of the source .env")

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
    if keep_existing_secrets:
        print("  .env.secrets: LEFT AS IT IS here -- it already holds the keys the source lacks")
    elif split_needed:
        print("  .env.secrets: GENERATED by splitting the secret keys out of the source .env")
    else:
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
    if keep_existing_secrets:
        if secrets_lines:   # merge any keys that WERE in the source .env
            with (ROOT / ".env.secrets").open("a") as fh:
                fh.write("\n# appended by make_test_env.py from the source .env\n")
                fh.write("\n".join(secrets_lines) + "\n")
            print("  .env.secrets: appended the keys that were in the source .env")
    elif split_needed:
        header = ("# Generated by scripts/make_test_env.py -- the source checkout kept these\n"
                  "# inside .env (pre-dating the secrets split). Same values as production:\n"
                  "# test shares production's CSFLE keys by design (docs/20 §2.2).\n")
        (ROOT / ".env.secrets").write_text(header + "\n".join(secrets_lines) + "\n")
    else:
        shutil.copy2(prod / ".env.secrets", ROOT / ".env.secrets")
    (ROOT / ".env.secrets").chmod(0o600)
    print("\nwritten, mode 600. Now run:  ./dev verify")


if __name__ == "__main__":
    main()
