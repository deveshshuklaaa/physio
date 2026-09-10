import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../apiClient";

const ScreeningResultScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/chatbot/screening/${id}`);
        setSession(res.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load screening result. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDownload = () => {
    const url = `http://localhost:5000/api/reports/screening/${id}/pdf`;
    window.open(url, "_blank");
  };


  const riskConfig = {
    Low: { class: "badge-low", label: "Low Risk" },
    Moderate: { class: "badge-moderate", label: "Moderate Risk" },
    High: { class: "badge-high", label: "High Risk" },
    Emergency: { class: "badge-emergency", label: "Emergency" },
  };

  const currentRisk =
    riskConfig[session?.riskLevel] || riskConfig.Low;

  if (loading) {
    return <div style={{ padding: "40px" }}>Loading result...</div>;
  }

  if (error || !session) {
    return (
      <div style={{ padding: "40px", color: "red" }}>
        {error || "Result not found."}
      </div>
    );
  }

  return (
    <div className="result-page">
      <div className="result-glass">

        <h1 className="result-title">Your Screening Outcome</h1>
        <p className="result-subtitle">
          This summary is based on your answers and helps guide next steps.
        </p>

        <div className="result-top">
          <span className={`badge ${currentRisk.class}`}>
            {currentRisk.label}
          </span>

          <span className="score">
            Total Score: {session.totalScore}
          </span>
        </div>

        {session.riskLevel === "Emergency" && (
          <div className="pulse-alert">
            ⚠ Immediate hospital visit recommended.
          </div>
        )}

        {session.summaryText && (
          <div className="result-section">
            <h3>Key Reasons Detected</h3>
            <p>{session.summaryText}</p>
          </div>
        )}

        {session.recommendation && (
          <div className="result-section">
            <h3>Recommended Next Steps</h3>
            <p>{session.recommendation}</p>
          </div>
        )}

        {Array.isArray(session.suggestedTests) &&
          session.suggestedTests.length > 0 && (
            <div className="result-section">
              <h3>Suggested Laboratory Tests</h3>
              <ul>
                {session.suggestedTests.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}

        <div className="result-disclaimer">
          This chatbot provides screening guidance and does not replace medical diagnosis.
        </div>

        <div className="btn-row">
          {/* <button
            type="button"
            className="secondary"
            onClick={() => navigate("/care-guidance")}
          >
            View Care Guidance
          </button> */}

          <button
            type="button"
            className="primary"
            onClick={handleDownload}
          >
            Download PDF Report
          </button>
        </div>

      </div>

      <style>{`

        .result-page {
          min-height: 100vh;
          width: 100%;
          padding: 80px 20px;
          background-image: url("/images/login-bg.png");
          background-size: cover;
          background-position: center;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .result-glass {
          width: 1300px;
          max-width: 95%;
          padding: 60px;
          border-radius: 32px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 50px 120px rgba(0,0,0,0.3);
        }

        .result-title {
          font-size: 32px;
          font-weight: 600;
          color: black;
          margin-bottom: 10px;
        }

        .result-subtitle {
          color: black;
          margin-bottom: 30px;
        }

        .result-top {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .badge {
          padding: 8px 18px;
          border-radius: 30px;
          font-size: 18px;
          font-weight: 500;
          color: black;
        }

        .badge-low {
          background: linear-gradient(90deg,#3b82f6,#2563eb);
        }

        .badge-moderate {
          background: linear-gradient(90deg,#f59e0b,#fbbf24);
        }

        .badge-high {
          background: linear-gradient(90deg,#ef4444,#dc2626);
        }

        .badge-emergency {
          background: linear-gradient(90deg,#7f1d1d,#b91c1c);
        }

        .score {
          color: black;
          font-size: 19px;
        }

        .pulse-alert {
          margin-bottom: 20px;
          color: #ffcccc;
          font-size: 18px;
          font-weight: 900;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .result-section {
          margin-bottom: 25px;
          padding: 20px;
          border-radius: 20px;
          background: rgba(255,255,255,0.1);
        }

        .result-section h3 {
          color: black;
          margin-bottom: 8px;
          font-size: 21px;
        }

        .result-section p,
        .result-section li {
          color: black;
          font-size: 19px;
        }

        .result-section ul {
          padding-left: 18px;
        }

        .result-disclaimer {
          margin-top: 15px;
          font-size: 17px;
          color: black;
        }

        .btn-row {
          margin-top: 35px;
          display: flex;
          justify-content: space-between;
        }

        .secondary {
          padding: 12px 26px;
          border-radius: 40px;
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.4);
          color: black;
          height: 48px;
          width: 260px;
          font-weight: 500;
          font-size: 20px;
          cursor: pointer;
        }

        .primary {
          padding: 12px 32px;
          border-radius: 40px;
          border: none;
          background: linear-gradient(90deg,#4a7dfc,#5f8dff);
          color: black;
          font-weight: 500;
          cursor: pointer;
          height: 48px;
          width: 280px;
          font-weight: 500;
          font-size: 20px;
          box-shadow: 0 15px 35px rgba(74,125,252,0.4);
        }

        .primary:hover {
          transform: translateY(-2px);
        }

        /* ================= MOBILE ================= */

@media (max-width:768px){

.result-page{
padding:40px 15px;
align-items:flex-start;
}

.result-glass{
padding:24px 18px;
border-radius:20px;
}

/* TITLE */

.result-title{
font-size:22px;
}

.result-subtitle{
font-size:14px;
margin-bottom:18px;
}

/* TOP ROW */

.result-top{
flex-direction:column;
align-items:flex-start;
gap:8px;
margin-bottom:15px;
}

/* BADGE */

.badge{
font-size:14px;
padding:6px 14px;
}

/* SCORE */

.score{
font-size:14px;
}

/* ALERT */

.pulse-alert{
font-size:14px;
margin-bottom:14px;
}

/* RESULT SECTIONS */

.result-section{
padding:14px 16px;
border-radius:14px;
margin-bottom:16px;
}

.result-section h3{
font-size:16px;
}

.result-section p,
.result-section li{
font-size:14px;
}

.result-section ul{
padding-left:16px;
}

/* DISCLAIMER */

.result-disclaimer{
font-size:12px;
margin-top:14px;
}

/* BUTTONS */

.btn-row{
flex-direction:column;
gap:10px;
margin-top:22px;
}

.primary,
.secondary{
width:100%;
height:42px;
font-size:14px;
}

}

      `}</style>
    </div>
  );
};

export default ScreeningResultScreen;