import React from "react";

const CareGuidanceScreen = () => {
  return (
    <div className="care-page">

      <div className="care-glass">

        <h1 className="care-title">AI Care Guidance Dashboard</h1>
        <p className="care-subtitle">
          General guidance on safety, activity, and when to seek medical help.
        </p>

        {/* SECTION 1 */}
        <div className="care-section red">
          <h3>Immediate Action & Safety Alerts</h3>
          <ul>
            <li>Rest the affected joint or muscle during active bleeding.</li>
            <li>Avoid self-medication with painkillers like aspirin or ibuprofen.</li>
            <li>If swelling, severe pain, or head injury is present, seek urgent care.</li>
          </ul>
        </div>

        {/* SECTION 2 */}
        <div className="care-section blue">
          <h3>Activity Recommendations</h3>
          <ul>
            <li>Prefer low-impact activities like walking, swimming, or cycling.</li>
            <li>Avoid high-impact contact sports that increase bleeding risk.</li>
            <li>Discuss any new exercise plan with your hematologist or physiotherapist.</li>
          </ul>
        </div>

        {/* SECTION 3 */}
        <div className="care-section yellow">
          <h3>Monitoring & When to Seek Help</h3>
          <ul>
            <li>Watch for increasing joint swelling, warmth, or loss of movement.</li>
            <li>Seek medical attention for blood in urine or stool.</li>
            <li>
              If you develop headache, vomiting, or confusion after injury,
              go to an emergency department immediately.
            </li>
          </ul>
        </div>

        <div className="care-warning">
          This guidance is general in nature and does not replace advice
          from your treating hematologist or physiotherapist.
        </div>

      </div>

      <style>{`

        /* FULL PAGE BACKGROUND */
        .care-page {
          min-height: 100vh;
          width: 100%;
          padding: 80px 40px;
          background-image: url("/images/care.png");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          align-items: center;
        }

        /* LEFT GLASS PANEL */
        .care-glass {
          width: 1300px;
          max-width: 90%;
          padding: 80px;
          margin-left: 60px;
          border-radius: 30px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 50px 120px rgba(0,0,0,0.3);
          animation: fadeUp 0.5s ease;
        }

        .care-title {
          font-size: 23px;
          font-weight: 600;
          color: black;
          margin-bottom: 10px;
        }

        .care-subtitle {
          color: black;
          margin-bottom: 40px;
        }

        /* SECTIONS */
        .care-section {
          padding: 20px 25px;
          border-radius: 18px;
          margin-bottom: 25px;
          background: rgba(255,255,255,0.1);
          transition: 0.3s ease;
        }

        .care-section h3 {
          margin-bottom: 12px;
          font-size: 21px;
          color: black;
        }

        .care-section ul {
          padding-left: 18px;
          color: black;
          font-size: 19px;
        }

        .care-section li {
          margin-bottom: 8px;
        }

        /* COLOR ACCENTS */
        .care-section.red {
          border-left: 4px solid #ff6b6b;
        }

        .care-section.blue {
          border-left: 4px solid #4a7dfc;
        }

        .care-section.yellow {
          border-left: 4px solid #f4b942;
        }

        /* WARNING BOX */
        .care-warning {
          margin-top: 30px;
          padding: 15px 20px;
          border-radius: 15px;
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(223, 87, 25, 0.93);
          color: black;
          font-size: 18px;
        }

        /* ANIMATION */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* MOBILE */
        /* ================= MOBILE ================= */

@media (max-width:768px){

.care-page{
padding:35px 16px;
align-items:flex-start;
}

.care-glass{
padding:24px 18px;
margin-left:0;
border-radius:20px;
}

/* TITLE */

.care-title{
font-size:20px;
line-height:1.3;
}

/* SUBTITLE */

.care-subtitle{
font-size:14px;
margin-bottom:25px;
}

/* SECTIONS */

.care-section{
padding:14px 16px;
margin-bottom:16px;
border-radius:14px;
}

.care-section h3{
font-size:16px;
}

.care-section ul{
font-size:14px;
padding-left:16px;
}

.care-section li{
margin-bottom:6px;
}

/* WARNING BOX */

.care-warning{
font-size:13px;
padding:12px 14px;
margin-top:20px;
}

}

      `}</style>
    </div>
  );
};

export default CareGuidanceScreen;