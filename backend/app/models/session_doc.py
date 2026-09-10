"""G2-D3 -- the physiosessions schema (integration plan §4), as Pydantic, and
its index creation.

This model is documentation-and-optional-validation, not the write path:
motor speaks plain dicts, and app/routes/session.py builds the insert/update
dicts directly (that is the schema in code that actually goes over the wire).
Pydantic has no native BSON ObjectId type, so `patientUserId` etc. are typed
`Any` here -- they hold either a real `bson.ObjectId` or, for old-style test
fixture ids, a plain string (see app/db.py's `to_object_id`).

Indexes are the exact four from §4, created idempotently: `create_index()` is
a no-op if an identical index (same keys + options) already exists.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, List, Literal, Optional

from pydantic import BaseModel, Field


class RepLogEntry(BaseModel):
    rep: int
    clean: bool
    bestAngle: Optional[float] = None
    errors: List[str] = Field(default_factory=list)


class ReportBlock(BaseModel):
    text: Optional[str] = None
    language: Optional[str] = None
    model: Optional[str] = None
    promptVersion: Optional[str] = None
    generatedAt: Optional[datetime] = None
    error: Optional[str] = None


class VideoBlock(BaseModel):
    path: Optional[str] = None
    bytes: Optional[int] = None
    mimeType: Optional[str] = None
    consentVideoMonitoring: bool = False
    expiresAt: Optional[datetime] = None
    deletedAt: Optional[datetime] = None


class ClinicalBlock(BaseModel):
    """§4: everything sensitive lives under here -- one future schemaMap
    entry for CSFLE. Never flatten a field out of this subtree for query
    convenience; the queryable metrics (repCount, startedAt, status) already
    live outside it."""

    repLog: List[RepLogEntry] = Field(default_factory=list)
    report: ReportBlock = Field(default_factory=ReportBlock)
    video: VideoBlock = Field(default_factory=VideoBlock)


class PhysioSession(BaseModel):
    """Mirrors docs/09_integration_plan_group_2_ui_integration.md §4 exactly."""

    sessionId: str
    patientUserId: Any  # ObjectId -> users._id -- the only authorization key (§3)
    patientId: Optional[str] = None  # PATxxxxxx, display only, never authorize on this
    recommendationId: Any = None  # ObjectId -> patientexerciserecommendations, nullable
    doctorUserId: Any = None  # ObjectId snapshot of hemophiliadetails.consultingDoctorId

    # G2-G6: session display language ("en"|"hi"|"mr"). The Gemini report is
    # generated in this language; clinical.report.language records what was
    # actually produced.
    language: str = "en"

    exerciseId: str  # theirs
    engineExercise: str  # ours

    startedAt: datetime
    endedAt: Optional[datetime] = None
    durationS: Optional[float] = None

    repCount: int = 0
    cleanReps: int = 0

    status: Literal["active", "ended", "reported", "failed"] = "active"

    clinical: ClinicalBlock = Field(default_factory=ClinicalBlock)

    createdAt: datetime
    updatedAt: datetime


async def ensure_indexes(db) -> None:
    """§4's four indexes on physiosessions, idempotent at startup."""
    await db.physiosessions.create_index(
        "sessionId", unique=True, name="sessionId_unique"
    )
    await db.physiosessions.create_index(
        [("patientUserId", 1), ("startedAt", -1)], name="patientUserId_startedAt"
    )
    await db.physiosessions.create_index(
        [("doctorUserId", 1), ("startedAt", -1)], name="doctorUserId_startedAt"
    )
    await db.physiosessions.create_index(
        "clinical.video.expiresAt", name="video_expiresAt"
    )


if __name__ == "__main__":
    # Runnable self-check: the model round-trips §4's shape, and
    # ensure_indexes issues exactly the four calls §4 specifies.
    import asyncio

    now = datetime.utcnow()
    session = PhysioSession(
        sessionId="s_demo",
        patientUserId="p1",
        exerciseId="heel_slides",
        engineExercise="heel_slide",
        startedAt=now,
        createdAt=now,
        updatedAt=now,
    )
    assert session.status == "active"
    assert session.clinical.repLog == []
    assert session.clinical.video.consentVideoMonitoring is False

    class _FakeCollection:
        def __init__(self):
            self.calls = []

        def create_index(self, keys, **kwargs):
            self.calls.append((keys, kwargs))

            async def _noop():
                return "ok"
            return _noop()

    class _FakeDb:
        def __init__(self):
            self.physiosessions = _FakeCollection()

    async def _run():
        db = _FakeDb()
        await ensure_indexes(db)
        assert len(db.physiosessions.calls) == 4, (
            f"expected 4 index calls, got {len(db.physiosessions.calls)}"
        )
        keys = [c[0] for c in db.physiosessions.calls]
        assert "sessionId" in keys
        assert [("patientUserId", 1), ("startedAt", -1)] in keys
        assert [("doctorUserId", 1), ("startedAt", -1)] in keys
        assert "clinical.video.expiresAt" in keys
        unique_calls = [c for c in db.physiosessions.calls if c[1].get("unique")]
        assert len(unique_calls) == 1 and unique_calls[0][0] == "sessionId", (
            "sessionId must be the only unique index"
        )

    asyncio.run(_run())
    print("OK: app/models/session_doc.py self-check passed")
