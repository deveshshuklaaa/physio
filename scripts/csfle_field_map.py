#!/usr/bin/env python3
"""Print the CSFLE encrypted-field map for the Express backend.

Exists because this map was hand-counted three times during the APP-A debate and was
wrong three times: 15, then 104, then neither. Five declaration sites exist, and a
grep that knows about four of them silently undercounts. `docs/17` §A cites this
script's output rather than a typed table.

    venv/bin/python scripts/csfle_field_map.py          # summary
    venv/bin/python scripts/csfle_field_map.py --fields # every field

Styles handled:
  1. inline multi-line   field: { type: String, encrypt: { keyId, algorithm } }
  2. inline one-line     field: { type: String, encrypt: enc("Random") }
  3. schema alias        const encryptedString = { type, encrypt: {...} }  ->  field: encryptedString
  4. encrypt-value alias const RANDOM = { keyId, algorithm }              ->  field: { encrypt: RANDOM }
  5. hand-written schemaMap in config/db.js (not a model at all)
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODELS = ROOT / "part2/Hemophillia-confirm/backend/src/models"
DBCFG = ROOT / "part2/Hemophillia-confirm/backend/config/db.js"
ALG = r"(Deterministic|Random)"


def algo(txt):
    m = re.search(ALG, txt)
    return m.group(1) if m else "?"


def scan(path):
    txt = path.read_text()
    txt = re.sub(r"^\s*//.*$", "", txt, flags=re.M)      # strip line comments: several
    found = []                                            # models keep big commented blocks

    # styles 3 and 4: any top-level const whose body mentions encrypt OR keyId
    aliases = {}
    for m in re.finditer(r"const\s+([A-Za-z_]\w*)\s*=\s*\{(.*?)\}\s*;", txt, re.S):
        name, body = m.group(1), m.group(2)
        if "encrypt" in body or "keyId" in body:
            aliases[name] = algo(body)
    for name, alg in aliases.items():
        n = re.escape(name)
        for pat in (rf"^\s*([A-Za-z_]\w*)\s*:\s*{n}\s*,",          # field: encryptedString
                    rf"^\s*([A-Za-z_]\w*)\s*:\s*\{{\s*\.\.\.{n}",   # field: { ...alias }
                    rf"^\s*([A-Za-z_]\w*)\s*:\s*\{{[^}}]*encrypt\s*:\s*{n}"):  # field: {..., encrypt: RANDOM}
            for f in re.finditer(pat, txt, re.M):
                found.append((f.group(1), alg))

    # style 2: one-line inline
    for f in re.finditer(r"^\s*([A-Za-z_]\w*)\s*:\s*\{[^}]*encrypt[^}]*?" + ALG + r"[^}]*\}", txt, re.M):
        found.append((f.group(1), f.group(2)))

    # style 1: multi-line inline block -> nearest enclosing key
    lines, stack = txt.split("\n"), []
    for i, l in enumerate(lines):
        km = re.match(r"^(\s*)([A-Za-z_]\w*)\s*:\s*\{?\s*$", l)
        if km:
            ind = len(km.group(1))
            stack = [(d, k) for d, k in stack if d < ind] + [(ind, km.group(2))]
        if re.match(r"^\s*encrypt\s*:\s*\{?\s*$", l):
            a = algo("\n".join(lines[i:i + 6]))
            path_keys = [k for _, k in stack if k not in ("encrypt", "type", "properties", "bsonType")]
            if path_keys:
                found.append((path_keys[-1], a))

    seen, rows = set(), []
    for n, a in found:
        if n not in seen:
            seen.add(n); rows.append((n, a))
    return rows


def main():
    show = "--fields" in sys.argv
    total = det = 0
    print(f"{'model':30s} {'enc':>4s} {'det':>4s}")
    print("-" * 42)
    for f in sorted(MODELS.glob("*.js")):
        rows = scan(f)
        if not rows:
            continue
        d = sum(1 for _, a in rows if a == "Deterministic")
        total += len(rows); det += d
        print(f"{f.stem:30s} {len(rows):4d} {d:4d}")
        if show:
            for n, a in rows:
                print(f"     {a[:4]:5s} {n}")

    # style 5: the hand-written schemaMap
    extra = []
    if DBCFG.is_file():
        cfg = DBCFG.read_text()
        for m in re.finditer(r"\$\{DB_NAME\}\.(\w+)", cfg):
            extra.append(m.group(1))
        extra = sorted(set(extra))
    if extra:
        print("-" * 42)
        print(f"config/db.js hand-written schemaMap covers collections: {', '.join(extra)}")
        print("  -> these are NOT in any model file; count them separately (e.g. fhirresources.encryptedData)")

    print("-" * 42)
    print(f"TOTAL in models: {total} encrypted fields ({det} deterministic)")
    print("Deterministic supports equality queries; Random cannot be queried by value at all.")


if __name__ == "__main__":
    main()
