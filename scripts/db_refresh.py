#!/usr/bin/env python3
"""APP-T7 -- refresh the test database from production.  On demand, never on a cron.

Copies every collection of the SOURCE database into the TARGET database,
documents and index definitions, dropping the target's collections first.

Why not mongodump/mongorestore: those are a separate package that is not on the
VPS, and the alternative is pulling a ~700 MB image to move 10 MB of documents.
pymongo is already in the root venv (docs/19 §8 constraint 15) and the data is
small -- measured 2026-10-11 at 682 documents across 16 collections.

Encrypted fields: this deliberately connects WITHOUT auto-encryption, so CSFLE
values are read and written back as opaque BinData subtype 6 -- ciphertext is
copied verbatim.  That is only readable in the target because test shares
production's keys (docs/20 §2.2), and it is the whole reason a copy works at all.

The key vault (encryption.__keyVault) is NOT copied.  It is shared in place.

Usage, from the clone whose .env names the target:
    venv/bin/python scripts/db_refresh.py            # confirm, then copy
    venv/bin/python scripts/db_refresh.py --yes      # no prompt
    venv/bin/python scripts/db_refresh.py --dry-run  # report only
"""

import argparse
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parent.parent

# Collections never copied: the key vault is shared in place, not duplicated.
EXCLUDE_DB = {"admin", "local", "config", "encryption"}

# APP-T6 / docs/20 §2.3: the hard guard.  Keys are shared with production, so
# the crypto layer authorises writes to BOTH databases -- the only thing
# stopping this script from overwriting production is this check.
TARGET_MUST_MATCH = re.compile(r"_test$")


def envget(path: Path, key: str):
    """Read one key from an env file without sourcing it (these hold secrets)."""
    if not path.is_file():
        return None
    pat = re.compile(rf"^\s*{re.escape(key)}=['\"]?(.*?)['\"]?\s*$")
    found = None
    for line in path.read_text().splitlines():
        m = pat.match(line)
        if m:
            found = m.group(1)
    return found


def db_of(uri: str):
    path = urlsplit(uri).path.lstrip("/")
    return path.split("?")[0] or None


def with_db(uri: str, name: str):
    p = urlsplit(uri)
    return urlunsplit((p.scheme, p.netloc, "/" + name, p.query, p.fragment))


def redact(uri: str):
    return re.sub(r"://[^@/]*@", "://***@", uri)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source-db", default="hemophilia",
                    help="database to copy FROM (default: hemophilia)")
    ap.add_argument("--target-db", default=None,
                    help="override the target from .env (the _test suffix rule still applies)")
    ap.add_argument("--yes", action="store_true", help="skip the confirmation prompt")
    ap.add_argument("--dry-run", action="store_true", help="report what would happen")
    args = ap.parse_args()

    uri = envget(ROOT / ".env", "MONGO_URI")
    if not uri:
        sys.exit("MONGO_URI not found in .env -- run this from the clone you want to refresh.")

    target = args.target_db or db_of(uri)
    if args.target_db:
        uri = with_db(uri, args.target_db)
    if not target:
        sys.exit(f"MONGO_URI names no database: {redact(uri)}")

    # --- the guard, before any connection is opened
    if not TARGET_MUST_MATCH.search(target):
        sys.exit(
            f"refusing to write to '{target}'.\n"
            f"  This script only writes to a database whose name ends in '_test'.\n"
            f"  docs/20 §2.3: test shares production's encryption keys, so nothing below\n"
            f"  the application layer would stop this from overwriting real data."
        )
    if target == args.source_db:
        sys.exit(f"source and target are both '{target}' -- nothing to do.")

    try:
        from pymongo import MongoClient
    except ImportError:
        sys.exit("pymongo missing. Install into the ROOT venv only (§8 constraint 15):\n"
                 "  venv/bin/pip install pymongo motor")

    # No auto_encryption: copy ciphertext verbatim (see module docstring).
    client = MongoClient(uri, serverSelectionTimeoutMS=15000)
    src, dst = client[args.source_db], client[target]

    names = sorted(c for c in src.list_collection_names() if not c.startswith("system."))
    if not names:
        sys.exit(f"source database '{args.source_db}' has no collections -- wrong cluster?")

    total = sum(src[c].estimated_document_count() for c in names)
    print(f"cluster : {redact(uri)}")
    print(f"source  : {args.source_db}  ({len(names)} collections, ~{total} documents)")
    print(f"target  : {target}  <- DROPPED AND REPLACED")
    print(f"skipped : key vault (encryption.__keyVault) is shared, not copied")
    print()

    if args.dry_run:
        for c in names:
            print(f"  would copy {c:32s} {src[c].estimated_document_count():6d} docs")
        return

    if not args.yes:
        if input(f"drop and replace '{target}'? [y/N] ").strip().lower() != "y":
            sys.exit("aborted.")

    copied = 0
    for name in names:
        dst[name].drop()
        docs = list(src[name].find({}))
        if docs:
            # ordered=False so one bad document does not abandon the rest.
            dst[name].insert_many(docs, ordered=False)
        # Index definitions matter: a missing unique index turns a duplicate-key
        # bug into silent data corruption that only test would have caught.
        for idx in src[name].list_indexes():
            spec = dict(idx)
            key = list(spec.pop("key").items())
            spec.pop("v", None)
            spec.pop("ns", None)
            iname = spec.pop("name")
            if iname == "_id_":
                continue
            try:
                dst[name].create_index(key, name=iname, **spec)
            except Exception as exc:              # partial/expression indexes vary by version
                print(f"    ! index {iname} on {name}: {type(exc).__name__}: {exc}")
        copied += len(docs)
        print(f"  {name:32s} {len(docs):6d} docs")

    print(f"\ndone: {copied} documents into '{target}'.")
    print("Encrypted fields were copied as ciphertext and are readable only because")
    print("test shares production's CSFLE keys (docs/20 §2.2).")


if __name__ == "__main__":
    main()
