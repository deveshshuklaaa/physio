"""P3.T — pins the fail-closed doctor-link lookup (D24/D25/D28).

app/db.py's make_lookup_doctor_id is the ONE place that answers "which doctor
may see this patient". Both directions matter:

    (a) the demo patient resolves to the demo doctor, and
    (b) a control doctor / unrelated patient resolves to None, so that doctor
        is denied.

Half (b) is the point of this file. A single-patient test passes just as
happily against a system that hands every doctor every patient, which is the
failure §6.2 of the demo plan says is worse than showing less.

No database: make_lookup_doctor_id(db) takes db as a parameter -- that seam is
used here with a stub whose hemophiliadetails.find_one is an async function
returning canned documents. Offline, no Atlas credentials, no .env needed.

Run from backend/:  ../venv/bin/python app/test_doctor_lookup.py
"""
import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# app/db.py fails loudly at import without MONGO_URI (by design). Nothing here
# ever constructs a client, so a placeholder is enough -- and a placeholder is
# safer than whatever the real .env points at.
os.environ.setdefault("MONGO_URI", "mongodb://test-never-connected/")
os.environ.setdefault("MONGO_DB", "hemophilia_g2test")

from bson import ObjectId

from app.db import make_lookup_doctor_id

# The demo fixture (D24): one real patient/doctor pair, plus a control doctor
# who is linked to nobody and an unlinked patient who has no row at all.
P1 = ObjectId("650000000000000000000001")   # demo patient
P2 = ObjectId("650000000000000000000002")   # patient with NO hemophiliadetails row
P3 = ObjectId("650000000000000000000003")   # row exists, consultingDoctorId null
P4 = ObjectId("650000000000000000000004")   # S20: row points at a DELETED doctor
DOC_A = ObjectId("65000000000000000000000a")  # demo doctor, linked to P1
DOC_B = ObjectId("65000000000000000000000b")  # control doctor, linked to nobody
DOC_GONE = ObjectId("65000000000000000000000c")  # S20: no users document exists


class _FakeDetails:
    """Stands in for db.hemophiliadetails. find_one matches on the {"userId":
    ObjectId} filter db.py actually sends, so a lookup that stopped filtering
    by userId would return None here rather than a lucky first document."""

    def __init__(self, rows):
        self.rows = rows
        self.calls = []

    async def find_one(self, query, projection=None, **_kw):
        self.calls.append(query)
        return self.rows.get(query.get("userId"))


class _FakeUsers:
    """Stands in for db.users. S20: the lookup validates consultingDoctorId
    against this, so a doctor id absent here is a dangling reference."""

    def __init__(self, ids):
        self.ids = set(ids)
        self.calls = []

    async def find_one(self, query, projection=None):
        self.calls.append(query)
        oid = query.get("_id")
        return {"_id": oid} if oid in self.ids else None


class _FakeDB:
    def __init__(self, rows, user_ids=(DOC_A, DOC_B)):
        self.clinicalrecords = _FakeDetails(rows)
        self.users = _FakeUsers(user_ids)


ROWS = {
    P1: {"_id": ObjectId(), "userId": P1, "consultingDoctorId": DOC_A},
    # P2 deliberately absent -- the fail-closed branch.
    P3: {"_id": ObjectId(), "userId": P3, "consultingDoctorId": None},
    # S20: the shape real data already produced (PAT980086) -- a truthy
    # ObjectId whose users document was deleted.
    P4: {"_id": ObjectId(), "userId": P4, "consultingDoctorId": DOC_GONE},
}

_failures = []


def check(cond, label):
    if cond:
        print(f"  ok   {label}")
    else:
        print(f"  FAIL {label}")
        _failures.append(label)


def check_eq(got, want, label):
    check(got == want, f"{label} (got {got!r}, want {want!r})")


def demo():
    db = _FakeDB(ROWS)
    lookup = make_lookup_doctor_id(db)

    def run(pid):
        return asyncio.run(lookup(pid))

    # 1. Linked patient -> their doctor's id, as a string.
    got = run(str(P1))
    check_eq(got, str(DOC_A), "linked patient P1 resolves to doctor A")
    check(isinstance(got, str), "result is a str, not an ObjectId")

    # 5. ...and NOT some other doctor. Asserting truthiness here would pass a
    # system that authorizes every doctor for every patient.
    check(got != str(DOC_B), "P1's doctor is NOT control doctor B")

    # 2. No hemophiliadetails row at all -> None. THE fail-closed branch: this
    # is the one that breaks silently, and it denies docA too, not just docB.
    check_eq(run(str(P2)), None, "patient with no hemophiliadetails row -> None (fail-closed)")

    # 3. Row exists but consultingDoctorId is null, and the absent-field case.
    check_eq(run(str(P3)), None, "consultingDoctorId null -> None")
    db_missing_field = _FakeDB({P3: {"userId": P3}})
    check_eq(
        asyncio.run(make_lookup_doctor_id(db_missing_field)(str(P3))),
        None,
        "consultingDoctorId absent -> None",
    )

    # 3b. S20 -- dangling consultingDoctorId. Truthy, so a lookup that only
    # checks for null/absent returns it and fails OPEN-ish: it authorizes a
    # doctor who cannot exist, and the patient is invisible to every real one.
    check_eq(run(str(P4)), None, "dangling consultingDoctorId -> None (S20)")
    check(
        any(q.get("_id") == DOC_GONE for q in db.users.calls),
        "the lookup actually validates the doctor reference against users",
    )

    # 4. Junk ids must deny, not raise -- an exception here is a 500 on an
    # authorization path, and the caller's behaviour on a 500 is not denial.
    for junk in ("", None, "not-an-objectid", "../../etc/passwd", "0" * 100, 12345):
        check_eq(run(junk), None, f"non-ObjectId patient id {junk!r} -> None")

    # An unknown-but-valid patient id (never seeded) also denies.
    check_eq(run(str(ObjectId())), None, "unknown ObjectId patient -> None")

    # The lookup must key off the patient id it was given.
    check(
        all(q.get("userId") is not None for q in db.clinicalrecords.calls),
        "every find_one filters by userId",
    )

    # Whole-matrix restatement of D25: for each patient, exactly the right
    # doctor (or nobody) is authorized. This is the assertion a seed script
    # regression would trip.
    matrix = {str(P1): str(DOC_A), str(P2): None, str(P3): None, str(P4): None}
    for pid, expected in matrix.items():
        resolved = run(pid)
        check_eq(resolved, expected, f"matrix: patient {pid[-1]} -> {expected}")
        for doctor in (str(DOC_A), str(DOC_B)):
            authorized = resolved is not None and resolved == doctor
            should = expected == doctor
            check(
                authorized == should,
                f"matrix: doctor {doctor[-1]} {'may' if should else 'may NOT'} "
                f"access patient {pid[-1]}",
            )


if __name__ == "__main__":
    demo()
    if _failures:
        print(f"\n{len(_failures)} FAILED — SECURITY REGRESSION:")
        for f in _failures:
            print(f"  - {f}")
        sys.exit(1)
    print("\nALL DOCTOR-LINK LOOKUP CHECKS PASSED (D24/D25 fail-closed pinned)")
