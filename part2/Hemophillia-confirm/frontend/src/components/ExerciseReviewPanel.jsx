import React, { useEffect, useState } from "react";
import api from "../apiClient";

const ExerciseReviewPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("staffAuthToken");
      const response = await api.get("/exercise-recommendations/doctor/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data?.recommendations || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load exercise reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    try {
      setBusy(`${action}:${id}`);
      setError("");
      setSuccess("");
      const token = localStorage.getItem("staffAuthToken");
      const response = await api.post(`/exercise-recommendations/doctor/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.filter((x) => String(x._id) !== String(id)));
      setSuccess(response.data?.message || "Exercise plan updated.");
      window.setTimeout(() => setSuccess(""), 3200);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update exercise recommendation.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="exercise-review-panel">
      <div className="exercise-review-head">
        <div>
          <span className="exercise-review-eyebrow">REHABILITATION</span>
          <h2>Exercise Recommendations to Review</h2>
          <p>Rule-based exercise plans for your assigned patients. Nothing here reaches a patient until you approve it.</p>
        </div>
        <span className="exercise-review-count">{items.length}</span>
      </div>

      {error && <div className="exercise-review-error">{error}</div>}
      {success && <div className="exercise-review-success">✓ {success}</div>}

      {loading ? (
        <div className="exercise-review-empty">Loading exercise recommendations…</div>
      ) : items.length === 0 ? (
        <div className="exercise-review-empty">No exercise recommendations are waiting for review.</div>
      ) : (
        <div className="exercise-review-list">
          {items.map((item) => (
            <div className="exercise-review-item" key={String(item._id)}>
              <div className="exercise-review-patient">
                <div className="exercise-review-avatar">{(item.patientName || "P").slice(0,1).toUpperCase()}</div>
                <div><strong>{item.patientName}</strong><span>{item.patientId}</span></div>
              </div>
              <div className="exercise-review-main">
                <strong>{item.exerciseName}</strong>
                <span>{item.joint ? `${item.joint} · ` : "General · "}{item.category}</span>
                <p>{item.purpose}</p>
                <div className="exercise-review-meta">{item.sets} sets · {item.repetitionsOrDuration} · {item.frequency}</div>
              </div>
              <div className="exercise-review-actions">
                <button className="exercise-approve" disabled={busy} onClick={() => act(item._id, "approve")}>{busy === `approve:${item._id}` ? "Approving…" : "Approve"}</button>
                <button className="exercise-remove" disabled={busy} onClick={() => act(item._id, "remove")}>{busy === `remove:${item._id}` ? "Removing…" : "Remove"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .exercise-review-panel{margin:22px 0 34px;padding:22px;background:#fff;border:1px solid #dce5f0;border-radius:16px;box-shadow:0 12px 32px rgba(30,48,95,.06)}
        .exercise-review-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.exercise-review-eyebrow{font-size:10px;letter-spacing:1.2px;font-weight:800;color:#4a7dfc}.exercise-review-head h2{margin:5px 0;font-size:21px;color:#202d47}.exercise-review-head p{margin:0;color:#7a899e;font-size:12px}.exercise-review-count{min-width:36px;height:36px;padding:0 10px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:#eef3ff;color:#315dd0;font-weight:800}
        .exercise-review-error,.exercise-review-success{margin-top:14px;padding:11px 13px;border-radius:9px;font-size:12px}.exercise-review-error{background:#fff2f2;color:#a33b3b;border:1px solid #efcaca}.exercise-review-success{background:#eef9f3;color:#287d52;border:1px solid #cce8d8}.exercise-review-empty{padding:28px 10px;text-align:center;color:#8996a8;font-size:13px}
        .exercise-review-list{margin-top:16px;display:grid;gap:11px}.exercise-review-item{display:grid;grid-template-columns:190px 1fr auto;gap:17px;align-items:center;padding:15px;border:1px solid #e3e8f0;border-radius:12px;background:#fbfcff}.exercise-review-patient{display:flex;align-items:center;gap:10px}.exercise-review-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#edf2ff;color:#315dd0;font-weight:800}.exercise-review-patient strong,.exercise-review-patient span{display:block}.exercise-review-patient strong{font-size:12px}.exercise-review-patient span{margin-top:3px;font-size:10px;color:#8794a8}.exercise-review-main strong{display:block;font-size:14px;color:#24324c}.exercise-review-main>span{display:block;margin-top:3px;font-size:10px;color:#4a7dfc;font-weight:700}.exercise-review-main p{margin:5px 0;color:#77879b;font-size:11px}.exercise-review-meta{font-size:10px;color:#8a97a9}.exercise-review-actions{display:flex;gap:7px}.exercise-review-actions button{border-radius:8px;padding:9px 12px;font-size:11px;font-weight:800;cursor:pointer}.exercise-approve{border:1px solid #bfe2cf;background:#eff9f3;color:#247a4d}.exercise-remove{border:1px solid #eccaca;background:#fff4f4;color:#a33c3c}.exercise-review-actions button:disabled{opacity:.55;cursor:not-allowed}
        @media(max-width:800px){.exercise-review-item{grid-template-columns:1fr}.exercise-review-actions{justify-content:flex-start}}
      `}</style>
    </section>
  );
};

export default ExerciseReviewPanel;
