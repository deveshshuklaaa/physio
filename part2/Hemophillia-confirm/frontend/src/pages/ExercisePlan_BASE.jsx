import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";

const ExercisePlan = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/exercise-recommendations");
      setItems(response.data?.recommendations || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your exercise plan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const active = useMemo(
    () => items.filter((item) => item.status === "ACTIVE"),
    [items]
  );
  const pending = useMemo(
    () => items.filter((item) => item.status === "PENDING_DOCTOR_REVIEW"),
    [items]
  );

  return (
    <div className="exercise-page">
      <div className="exercise-shell">
        <button className="exercise-back" onClick={() => navigate("/awareness")}>← Back to Home</button>

        <header className="exercise-hero">
          <div className="exercise-hero-icon">✦</div>
          <div>
            <span className="exercise-eyebrow">PERSONALISED REHABILITATION</span>
            <h1>My Exercise Plan</h1>
            <p>Exercises recommended from your clinical profile and reviewed by your consulting doctor.</p>
          </div>
        </header>

        <div className="exercise-notice">
          <span>ⓘ</span>
          <div>
            <strong>Doctor review is required</strong>
            <p>New ML recommendations remain pending until your consulting doctor approves them.</p>
          </div>
        </div>

        {error && <div className="exercise-error">{error}</div>}

        {loading ? (
          <div className="exercise-empty">Loading your exercise plan…</div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="exercise-section">
                <div className="exercise-section-head">
                  <div>
                    <span className="exercise-section-label">ACTIVE PLAN</span>
                    <h2>Exercises approved for you</h2>
                  </div>
                  <span className="exercise-count">{active.length}</span>
                </div>
                <div className="exercise-grid">
                  {active.map((item) => <ExerciseCard key={item._id} item={item} active />)}
                </div>
              </section>
            )}

            {pending.length > 0 && (
              <section className="exercise-section">
                <div className="exercise-section-head">
                  <div>
                    <span className="exercise-section-label pending">WAITING FOR REVIEW</span>
                    <h2>Doctor review in progress</h2>
                  </div>
                  <span className="exercise-count pending-count">{pending.length}</span>
                </div>
                <div className="exercise-grid">
                  {pending.map((item) => <ExerciseCard key={item._id} item={item} />)}
                </div>
              </section>
            )}

            {active.length === 0 && pending.length === 0 && (
              <div className="exercise-empty">
                <div className="exercise-empty-icon">♡</div>
                <h3>No exercise recommendations yet</h3>
                <p>Complete your clinical details and your care team can generate a personalised plan.</p>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .exercise-page{min-height:100vh;background:linear-gradient(135deg,#eef3fa,#f8fbff);padding:32px 20px;color:#1d2a47;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .exercise-shell{width:min(1040px,100%);margin:0 auto}
        .exercise-back{border:0;background:transparent;color:#49698f;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:22px;padding:6px 0}
        .exercise-hero{display:flex;align-items:center;gap:18px;background:#fff;border:1px solid #dce5f0;border-radius:20px;padding:26px 28px;box-shadow:0 16px 45px rgba(30,48,95,.08)}
        .exercise-hero-icon{width:54px;height:54px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#24328f,#4a7dfc);color:#fff;font-size:24px}
        .exercise-eyebrow,.exercise-section-label{font-size:10px;letter-spacing:1.3px;font-weight:800;color:#4a7dfc}
        .exercise-hero h1{margin:5px 0 6px;font-size:30px}
        .exercise-hero p{margin:0;color:#71829a;font-size:14px;line-height:1.55}
        .exercise-notice{margin-top:16px;padding:14px 16px;display:flex;gap:11px;background:#eff8ff;border:1px solid #cfe2f4;border-radius:13px;color:#315d70}
        .exercise-notice p{margin:3px 0 0;color:#648499;font-size:12px}
        .exercise-error{margin-top:16px;padding:13px 15px;background:#fff2f2;border:1px solid #efcaca;border-radius:11px;color:#a33b3b;font-weight:600}
        .exercise-section{margin-top:25px;background:#fff;border:1px solid #dce5f0;border-radius:18px;padding:22px;box-shadow:0 12px 32px rgba(30,48,95,.06)}
        .exercise-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:17px}
        .exercise-section-head h2{margin:4px 0 0;font-size:20px}
        .exercise-section-label.pending{color:#b27820}.exercise-count{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#edf3ff;color:#315dd0;font-weight:800}.pending-count{background:#fff5df;color:#9a6719}
        .exercise-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
        .exercise-card{border:1px solid #e0e7f0;border-radius:15px;padding:18px;background:#fbfcff;transition:.2s}.exercise-card:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(30,48,95,.07)}
        .exercise-card-top{display:flex;justify-content:space-between;gap:10px}.exercise-card h3{margin:0;font-size:17px}.exercise-status{font-size:9px;font-weight:800;padding:5px 8px;border-radius:20px;white-space:nowrap;background:#e8f7ef;color:#278454}.exercise-status.pending{background:#fff5df;color:#9a6719}
        .exercise-purpose{color:#71829a;font-size:12px;line-height:1.5;margin:8px 0 15px}.exercise-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.exercise-meta div{background:#fff;border:1px solid #e5eaf1;border-radius:9px;padding:9px}.exercise-meta span{display:block;color:#8b98aa;font-size:9px;margin-bottom:3px}.exercise-meta strong{font-size:11px;color:#34445f}.exercise-joint{margin-top:12px;color:#49698f;font-size:11px;font-weight:700}.exercise-confidence{margin-top:8px;color:#7b8ba0;font-size:10px}
        .exercise-empty{margin-top:24px;padding:50px 20px;text-align:center;background:#fff;border:1px solid #dce5f0;border-radius:18px;color:#71829a}.exercise-empty-icon{font-size:30px;color:#4a7dfc}.exercise-empty h3{margin:10px 0 5px;color:#263650}.exercise-empty p{margin:0;font-size:13px}
        @media(max-width:720px){.exercise-page{padding:20px 12px}.exercise-hero{padding:20px}.exercise-hero h1{font-size:24px}.exercise-grid{grid-template-columns:1fr}.exercise-meta{grid-template-columns:1fr 1fr}}
      `}</style>
    </div>
  );
};

const ExerciseCard = ({ item, active }) => (
  <article className="exercise-card">
    <div className="exercise-card-top">
      <h3>{item.exerciseName}</h3>
      <span className={`exercise-status ${active ? "" : "pending"}`}>{active ? "Approved" : "Pending review"}</span>
    </div>
    <p className="exercise-purpose">{item.purpose || "Personalised rehabilitation exercise."}</p>
    <div className="exercise-meta">
      <div><span>Sets</span><strong>{item.sets ?? "—"}</strong></div>
      <div><span>Reps / Duration</span><strong>{item.repetitionsOrDuration || "—"}</strong></div>
      <div><span>Frequency</span><strong>{item.frequency || "As advised"}</strong></div>
    </div>
    {item.joint && <div className="exercise-joint">Target joint: {item.joint}</div>}
    {item.mlConfidence != null && <div className="exercise-confidence">ML confidence: {Math.round(item.mlConfidence * 100)}%</div>}
  </article>
);

export default ExercisePlan;
