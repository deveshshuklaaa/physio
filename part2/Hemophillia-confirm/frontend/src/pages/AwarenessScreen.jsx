

// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";

// const AwarenessScreen = () => {
//   const navigate = useNavigate();
//   const { t } = useTranslation();

//   return (
//     <div className="awareness-page">
//       <div className="awareness-wrapper">

//         {/* =====================================================
//             LEFT CONTENT
//         ===================================================== */}
//         <section className="awareness-left">

//           <div className="awareness-label">
//             <span className="label-line"></span>
//             {t("awareness.label")}
//           </div>

//           <h1 className="question-title">
//             {t("awareness.title")}
//             <span>{t("awareness.titleHighlight")}</span>
//           </h1>

//           {/* <p className="question-sub">
//             This helps us understand what information you already have
//             and guide you to the appropriate next step in your care journey.
//           </p> */}
//           <p className="question-sub">
//             {t("awareness.description")}
//           </p>

//           {/* =====================================================
//               OPTIONS
//           ===================================================== */}
//           <div className="button-stack">

//             {/* YES */}
//             <button
//               className="choice-btn choice-primary"
//               onClick={() => navigate("/hemophilia-details")}
//             >
//               <div className="choice-icon">
//                 ✓
//               </div>

//               {/* <div className="choice-content">
//                 <div className="choice-title">
//                   Yes, I have been diagnosed
//                 </div> */}

//                 <div className="choice-title">
//                   {t("awareness.yesTitle")}
//                 </div>
//                 <br></br>

//                 <div className="choice-description">
//                   {t("awareness.yesDescription")}
//                 </div>

                
              

//               <div className="choice-arrow">
//                 →
//               </div>
//             </button>

//             {/* NO */}
//             <button
//               className="choice-btn"
//               onClick={() => navigate("/chatbot")}
//             >
//               <div className="choice-icon">
//                 ?
//               </div>

//               <div className="choice-content">
//                 <div className="choice-title">
//                   {t("awareness.noTitle")}
//                 </div>

//                 <div className="choice-description">
//                   {t("awareness.noDescription")}
//                 </div>
//               </div>

//               <div className="choice-arrow">
//                 →
//               </div>
//             </button>

//             {/* UNSURE */}
            

//           </div>


//         </section>


//         {/* =====================================================
//             RIGHT CLINICAL CARD
//         ===================================================== */}
//         <section className="awareness-right">

//           <div className="clinical-card">

//             {/* Top medical icon */}
//             <div className="medical-symbol">
//               <div className="medical-cross">
                
//               </div>
//             </div>

//             <div className="clinical-card-label">
//               {t("awareness.cardLabel")}
//             </div>

//             <h2>
//               {t("awareness.cardTitle1")}
//               <br />
//               {t("awareness.cardTitle2")}
//             </h2>

//             <p>
//               {t("awareness.cardDescription")}
//             </p>

//             {/* =================================================
//                 MINI INFO CARDS
//             ================================================= */}
//             <div className="clinical-info-grid">

//               <div className="clinical-info">
//                 <div className="info-icon">
//                   ✓
//                 </div>

//                 <strong>
//                   {t("awareness.clinicalInformation")}
//                 </strong>

//                 <span>
//                   {t("awareness.securelyRecorded")}
//                 </span>
//               </div>

//               <div className="clinical-info">
//                 <div className="info-icon">
//                   ♥
//                 </div>

//                 <div>
//                   <strong>
//                     {t("awareness.guidedAssessment")}
//                   </strong>

//                   <span>
//                     {t("awareness.simpleStructured")}
//                   </span>
//                 </div>
//               </div>

//             </div>

//             {/* Decorative medical line */}
//             <div className="heartbeat-line">
//               <span></span>
//               <svg
//                 viewBox="0 0 180 40"
//                 preserveAspectRatio="none"
//               >
//                 <polyline
//                   points="
//                     0,20
//                     35,20
//                     45,20
//                     55,8
//                     65,32
//                     75,20
//                     105,20
//                     115,20
//                     125,12
//                     135,28
//                     145,20
//                     180,20
//                   "
//                 />
//               </svg>
//               <span></span>
//             </div>

//           </div>

//         </section>

//       </div>


//       {/* =====================================================
//           PAGE STYLING
//       ===================================================== */}
//       <style>{`

//         /* =====================================================
//            PAGE
//         ===================================================== */

//         .awareness-page {
//           width: 100%;
//           min-height: 100vh;
//           min-height: 100dvh;

//           margin: 0;
//           padding: 0;

//           box-sizing: border-box;

//           background:
//             linear-gradient(
//               135deg,
//               #f5f9ff 0%,
//               #edf5ff 45%,
//               #f8fbff 100%
//             );

//           color: #102a43;

//           overflow-x: hidden;
//         }


//         .awareness-page *,
//         .awareness-page *::before,
//         .awareness-page *::after {
//           box-sizing: border-box;
//         }


//         /* =====================================================
//            MAIN WRAPPER
//         ===================================================== */

//         .awareness-wrapper {
//   width: 100%;
//   max-width: 1400px;

//   min-height: calc(100vh - 66px);
//   min-height: calc(100dvh - 66px);

//   margin: 0 auto;

//   padding: 40px clamp(30px, 5vw, 80px);

//   display: flex;
//   align-items: center;
//   justify-content: space-between;

//   gap: clamp(40px, 5vw, 90px);

//   box-sizing: border-box;
// }
//         /* =====================================================
//            LEFT SIDE
//         ===================================================== */

//         .awareness-left {
//           width: 52%;
//           max-width: 620px;

//           display: flex;
//           flex-direction: column;

//           justify-content: center;
//         }


//         /* =====================================================
//            LABEL
//         ===================================================== */

//         .awareness-label {
//           display: flex;
//           align-items: center;

//           gap: 10px;

//           margin-bottom: 22px;

//           color: #2457c5;

//           font-size: 11px;
//           font-weight: 700;

//           letter-spacing: 1.6px;
//         }


//         .label-line {
//           width: 38px;
//           height: 2px;

//           background: #4b7bec;

//           border-radius: 10px;
//         }


//         /* =====================================================
//            TITLE
//         ===================================================== */

//         .question-title {
//           margin: 0;

//           max-width: 620px;

//           color: #102a43;

//           font-size: clamp(30px, 3.1vw, 47px);
//           line-height: 1.1;

//           font-weight: 700;


//           letter-spacing: -1.5px;
//         }


//         .question-title span {
//           color: #2864d7;
//         }


//         /* =====================================================
//            DESCRIPTION
//         ===================================================== */

//         .question-sub {
//           max-width: 570px;
//           margin: 18px 0 25px;

//           color: #5d7187;

//           font-size: 16px;

//           line-height: 1.7;
//         }


//         /* =====================================================
//            BUTTONS
//         ===================================================== */

//         .button-stack {
//           width: 100%;

//           display: flex;

//           flex-direction: column;

//           gap: 12px;
//         }


//         .choice-btn {
//           width: 100%;

//           display: flex;

//           align-items: center;

//           gap: 15px;

//           border-radius: 14px;

//           border:
//             1px solid #d8e3f1;

//           background: rgba(255,255,255,0.92);

//           color: #173b68;

//           cursor: pointer;

//           text-align: left;

//           box-shadow:
//             0 4px 14px rgba(31, 75, 125, 0.05);

//             min-height: 68px;
//             padding: 11px 17px;

//           transition:
//             transform 0.2s ease,
//             box-shadow 0.2s ease,
//             border-color 0.2s ease,
//             background 0.2s ease;
//         }


//         .choice-btn:hover {
//           transform: translateY(-2px);

//           border-color: #86aef1;

//           background: #ffffff;

//           box-shadow:
//             0 10px 25px rgba(45, 91, 150, 0.10);
//         }


//         /* =====================================================
//            PRIMARY BUTTON
//         ===================================================== */

//         .choice-primary {
//           border-color: #3e72dc;

//           background:
//             linear-gradient(
//               135deg,
//               #3d73dc,
//               #5489ed
//             );

//           color: white;

//           box-shadow:
//             0 10px 25px rgba(61, 115, 220, 0.20);
//         }


//         .choice-primary:hover {
//           border-color: #3164ca;

//           background:
//             linear-gradient(
//               135deg,
//               #376bd0,
//               #4d82e4
//             );

//           box-shadow:
//             0 14px 30px rgba(61, 115, 220, 0.27);
//         }


//         /* =====================================================
//            BUTTON ICON
//         ===================================================== */

//         .choice-icon {
//           width: 38px;
//           height: 38px;

//           flex-shrink: 0;

//           display: flex;

//           align-items: center;
//           justify-content: center;

//           border-radius: 11px;

//           background: #edf4ff;

//           color: #3167ce;

//           font-size: 18px;

//           font-weight: 700;
//         }


//         .choice-primary .choice-icon {
//           background: rgba(255,255,255,0.18);

//           color: white;
//         }


//         /* =====================================================
//            BUTTON TEXT
//         ===================================================== */

//         .choice-content {
//           flex: 1;

//           min-width: 0;
//         }


//         .choice-title {
//           font-size: 15px;

//           font-weight: 700;

//           line-height: 1.3;
//         }


//         .choice-description {
//           margin-top: 4px;

//           color: #71859b;

//           font-size: 12px;

//           line-height: 1.4;
//         }


//         .choice-primary .choice-description {
//           color: rgba(255,255,255,0.78);
//         }


//         /* =====================================================
//            ARROW
//         ===================================================== */

//         .choice-arrow {
//           width: 30px;

//           flex-shrink: 0;

//           color: #7290b2;

//           font-size: 20px;

//           text-align: center;

//           transition:
//             transform 0.2s ease;
//         }


//         .choice-btn:hover .choice-arrow {
//           transform: translateX(4px);
//         }


//         .choice-primary .choice-arrow {
//           color: white;
//         }


//         /* =====================================================
//            PRIVACY
//         ===================================================== */

//         .privacy-note {
//           max-width: 580px;

//           margin-top: 22px;

//           display: flex;

//           align-items: flex-start;

//           gap: 9px;

//           color: #71859b;

//           font-size: 11px;

//           line-height: 1.5;
//         }


//         .privacy-icon {
//           flex-shrink: 0;

//           font-size: 12px;
//         }


//         /* =====================================================
//            RIGHT SIDE
//         ===================================================== */

//         .awareness-right {
//           width: 42%;

//           display: flex;

//           align-items: center;
//           justify-content: center;
//         }


//         /* =====================================================
//            CLINICAL CARD
//         ===================================================== */

//         .clinical-card {
//           position: relative;

//           width: 100%;

//           max-width: 430px;

//           padding: 30px 32px;

//           overflow: hidden;

//           border:
//             1px solid rgba(119, 157, 211, 0.25);

//           border-radius: 26px;

//           background:
//             linear-gradient(
//               145deg,
//               rgba(255,255,255,0.96),
//               rgba(238,246,255,0.92)
//             );

//           box-shadow:
//             0 25px 60px rgba(45, 91, 150, 0.12);
//         }


//         /* Decorative circle */

//         .clinical-card::before {
//           content: "";

//           position: absolute;

//           width: 230px;
//           height: 230px;

//           right: -110px;
//           top: -100px;

//           border-radius: 50%;

//           background:
//             rgba(80, 135, 225, 0.10);
//         }


//         .clinical-card::after {
//           content: "";

//           position: absolute;

//           width: 170px;
//           height: 170px;

//           left: -100px;
//           bottom: -90px;

//           border-radius: 50%;

//           background:
//             rgba(94, 161, 236, 0.08);
//         }


//         /* =====================================================
//            MEDICAL SYMBOL
//         ===================================================== */

//         .medical-symbol {
//           position: relative;

//           width: 58px;
//           height: 58px;

//           margin-bottom: 25px;

//           display: flex;

//           align-items: center;
//           justify-content: center;

//           border-radius: 17px;

//           background:
//             linear-gradient(
//               135deg,
//               #3e73dc,
//               #6596ed
//             );

//           box-shadow:
//             0 10px 25px rgba(62, 115, 220, 0.22);
//         }


//         .medical-cross {
//           color: white;

//           font-size: 32px;

//           font-weight: 300;

//           line-height: 1;
//         }


//         /* =====================================================
//            CARD TEXT
//         ===================================================== */

//         .clinical-card-label {
//           position: relative;

//           margin-bottom: 10px;

//           color: #3970d2;

//           font-size: 10px;

//           font-weight: 700;

//           letter-spacing: 1.7px;
//         }


//         .clinical-card h2 {
//           position: relative;

//           margin: 0;

//           color: #15385f;

//           font-size: 26px;

//           line-height: 1.25;

//           font-weight: 700;
//         }


//         .clinical-card > p {
//           position: relative;

//           margin:
//             18px
//             0
//             28px;

//           color: #667c94;

//           font-size: 14px;

//           line-height: 1.7;
//         }


//         /* =====================================================
//            INFO GRID
//         ===================================================== */

//         .clinical-info-grid {
//           position: relative;

//           display: flex;

//           flex-direction: column;

//           gap: 10px;
//         }


//         .clinical-info {
//           padding: 12px;

//           display: flex;

//           align-items: center;

//           gap: 11px;

//           border:
//             1px solid #dce7f5;

//           border-radius: 12px;

//           background:
//             rgba(255,255,255,0.72);
//         }


//         .info-icon {
//           width: 32px;
//           height: 32px;

//           flex-shrink: 0;

//           display: flex;

//           align-items: center;
//           justify-content: center;

//           border-radius: 9px;

//           background: #edf4ff;

//           color: #3b70d3;

//           font-size: 14px;

//           font-weight: 700;
//         }


//         .clinical-info div:last-child {
//           display: flex;

//           flex-direction: column;

//           gap: 2px;
//         }


//         .clinical-info strong {
//           color: #25496f;

//           font-size: 12px;

//           font-weight: 700;
//         }


//         .clinical-info span {
//           color: #8192a5;

//           font-size: 10px;
//         }


//         /* =====================================================
//            HEARTBEAT DECORATION
//         ===================================================== */

//         .heartbeat-line {
//           position: relative;

//           margin-top: 28px;

//           display: flex;

//           align-items: center;

//           gap: 8px;

//           opacity: 0.6;
//         }


//         .heartbeat-line span {
//           height: 1px;

//           flex: 1;

//           background: #b9cde9;
//         }


//         .heartbeat-line svg {
//           width: 180px;
//           height: 40px;
//         }


//         .heartbeat-line polyline {
//           fill: none;

//           stroke: #4e80d8;

//           stroke-width: 1.5;

//           vector-effect: non-scaling-stroke;
//         }


//         /* =====================================================
//            TABLET
//         ===================================================== */

//         @media (max-width: 1000px) {

//           .awareness-wrapper {
//             max-width: 900px;

//             padding:
//               45px
//               35px;

//             gap: 40px;
//           }


//           .question-title {
//             font-size: 42px;
//           }


//           .awareness-right {
//             width: 40%;
//           }


//           .clinical-card {
//             padding: 32px 28px;
//           }


//           .clinical-card h2 {
//             font-size: 25px;
//           }

//         }


//         /* =====================================================
//            MOBILE
//         ===================================================== */

//         @media (max-width: 760px) {

//           .awareness-wrapper {
//             width: 100%;

//             min-height: 100vh;
//             min-height: 100dvh;

//             padding:
//               35px
//               20px
//               40px;

//             display: flex;

//             flex-direction: column;

//             align-items: stretch;

//             justify-content: center;

//             gap: 32px;
//           }


//           .awareness-left {
//             width: 100%;

//             max-width: none;

//             text-align: left;
//           }


//           .awareness-label {
//             margin-bottom: 17px;

//             font-size: 9px;

//             letter-spacing: 1.4px;
//           }


//           .label-line {
//             width: 28px;
//           }


//           .question-title {
//             max-width: none;

//             font-size: clamp(31px, 9vw, 40px);

//             line-height: 1.16;

//             letter-spacing: -0.8px;
//           }


//           .question-sub {
//             margin:
//               17px
//               0
//               25px;

//             max-width: none;

//             font-size: 14px;

//             line-height: 1.65;
//           }


//           .button-stack {
//             gap: 10px;
//           }


//           .choice-btn {
//             min-height: 72px;

//             padding:
//               11px
//               12px;

//             gap: 11px;

//             border-radius: 13px;
//           }


//           .choice-icon {
//             width: 38px;
//             height: 38px;

//             border-radius: 10px;

//             font-size: 16px;
//           }


//           .choice-title {
//             font-size: 13.5px;
//           }


//           .choice-description {
//             font-size: 10.5px;
//           }


//           .choice-arrow {
//             font-size: 18px;
//           }


//           .privacy-note {
//             margin-top: 17px;

//             font-size: 10px;
//           }


//           /* Hide the large card on small phones */
//           .awareness-right {
//             width: 100%;
//           }


//           .clinical-card {
//             max-width: none;

//             padding:
//               24px
//               22px;

//             border-radius: 19px;
//           }


//           .medical-symbol {
//             width: 44px;
//             height: 44px;

//             margin-bottom: 16px;

//             border-radius: 13px;
//           }


//           .medical-cross {
//             font-size: 25px;
//           }


//           .clinical-card-label {
//             font-size: 8px;

//             letter-spacing: 1.4px;
//           }


//           .clinical-card h2 {
//             font-size: 21px;
//           }


//           .clinical-card > p {
//             margin:
//               12px
//               0
//               17px;

//             font-size: 12px;

//             line-height: 1.6;
//           }


//           .clinical-info {
//             padding: 9px;
//           }


//           .info-icon {
//             width: 28px;
//             height: 28px;
//           }


//           .clinical-info strong {
//             font-size: 10.5px;
//           }


//           .clinical-info span {
//             font-size: 9px;
//           }


//           .heartbeat-line {
//             display: none;
//           }

//         }


//         /* =====================================================
//            SMALL PHONES
//         ===================================================== */

//         @media (max-width: 420px) {

//           .awareness-wrapper {
//             padding:
//               28px
//               16px
//               30px;
//           }


//           .question-title {
//             font-size: 29px;
//           }


//           .question-sub {
//             font-size: 13px;
//           }


//           .choice-btn {
//             min-height: 68px;
//           }


//           .choice-description {
//             font-size: 10px;
//           }


//           .clinical-card {
//             padding: 21px 18px;
//           }

//         }


//         /* =====================================================
//            REDUCED MOTION
//         ===================================================== */

//         @media (prefers-reduced-motion: reduce) {

//           .choice-btn,
//           .choice-arrow {
//             transition: none;
//           }

//         }

//       `}</style>
//     </div>
//   );
// };

// export default AwarenessScreen;





// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import api from "../apiClient";

// const AwarenessScreen = () => {
//   const navigate = useNavigate();
//   const { t } = useTranslation();
//   const [hasActiveExercises, setHasActiveExercises] = useState(false);

//   useEffect(() => {
//     let mounted = true;
//     const loadExerciseStatus = async () => {
//       try {
//         const response = await api.get("/exercise-recommendations");
//         const recommendations = response.data?.recommendations || [];
//         if (mounted) setHasActiveExercises(recommendations.some((item) => item.status === "ACTIVE"));
//       } catch (error) {
//         console.error("Unable to load exercise plan status:", error);
//       }
//     };
//     loadExerciseStatus();
//     return () => { mounted = false; };
//   }, []);

//   return (
//     <div className="awareness-page">
//       <div className="awareness-wrapper">

//         {/* =====================================================
//             LEFT CONTENT
//         ===================================================== */}
//         <section className="awareness-left">

//           <div className="awareness-label">
//             <span className="label-line"></span>
//             {t("awareness.label")}
//           </div>

//           <h1 className="question-title">
//             {t("awareness.title")}
//             <span>{t("awareness.titleHighlight")}</span>
//           </h1>

//           {/* <p className="question-sub">
//             This helps us understand what information you already have
//             and guide you to the appropriate next step in your care journey.
//           </p> */}
//           <p className="question-sub">
//             {t("awareness.description")}
//           </p>

//           {/* =====================================================
//               OPTIONS
//           ===================================================== */}
//           <div className="button-stack">

//             {/* YES */}
//             <button
//               className="choice-btn choice-primary"
//               onClick={() => navigate("/hemophilia-details")}
//             >
//               <div className="choice-icon">
//                 ✓
//               </div>

//               {/* <div className="choice-content">
//                 <div className="choice-title">
//                   Yes, I have been diagnosed
//                 </div> */}

//                 <div className="choice-title">
//                   {t("awareness.yesTitle")}
//                 </div>
//                 <br></br>

//                 <div className="choice-description">
//                   {t("awareness.yesDescription")}
//                 </div>

                
              

//               <div className="choice-arrow">
//                 →
//               </div>
//             </button>

//             {/* NO */}
//             <button
//               className="choice-btn"
//               onClick={() => navigate("/chatbot")}
//             >
//               <div className="choice-icon">
//                 ?
//               </div>

//               <div className="choice-content">
//                 <div className="choice-title">
//                   {t("awareness.noTitle")}
//                 </div>

//                 <div className="choice-description">
//                   {t("awareness.noDescription")}
//                 </div>
//               </div>

//               <div className="choice-arrow">
//                 →
//               </div>
//             </button>

//             {/* UNSURE */}

//             {hasActiveExercises && (
//               <button
//                 type="button"
//                 className="exercise-home-button"
//                 onClick={() => navigate("/exercise-plan")}
//               >
//                 <div className="exercise-home-icon">✦</div>
//                 <div className="exercise-home-content">
//                   <div className="exercise-home-title">My Exercise Plan</div>
//                   <div className="exercise-home-description">View your doctor-approved personalised exercises and schedule.</div>
//                 </div>
//                 <div className="exercise-home-arrow">→</div>
//               </button>
//             )}

//           </div>


//         </section>


//         {/* =====================================================
//             RIGHT CLINICAL CARD
//         ===================================================== */}
//         <section className="awareness-right">

//           <div className="clinical-card">

//             {/* Top medical icon */}
//             <div className="medical-symbol">
//               <div className="medical-cross">
                
//               </div>
//             </div>

//             <div className="clinical-card-label">
//               {t("awareness.cardLabel")}
//             </div>

//             <h2>
//               {t("awareness.cardTitle1")}
//               <br />
//               {t("awareness.cardTitle2")}
//             </h2>

//             <p>
//               {t("awareness.cardDescription")}
//             </p>

//             {/* =================================================
//                 MINI INFO CARDS
//             ================================================= */}
//             <div className="clinical-info-grid">

//               <div className="clinical-info">
//                 <div className="info-icon">
//                   ✓
//                 </div>

//                 <strong>
//                   {t("awareness.clinicalInformation")}
//                 </strong>

//                 <span>
//                   {t("awareness.securelyRecorded")}
//                 </span>
//               </div>

//               <div className="clinical-info">
//                 <div className="info-icon">
//                   ♥
//                 </div>

//                 <div>
//                   <strong>
//                     {t("awareness.guidedAssessment")}
//                   </strong>

//                   <span>
//                     {t("awareness.simpleStructured")}
//                   </span>
//                 </div>
//               </div>

//             </div>

//             {/* Decorative medical line */}
//             <div className="heartbeat-line">
//               <span></span>
//               <svg
//                 viewBox="0 0 180 40"
//                 preserveAspectRatio="none"
//               >
//                 <polyline
//                   points="
//                     0,20
//                     35,20
//                     45,20
//                     55,8
//                     65,32
//                     75,20
//                     105,20
//                     115,20
//                     125,12
//                     135,28
//                     145,20
//                     180,20
//                   "
//                 />
//               </svg>
//               <span></span>
//             </div>

//           </div>

//         </section>

//       </div>


//       {/* =====================================================
//           PAGE STYLING
//       ===================================================== */}
//       <style>{`

//         /* =====================================================
//            PAGE
//         ===================================================== */

//         .awareness-page {
//           width: 100%;
//           min-height: 100vh;
//           min-height: 100dvh;

//           margin: 0;
//           padding: 0;

//           box-sizing: border-box;

//           background:
//             linear-gradient(
//               135deg,
//               #f5f9ff 0%,
//               #edf5ff 45%,
//               #f8fbff 100%
//             );

//           color: #102a43;

//           overflow-x: hidden;
//         }


//         .awareness-page *,
//         .awareness-page *::before,
//         .awareness-page *::after {
//           box-sizing: border-box;
//         }


//         /* =====================================================
//            MAIN WRAPPER
//         ===================================================== */

//         .awareness-wrapper {
//   width: 100%;
//   max-width: 1400px;

//   min-height: calc(100vh - 66px);
//   min-height: calc(100dvh - 66px);

//   margin: 0 auto;

//   padding: 40px clamp(30px, 5vw, 80px);

//   display: flex;
//   align-items: center;
//   justify-content: space-between;

//   gap: clamp(40px, 5vw, 90px);

//   box-sizing: border-box;
// }
//         /* =====================================================
//            LEFT SIDE
//         ===================================================== */

//         .awareness-left {
//           width: 52%;
//           max-width: 620px;

//           display: flex;
//           flex-direction: column;

//           justify-content: center;
//         }


//         /* =====================================================
//            LABEL
//         ===================================================== */

//         .awareness-label {
//           display: flex;
//           align-items: center;

//           gap: 10px;

//           margin-bottom: 22px;

//           color: #2457c5;

//           font-size: 11px;
//           font-weight: 700;

//           letter-spacing: 1.6px;
//         }


//         .label-line {
//           width: 38px;
//           height: 2px;

//           background: #4b7bec;

//           border-radius: 10px;
//         }


//         /* =====================================================
//            TITLE
//         ===================================================== */

//         .question-title {
//           margin: 0;

//           max-width: 620px;

//           color: #102a43;

//           font-size: clamp(30px, 3.1vw, 47px);
//           line-height: 1.1;

//           font-weight: 700;


//           letter-spacing: -1.5px;
//         }


//         .question-title span {
//           color: #2864d7;
//         }


//         /* =====================================================
//            DESCRIPTION
//         ===================================================== */

//         .question-sub {
//           max-width: 570px;
//           margin: 18px 0 25px;

//           color: #5d7187;

//           font-size: 16px;

//           line-height: 1.7;
//         }


//         /* =====================================================
//            BUTTONS
//         ===================================================== */

//         .button-stack {
//           width: 100%;

//           display: flex;

//           flex-direction: column;

//           gap: 12px;
//         }


//         .choice-btn {
//           width: 100%;

//           display: flex;

//           align-items: center;

//           gap: 15px;

//           border-radius: 14px;

//           border:
//             1px solid #d8e3f1;

//           background: rgba(255,255,255,0.92);

//           color: #173b68;

//           cursor: pointer;

//           text-align: left;

//           box-shadow:
//             0 4px 14px rgba(31, 75, 125, 0.05);

//             min-height: 68px;
//             padding: 11px 17px;

//           transition:
//             transform 0.2s ease,
//             box-shadow 0.2s ease,
//             border-color 0.2s ease,
//             background 0.2s ease;
//         }


//         .choice-btn:hover {
//           transform: translateY(-2px);

//           border-color: #86aef1;

//           background: #ffffff;

//           box-shadow:
//             0 10px 25px rgba(45, 91, 150, 0.10);
//         }


//         /* =====================================================
//            PRIMARY BUTTON
//         ===================================================== */

//         .choice-primary {
//           border-color: #3e72dc;

//           background:
//             linear-gradient(
//               135deg,
//               #3d73dc,
//               #5489ed
//             );

//           color: white;

//           box-shadow:
//             0 10px 25px rgba(61, 115, 220, 0.20);
//         }


//         .choice-primary:hover {
//           border-color: #3164ca;

//           background:
//             linear-gradient(
//               135deg,
//               #376bd0,
//               #4d82e4
//             );

//           box-shadow:
//             0 14px 30px rgba(61, 115, 220, 0.27);
//         }


//         /* =====================================================
//            BUTTON ICON
//         ===================================================== */

//         .choice-icon {
//           width: 38px;
//           height: 38px;

//           flex-shrink: 0;

//           display: flex;

//           align-items: center;
//           justify-content: center;

//           border-radius: 11px;

//           background: #edf4ff;

//           color: #3167ce;

//           font-size: 18px;

//           font-weight: 700;
//         }


//         .choice-primary .choice-icon {
//           background: rgba(255,255,255,0.18);

//           color: white;
//         }


//         /* =====================================================
//            BUTTON TEXT
//         ===================================================== */

//         .choice-content {
//           flex: 1;

//           min-width: 0;
//         }


//         .choice-title {
//           font-size: 15px;

//           font-weight: 700;

//           line-height: 1.3;
//         }


//         .choice-description {
//           margin-top: 4px;

//           color: #71859b;

//           font-size: 12px;

//           line-height: 1.4;
//         }


//         .choice-primary .choice-description {
//           color: rgba(255,255,255,0.78);
//         }


//         /* =====================================================
//            ARROW
//         ===================================================== */

//         .choice-arrow {
//           width: 30px;

//           flex-shrink: 0;

//           color: #7290b2;

//           font-size: 20px;

//           text-align: center;

//           transition:
//             transform 0.2s ease;
//         }


//         .choice-btn:hover .choice-arrow {
//           transform: translateX(4px);
//         }


//         .choice-primary .choice-arrow {
//           color: white;
//         }


//         /* =====================================================
//            PRIVACY
//         ===================================================== */

//         .privacy-note {
//           max-width: 580px;

//           margin-top: 22px;

//           display: flex;

//           align-items: flex-start;

//           gap: 9px;

//           color: #71859b;

//           font-size: 11px;

//           line-height: 1.5;
//         }


//         .privacy-icon {
//           flex-shrink: 0;

//           font-size: 12px;
//         }


//         /* =====================================================
//            RIGHT SIDE
//         ===================================================== */

//         .awareness-right {
//           width: 42%;

//           display: flex;

//           align-items: center;
//           justify-content: center;
//         }


//         /* =====================================================
//            CLINICAL CARD
//         ===================================================== */

//         .clinical-card {
//           position: relative;

//           width: 100%;

//           max-width: 430px;

//           padding: 30px 32px;

//           overflow: hidden;

//           border:
//             1px solid rgba(119, 157, 211, 0.25);

//           border-radius: 26px;

//           background:
//             linear-gradient(
//               145deg,
//               rgba(255,255,255,0.96),
//               rgba(238,246,255,0.92)
//             );

//           box-shadow:
//             0 25px 60px rgba(45, 91, 150, 0.12);
//         }


//         /* Decorative circle */

//         .clinical-card::before {
//           content: "";

//           position: absolute;

//           width: 230px;
//           height: 230px;

//           right: -110px;
//           top: -100px;

//           border-radius: 50%;

//           background:
//             rgba(80, 135, 225, 0.10);
//         }


//         .clinical-card::after {
//           content: "";

//           position: absolute;

//           width: 170px;
//           height: 170px;

//           left: -100px;
//           bottom: -90px;

//           border-radius: 50%;

//           background:
//             rgba(94, 161, 236, 0.08);
//         }


//         /* =====================================================
//            MEDICAL SYMBOL
//         ===================================================== */

//         .medical-symbol {
//           position: relative;

//           width: 58px;
//           height: 58px;

//           margin-bottom: 25px;

//           display: flex;

//           align-items: center;
//           justify-content: center;

//           border-radius: 17px;

//           background:
//             linear-gradient(
//               135deg,
//               #3e73dc,
//               #6596ed
//             );

//           box-shadow:
//             0 10px 25px rgba(62, 115, 220, 0.22);
//         }


//         .medical-cross {
//           color: white;

//           font-size: 32px;

//           font-weight: 300;

//           line-height: 1;
//         }


//         /* =====================================================
//            CARD TEXT
//         ===================================================== */

//         .clinical-card-label {
//           position: relative;

//           margin-bottom: 10px;

//           color: #3970d2;

//           font-size: 10px;

//           font-weight: 700;

//           letter-spacing: 1.7px;
//         }


//         .clinical-card h2 {
//           position: relative;

//           margin: 0;

//           color: #15385f;

//           font-size: 26px;

//           line-height: 1.25;

//           font-weight: 700;
//         }


//         .clinical-card > p {
//           position: relative;

//           margin:
//             18px
//             0
//             28px;

//           color: #667c94;

//           font-size: 14px;

//           line-height: 1.7;
//         }


//         /* =====================================================
//            INFO GRID
//         ===================================================== */

//         .clinical-info-grid {
//           position: relative;

//           display: flex;

//           flex-direction: column;

//           gap: 10px;
//         }


//         .clinical-info {
//           padding: 12px;

//           display: flex;

//           align-items: center;

//           gap: 11px;

//           border:
//             1px solid #dce7f5;

//           border-radius: 12px;

//           background:
//             rgba(255,255,255,0.72);
//         }


//         .info-icon {
//           width: 32px;
//           height: 32px;

//           flex-shrink: 0;

//           display: flex;

//           align-items: center;
//           justify-content: center;

//           border-radius: 9px;

//           background: #edf4ff;

//           color: #3b70d3;

//           font-size: 14px;

//           font-weight: 700;
//         }


//         .clinical-info div:last-child {
//           display: flex;

//           flex-direction: column;

//           gap: 2px;
//         }


//         .clinical-info strong {
//           color: #25496f;

//           font-size: 12px;

//           font-weight: 700;
//         }


//         .clinical-info span {
//           color: #8192a5;

//           font-size: 10px;
//         }


//         /* =====================================================
//            HEARTBEAT DECORATION
//         ===================================================== */

//         .heartbeat-line {
//           position: relative;

//           margin-top: 28px;

//           display: flex;

//           align-items: center;

//           gap: 8px;

//           opacity: 0.6;
//         }


//         .heartbeat-line span {
//           height: 1px;

//           flex: 1;

//           background: #b9cde9;
//         }


//         .heartbeat-line svg {
//           width: 180px;
//           height: 40px;
//         }


//         .heartbeat-line polyline {
//           fill: none;

//           stroke: #4e80d8;

//           stroke-width: 1.5;

//           vector-effect: non-scaling-stroke;
//         }


//         /* =====================================================
//            TABLET
//         ===================================================== */

//         @media (max-width: 1000px) {

//           .awareness-wrapper {
//             max-width: 900px;

//             padding:
//               45px
//               35px;

//             gap: 40px;
//           }


//           .question-title {
//             font-size: 42px;
//           }


//           .awareness-right {
//             width: 40%;
//           }


//           .clinical-card {
//             padding: 32px 28px;
//           }


//           .clinical-card h2 {
//             font-size: 25px;
//           }

//         }


//         /* =====================================================
//            MOBILE
//         ===================================================== */

//         @media (max-width: 760px) {

//           .awareness-wrapper {
//             width: 100%;

//             min-height: 100vh;
//             min-height: 100dvh;

//             padding:
//               35px
//               20px
//               40px;

//             display: flex;

//             flex-direction: column;

//             align-items: stretch;

//             justify-content: center;

//             gap: 32px;
//           }


//           .awareness-left {
//             width: 100%;

//             max-width: none;

//             text-align: left;
//           }


//           .awareness-label {
//             margin-bottom: 17px;

//             font-size: 9px;

//             letter-spacing: 1.4px;
//           }


//           .label-line {
//             width: 28px;
//           }


//           .question-title {
//             max-width: none;

//             font-size: clamp(31px, 9vw, 40px);

//             line-height: 1.16;

//             letter-spacing: -0.8px;
//           }


//           .question-sub {
//             margin:
//               17px
//               0
//               25px;

//             max-width: none;

//             font-size: 14px;

//             line-height: 1.65;
//           }


//           .button-stack {
//             gap: 10px;
//           }


//           .choice-btn {
//             min-height: 72px;

//             padding:
//               11px
//               12px;

//             gap: 11px;

//             border-radius: 13px;
//           }


//           .choice-icon {
//             width: 38px;
//             height: 38px;

//             border-radius: 10px;

//             font-size: 16px;
//           }


//           .choice-title {
//             font-size: 13.5px;
//           }


//           .choice-description {
//             font-size: 10.5px;
//           }


//           .choice-arrow {
//             font-size: 18px;
//           }


//           .privacy-note {
//             margin-top: 17px;

//             font-size: 10px;
//           }


//           /* Hide the large card on small phones */
//           .awareness-right {
//             width: 100%;
//           }


//           .clinical-card {
//             max-width: none;

//             padding:
//               24px
//               22px;

//             border-radius: 19px;
//           }


//           .medical-symbol {
//             width: 44px;
//             height: 44px;

//             margin-bottom: 16px;

//             border-radius: 13px;
//           }


//           .medical-cross {
//             font-size: 25px;
//           }


//           .clinical-card-label {
//             font-size: 8px;

//             letter-spacing: 1.4px;
//           }


//           .clinical-card h2 {
//             font-size: 21px;
//           }


//           .clinical-card > p {
//             margin:
//               12px
//               0
//               17px;

//             font-size: 12px;

//             line-height: 1.6;
//           }


//           .clinical-info {
//             padding: 9px;
//           }


//           .info-icon {
//             width: 28px;
//             height: 28px;
//           }


//           .clinical-info strong {
//             font-size: 10.5px;
//           }


//           .clinical-info span {
//             font-size: 9px;
//           }


//           .heartbeat-line {
//             display: none;
//           }

//         }


//         /* =====================================================
//            SMALL PHONES
//         ===================================================== */

//         @media (max-width: 420px) {

//           .awareness-wrapper {
//             padding:
//               28px
//               16px
//               30px;
//           }


//           .question-title {
//             font-size: 29px;
//           }


//           .question-sub {
//             font-size: 13px;
//           }


//           .choice-btn {
//             min-height: 68px;
//           }


//           .choice-description {
//             font-size: 10px;
//           }


//           .clinical-card {
//             padding: 21px 18px;
//           }

//         }


//         /* =====================================================
//            REDUCED MOTION
//         ===================================================== */

//         @media (prefers-reduced-motion: reduce) {

//           .choice-btn,
//           .choice-arrow {
//             transition: none;
//           }

//         }


//         .exercise-home-button { width:100%; margin-top:14px; padding:15px 17px; display:flex; align-items:center; gap:12px; border:1px solid #cfdcf3; border-radius:14px; background:linear-gradient(135deg,#f7f9ff,#eef4ff); color:#24328f; cursor:pointer; text-align:left; transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease; }
//         .exercise-home-button:hover { transform:translateY(-1px); border-color:#9fb5e8; box-shadow:0 10px 24px rgba(36,50,143,.10); }
//         .exercise-home-icon { width:38px; height:38px; flex:0 0 auto; display:flex; align-items:center; justify-content:center; border-radius:11px; background:linear-gradient(135deg,#24328f,#4a7dfc); color:#fff; font-size:17px; }
//         .exercise-home-content { flex:1; min-width:0; }
//         .exercise-home-title { font-size:13px; font-weight:800; color:#263650; }
//         .exercise-home-description { margin-top:3px; font-size:10px; line-height:1.45; color:#71829a; }
//         .exercise-home-arrow { flex:0 0 auto; font-size:18px; font-weight:800; }
//       `}</style>
//     </div>
//   );
// };

// export default AwarenessScreen;














// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import api from "../apiClient";

// const AwarenessScreen = () => {
//   const navigate = useNavigate();
//   const { t } = useTranslation();
//   const [hasExerciseRecommendations, setHasExerciseRecommendations] = useState(false);

//   useEffect(() => {
//     let mounted = true;

//     const loadExerciseStatus = async () => {
//       try {
//         const response = await api.get("/exercise-recommendations");
//         const recommendations = response.data?.recommendations || [];
//         if (mounted) {
//           setHasExerciseRecommendations(recommendations.length > 0);
//         }
//       } catch (error) {
//         console.error("Unable to load exercise plan status:", error);
//       }
//     };

//     loadExerciseStatus();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   return (
//     <div className="awareness-page">
//       <div className="awareness-wrapper">

//         {/* =====================================================
//             LEFT CONTENT
//         ===================================================== */}
//         <section className="awareness-left">

//           <div className="awareness-label">
//             <span className="label-line"></span>
//             {t("awareness.label")}
//           </div>

//           <h1 className="question-title">
//             {t("awareness.title")}
//             <span>{t("awareness.titleHighlight")}</span>
//           </h1>

//           {/* <p className="question-sub">
//             This helps us understand what information you already have
//             and guide you to the appropriate next step in your care journey.
//           </p> */}
//           <p className="question-sub">
//             {t("awareness.description")}
//           </p>

//           {/* =====================================================
//               OPTIONS
//           ===================================================== */}
//           <div className="button-stack">

//             {/* YES */}
//             <button
//               className="choice-btn choice-primary"
//               onClick={() => navigate("/hemophilia-details")}
//             >
//               <div className="choice-icon">
//                 ✓
//               </div>

//               {/* <div className="choice-content">
//                 <div className="choice-title">
//                   Yes, I have been diagnosed
//                 </div> */}

//                 <div className="choice-title">
//                   {t("awareness.yesTitle")}
//                 </div>
//                 <br></br>

//                 <div className="choice-description">
//                   {t("awareness.yesDescription")}
//                 </div>

                
              

//               <div className="choice-arrow">
//                 →
//               </div>
//             </button>

//             {/* NO */}
//             <button
//               className="choice-btn"
//               onClick={() => navigate("/chatbot")}
//             >
//               <div className="choice-icon">
//                 ?
//               </div>

//               <div className="choice-content">
//                 <div className="choice-title">
//                   {t("awareness.noTitle")}
//                 </div>

//                 <div className="choice-description">
//                   {t("awareness.noDescription")}
//                 </div>
//               </div>

//               <div className="choice-arrow">
//                 →
//               </div>
//             </button>

//             {/* EXERCISE PLAN */}
//             {hasExerciseRecommendations && (
//               <button
//                 type="button"
//                 className="choice-btn exercise-home-button"
//                 onClick={() => navigate("/exercise-plan")}
//               >
//                 <div className="choice-icon exercise-home-icon">✦</div>
//                 <div className="choice-content">
//                   <div className="choice-title">My Exercise Plan</div>
//                   <div className="choice-description">
//                     View your personalised exercises and doctor review status.
//                   </div>
//                 </div>
//                 <div className="choice-arrow">→</div>
//               </button>
//             )}

//             {/* UNSURE */}
            

//           </div>


//         </section>


//         {/* =====================================================
//             RIGHT CLINICAL CARD
//         ===================================================== */}
//         <section className="awareness-right">

//           <div className="clinical-card">

//             {/* Top medical icon */}
//             <div className="medical-symbol">
//               <div className="medical-cross">
                
//               </div>
//             </div>

//             <div className="clinical-card-label">
//               {t("awareness.cardLabel")}
//             </div>

//             <h2>
//               {t("awareness.cardTitle1")}
//               <br />
//               {t("awareness.cardTitle2")}
//             </h2>

//             <p>
//               {t("awareness.cardDescription")}
//             </p>

//             {/* =================================================
//                 MINI INFO CARDS
//             ================================================= */}
//             <div className="clinical-info-grid">

//               <div className="clinical-info">
//                 <div className="info-icon">
//                   ✓
//                 </div>

//                 <strong>
//                   {t("awareness.clinicalInformation")}
//                 </strong>

//                 <span>
//                   {t("awareness.securelyRecorded")}
//                 </span>
//               </div>

//               <div className="clinical-info">
//                 <div className="info-icon">
//                   ♥
//                 </div>

//                 <div>
//                   <strong>
//                     {t("awareness.guidedAssessment")}
//                   </strong>

//                   <span>
//                     {t("awareness.simpleStructured")}
//                   </span>
//                 </div>
//               </div>

//             </div>

//             {/* Decorative medical line */}
//             <div className="heartbeat-line">
//               <span></span>
//               <svg
//                 viewBox="0 0 180 40"
//                 preserveAspectRatio="none"
//               >
//                 <polyline
//                   points="
//                     0,20
//                     35,20
//                     45,20
//                     55,8
//                     65,32
//                     75,20
//                     105,20
//                     115,20
//                     125,12
//                     135,28
//                     145,20
//                     180,20
//                   "
//                 />
//               </svg>
//               <span></span>
//             </div>

//           </div>

//         </section>

//       </div>


//       {/* =====================================================
//           PAGE STYLING
//       ===================================================== */}
//       <style>{`

//         /* =====================================================
//            PAGE
//         ===================================================== */

//         .awareness-page {
//           width: 100%;
//           min-height: 100vh;
//           min-height: 100dvh;

//           margin: 0;
//           padding: 0;

//           box-sizing: border-box;

//           background:
//             linear-gradient(
//               135deg,
//               #f5f9ff 0%,
//               #edf5ff 45%,
//               #f8fbff 100%
//             );

//           color: #102a43;

//           overflow-x: hidden;
//         }


//         .awareness-page *,
//         .awareness-page *::before,
//         .awareness-page *::after {
//           box-sizing: border-box;
//         }


//         /* =====================================================
//            MAIN WRAPPER
//         ===================================================== */

//         .awareness-wrapper {
//   width: 100%;
//   max-width: 1400px;

//   min-height: calc(100vh - 66px);
//   min-height: calc(100dvh - 66px);

//   margin: 0 auto;

//   padding: 40px clamp(30px, 5vw, 80px);

//   display: flex;
//   align-items: center;
//   justify-content: space-between;

//   gap: clamp(40px, 5vw, 90px);

//   box-sizing: border-box;
// }
//         /* =====================================================
//            LEFT SIDE
//         ===================================================== */

//         .awareness-left {
//           width: 52%;
//           max-width: 620px;

//           display: flex;
//           flex-direction: column;

//           justify-content: center;
//         }


//         /* =====================================================
//            LABEL
//         ===================================================== */

//         .awareness-label {
//           display: flex;
//           align-items: center;

//           gap: 10px;

//           margin-bottom: 22px;

//           color: #2457c5;

//           font-size: 11px;
//           font-weight: 700;

//           letter-spacing: 1.6px;
//         }


//         .label-line {
//           width: 38px;
//           height: 2px;

//           background: #4b7bec;

//           border-radius: 10px;
//         }


//         /* =====================================================
//            TITLE
//         ===================================================== */

//         .question-title {
//           margin: 0;

//           max-width: 620px;

//           color: #102a43;

//           font-size: clamp(30px, 3.1vw, 47px);
//           line-height: 1.1;

//           font-weight: 700;


//           letter-spacing: -1.5px;
//         }


//         .question-title span {
//           color: #2864d7;
//         }


//         /* =====================================================
//            DESCRIPTION
//         ===================================================== */

//         .question-sub {
//           max-width: 570px;
//           margin: 18px 0 25px;

//           color: #5d7187;

//           font-size: 16px;

//           line-height: 1.7;
//         }


//         /* =====================================================
//            BUTTONS
//         ===================================================== */

//         .button-stack {
//           width: 100%;

//           display: flex;

//           flex-direction: column;

//           gap: 12px;
//         }


//         .choice-btn {
//           width: 100%;

//           display: flex;

//           align-items: center;

//           gap: 15px;

//           border-radius: 14px;

//           border:
//             1px solid #d8e3f1;

//           background: rgba(255,255,255,0.92);

//           color: #173b68;

//           cursor: pointer;

//           text-align: left;

//           box-shadow:
//             0 4px 14px rgba(31, 75, 125, 0.05);

//             min-height: 68px;
//             padding: 11px 17px;

//           transition:
//             transform 0.2s ease,
//             box-shadow 0.2s ease,
//             border-color 0.2s ease,
//             background 0.2s ease;
//         }


//         .choice-btn:hover {
//           transform: translateY(-2px);

//           border-color: #86aef1;

//           background: #ffffff;

//           box-shadow:
//             0 10px 25px rgba(45, 91, 150, 0.10);
//         }


//         /* =====================================================
//            PRIMARY BUTTON
//         ===================================================== */

//         .choice-primary {
//           border-color: #3e72dc;

//           background:
//             linear-gradient(
//               135deg,
//               #3d73dc,
//               #5489ed
//             );

//           color: white;

//           box-shadow:
//             0 10px 25px rgba(61, 115, 220, 0.20);
//         }


//         .choice-primary:hover {
//           border-color: #3164ca;

//           background:
//             linear-gradient(
//               135deg,
//               #376bd0,
//               #4d82e4
//             );

//           box-shadow:
//             0 14px 30px rgba(61, 115, 220, 0.27);
//         }


//         /* =====================================================
//            BUTTON ICON
//         ===================================================== */

//         .choice-icon {
//           width: 38px;
//           height: 38px;

//           flex-shrink: 0;

//           display: flex;

//           align-items: center;
//           justify-content: center;

//           border-radius: 11px;

//           background: #edf4ff;

//           color: #3167ce;

//           font-size: 18px;

//           font-weight: 700;
//         }


//         .choice-primary .choice-icon {
//           background: rgba(255,255,255,0.18);

//           color: white;
//         }


//         /* =====================================================
//            BUTTON TEXT
//         ===================================================== */

//         .choice-content {
//           flex: 1;

//           min-width: 0;
//         }


//         .choice-title {
//           font-size: 15px;

//           font-weight: 700;

//           line-height: 1.3;
//         }


//         .choice-description {
//           margin-top: 4px;

//           color: #71859b;

//           font-size: 12px;

//           line-height: 1.4;
//         }


//         .choice-primary .choice-description {
//           color: rgba(255,255,255,0.78);
//         }


//         /* =====================================================
//            ARROW
//         ===================================================== */

//         .choice-arrow {
//           width: 30px;

//           flex-shrink: 0;

//           color: #7290b2;

//           font-size: 20px;

//           text-align: center;

//           transition:
//             transform 0.2s ease;
//         }


//         .choice-btn:hover .choice-arrow {
//           transform: translateX(4px);
//         }


//         .choice-primary .choice-arrow {
//           color: white;
//         }


//         /* =====================================================
//            PRIVACY
//         ===================================================== */

//         .privacy-note {
//           max-width: 580px;

//           margin-top: 22px;

//           display: flex;

//           align-items: flex-start;

//           gap: 9px;

//           color: #71859b;

//           font-size: 11px;

//           line-height: 1.5;
//         }


//         .privacy-icon {
//           flex-shrink: 0;

//           font-size: 12px;
//         }


//         /* =====================================================
//            RIGHT SIDE
//         ===================================================== */

//         .awareness-right {
//           width: 42%;

//           display: flex;

//           align-items: center;
//           justify-content: center;
//         }


//         /* =====================================================
//            CLINICAL CARD
//         ===================================================== */

//         .clinical-card {
//           position: relative;

//           width: 100%;

//           max-width: 430px;

//           padding: 30px 32px;

//           overflow: hidden;

//           border:
//             1px solid rgba(119, 157, 211, 0.25);

//           border-radius: 26px;

//           background:
//             linear-gradient(
//               145deg,
//               rgba(255,255,255,0.96),
//               rgba(238,246,255,0.92)
//             );

//           box-shadow:
//             0 25px 60px rgba(45, 91, 150, 0.12);
//         }


//         /* Decorative circle */

//         .clinical-card::before {
//           content: "";

//           position: absolute;

//           width: 230px;
//           height: 230px;

//           right: -110px;
//           top: -100px;

//           border-radius: 50%;

//           background:
//             rgba(80, 135, 225, 0.10);
//         }


//         .clinical-card::after {
//           content: "";

//           position: absolute;

//           width: 170px;
//           height: 170px;

//           left: -100px;
//           bottom: -90px;

//           border-radius: 50%;

//           background:
//             rgba(94, 161, 236, 0.08);
//         }


//         /* =====================================================
//            MEDICAL SYMBOL
//         ===================================================== */

//         .medical-symbol {
//           position: relative;

//           width: 58px;
//           height: 58px;

//           margin-bottom: 25px;

//           display: flex;

//           align-items: center;
//           justify-content: center;

//           border-radius: 17px;

//           background:
//             linear-gradient(
//               135deg,
//               #3e73dc,
//               #6596ed
//             );

//           box-shadow:
//             0 10px 25px rgba(62, 115, 220, 0.22);
//         }


//         .medical-cross {
//           color: white;

//           font-size: 32px;

//           font-weight: 300;

//           line-height: 1;
//         }


//         /* =====================================================
//            CARD TEXT
//         ===================================================== */

//         .clinical-card-label {
//           position: relative;

//           margin-bottom: 10px;

//           color: #3970d2;

//           font-size: 10px;

//           font-weight: 700;

//           letter-spacing: 1.7px;
//         }


//         .clinical-card h2 {
//           position: relative;

//           margin: 0;

//           color: #15385f;

//           font-size: 26px;

//           line-height: 1.25;

//           font-weight: 700;
//         }


//         .clinical-card > p {
//           position: relative;

//           margin:
//             18px
//             0
//             28px;

//           color: #667c94;

//           font-size: 14px;

//           line-height: 1.7;
//         }


//         /* =====================================================
//            INFO GRID
//         ===================================================== */

//         .clinical-info-grid {
//           position: relative;

//           display: flex;

//           flex-direction: column;

//           gap: 10px;
//         }


//         .clinical-info {
//           padding: 12px;

//           display: flex;

//           align-items: center;

//           gap: 11px;

//           border:
//             1px solid #dce7f5;

//           border-radius: 12px;

//           background:
//             rgba(255,255,255,0.72);
//         }


//         .info-icon {
//           width: 32px;
//           height: 32px;

//           flex-shrink: 0;

//           display: flex;

//           align-items: center;
//           justify-content: center;

//           border-radius: 9px;

//           background: #edf4ff;

//           color: #3b70d3;

//           font-size: 14px;

//           font-weight: 700;
//         }


//         .clinical-info div:last-child {
//           display: flex;

//           flex-direction: column;

//           gap: 2px;
//         }


//         .clinical-info strong {
//           color: #25496f;

//           font-size: 12px;

//           font-weight: 700;
//         }


//         .clinical-info span {
//           color: #8192a5;

//           font-size: 10px;
//         }


//         /* =====================================================
//            HEARTBEAT DECORATION
//         ===================================================== */

//         .heartbeat-line {
//           position: relative;

//           margin-top: 28px;

//           display: flex;

//           align-items: center;

//           gap: 8px;

//           opacity: 0.6;
//         }


//         .heartbeat-line span {
//           height: 1px;

//           flex: 1;

//           background: #b9cde9;
//         }


//         .heartbeat-line svg {
//           width: 180px;
//           height: 40px;
//         }


//         .heartbeat-line polyline {
//           fill: none;

//           stroke: #4e80d8;

//           stroke-width: 1.5;

//           vector-effect: non-scaling-stroke;
//         }


//         /* =====================================================
//            TABLET
//         ===================================================== */

//         @media (max-width: 1000px) {

//           .awareness-wrapper {
//             max-width: 900px;

//             padding:
//               45px
//               35px;

//             gap: 40px;
//           }


//           .question-title {
//             font-size: 42px;
//           }


//           .awareness-right {
//             width: 40%;
//           }


//           .clinical-card {
//             padding: 32px 28px;
//           }


//           .clinical-card h2 {
//             font-size: 25px;
//           }

//         }


//         /* =====================================================
//            MOBILE
//         ===================================================== */

//         @media (max-width: 760px) {

//           .awareness-wrapper {
//             width: 100%;

//             min-height: 100vh;
//             min-height: 100dvh;

//             padding:
//               35px
//               20px
//               40px;

//             display: flex;

//             flex-direction: column;

//             align-items: stretch;

//             justify-content: center;

//             gap: 32px;
//           }


//           .awareness-left {
//             width: 100%;

//             max-width: none;

//             text-align: left;
//           }


//           .awareness-label {
//             margin-bottom: 17px;

//             font-size: 9px;

//             letter-spacing: 1.4px;
//           }


//           .label-line {
//             width: 28px;
//           }


//           .question-title {
//             max-width: none;

//             font-size: clamp(31px, 9vw, 40px);

//             line-height: 1.16;

//             letter-spacing: -0.8px;
//           }


//           .question-sub {
//             margin:
//               17px
//               0
//               25px;

//             max-width: none;

//             font-size: 14px;

//             line-height: 1.65;
//           }


//           .button-stack {
//             gap: 10px;
//           }


//           .choice-btn {
//             min-height: 72px;

//             padding:
//               11px
//               12px;

//             gap: 11px;

//             border-radius: 13px;
//           }


//           .choice-icon {
//             width: 38px;
//             height: 38px;

//             border-radius: 10px;

//             font-size: 16px;
//           }


//           .choice-title {
//             font-size: 13.5px;
//           }


//           .choice-description {
//             font-size: 10.5px;
//           }


//           .choice-arrow {
//             font-size: 18px;
//           }


//           .privacy-note {
//             margin-top: 17px;

//             font-size: 10px;
//           }


//           /* Hide the large card on small phones */
//           .awareness-right {
//             width: 100%;
//           }


//           .clinical-card {
//             max-width: none;

//             padding:
//               24px
//               22px;

//             border-radius: 19px;
//           }


//           .medical-symbol {
//             width: 44px;
//             height: 44px;

//             margin-bottom: 16px;

//             border-radius: 13px;
//           }


//           .medical-cross {
//             font-size: 25px;
//           }


//           .clinical-card-label {
//             font-size: 8px;

//             letter-spacing: 1.4px;
//           }


//           .clinical-card h2 {
//             font-size: 21px;
//           }


//           .clinical-card > p {
//             margin:
//               12px
//               0
//               17px;

//             font-size: 12px;

//             line-height: 1.6;
//           }


//           .clinical-info {
//             padding: 9px;
//           }


//           .info-icon {
//             width: 28px;
//             height: 28px;
//           }


//           .clinical-info strong {
//             font-size: 10.5px;
//           }


//           .clinical-info span {
//             font-size: 9px;
//           }


//           .heartbeat-line {
//             display: none;
//           }

//         }


//         /* =====================================================
//            SMALL PHONES
//         ===================================================== */

//         @media (max-width: 420px) {

//           .awareness-wrapper {
//             padding:
//               28px
//               16px
//               30px;
//           }


//           .question-title {
//             font-size: 29px;
//           }


//           .question-sub {
//             font-size: 13px;
//           }


//           .choice-btn {
//             min-height: 68px;
//           }


//           .choice-description {
//             font-size: 10px;
//           }


//           .clinical-card {
//             padding: 21px 18px;
//           }

//         }


//         /* =====================================================
//            REDUCED MOTION
//         ===================================================== */

//         @media (prefers-reduced-motion: reduce) {

//           .choice-btn,
//           .choice-arrow {
//             transition: none;
//           }

//         }

//         .exercise-home-button {
//           margin-top: 2px;
//           border-color: #a9c4ef;
//           background: linear-gradient(135deg, #ffffff, #f4f8ff);
//         }
//         .exercise-home-icon {
//           background: #eaf1ff;
//           color: #376bd4;
//         }
//       `}
// </style>
//     </div>
//   );
// };

// export default AwarenessScreen;












import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../apiClient";

const AwarenessScreen = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // The Exercise Plan card follows the same language selected in the navbar.
  // i18next is already used by this page, so changing the navbar language
  // automatically re-renders this card as well.
  const exercisePlanText = {
    en: {
      title: "My Exercise Plan",
      description: "View your personalised exercises and doctor review status.",
    },
    hi: {
      title: "मेरी व्यायाम योजना",
      description: "अपने व्यक्तिगत व्यायाम और डॉक्टर की समीक्षा की स्थिति देखें।",
    },
    mr: {
      title: "माझी व्यायाम योजना",
      description: "तुमचे वैयक्तिक व्यायाम आणि डॉक्टरांच्या पुनरावलोकनाची स्थिती पहा.",
    },
  };

  const currentLanguage = String(i18n.language || "en").toLowerCase();
  const exerciseLanguage = currentLanguage.startsWith("hi")
    ? "hi"
    : currentLanguage.startsWith("mr")
      ? "mr"
      : "en";

  const exerciseText = exercisePlanText[exerciseLanguage];
  const [hasExerciseRecommendations, setHasExerciseRecommendations] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadExerciseStatus = async () => {
      try {
        const response = await api.get("/exercise-recommendations");
        const recommendations = response.data?.recommendations || [];
        if (mounted) {
          setHasExerciseRecommendations(recommendations.length > 0);
        }
      } catch (error) {
        console.error("Unable to load exercise plan status:", error);
      }
    };

    loadExerciseStatus();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="awareness-page">
      <div className="awareness-wrapper">

        {/* =====================================================
            LEFT CONTENT
        ===================================================== */}
        <section className="awareness-left">

          <div className="awareness-label">
            <span className="label-line"></span>
            {t("awareness.label")}
          </div>

          <h1 className="question-title">
            {t("awareness.title")}
            <span>{t("awareness.titleHighlight")}</span>
          </h1>

          {/* <p className="question-sub">
            This helps us understand what information you already have
            and guide you to the appropriate next step in your care journey.
          </p> */}
          <p className="question-sub">
            {t("awareness.description")}
          </p>

          {/* =====================================================
              OPTIONS
          ===================================================== */}
          <div className="button-stack">

            {/* YES */}
            <button
              className="choice-btn choice-primary"
              onClick={() => navigate("/hemophilia-details")}
            >
              <div className="choice-icon">
                ✓
              </div>

              {/* <div className="choice-content">
                <div className="choice-title">
                  Yes, I have been diagnosed
                </div> */}

                <div className="choice-title">
                  {t("awareness.yesTitle")}
                </div>
                <br></br>

                <div className="choice-description">
                  {t("awareness.yesDescription")}
                </div>

                
              

              <div className="choice-arrow">
                →
              </div>
            </button>

            {/* NO */}
            <button
              className="choice-btn"
              onClick={() => navigate("/chatbot")}
            >
              <div className="choice-icon">
                ?
              </div>

              <div className="choice-content">
                <div className="choice-title">
                  {t("awareness.noTitle")}
                </div>

                <div className="choice-description">
                  {t("awareness.noDescription")}
                </div>
              </div>

              <div className="choice-arrow">
                →
              </div>
            </button>

            {/* EXERCISE PLAN */}
            {hasExerciseRecommendations && (
              <button
                type="button"
                className="choice-btn exercise-home-button"
                onClick={() => navigate("/exercise-plan")}
              >
                <div className="choice-icon exercise-home-icon">✦</div>
                <div className="choice-content">
                  <div className="choice-title">{exerciseText.title}</div>
                  <div className="choice-description">
                    {exerciseText.description}
                  </div>
                </div>
                <div className="choice-arrow">→</div>
              </button>
            )}

            {/* UNSURE */}
            

          </div>


        </section>


        {/* =====================================================
            RIGHT CLINICAL CARD
        ===================================================== */}
        <section className="awareness-right">

          <div className="clinical-card">

            {/* Top medical icon */}
            <div className="medical-symbol">
              <div className="medical-cross">
                
              </div>
            </div>

            <div className="clinical-card-label">
              {t("awareness.cardLabel")}
            </div>

            <h2>
              {t("awareness.cardTitle1")}
              <br />
              {t("awareness.cardTitle2")}
            </h2>

            <p>
              {t("awareness.cardDescription")}
            </p>

            {/* =================================================
                MINI INFO CARDS
            ================================================= */}
            <div className="clinical-info-grid">

              <div className="clinical-info">
                <div className="info-icon">
                  ✓
                </div>

                <strong>
                  {t("awareness.clinicalInformation")}
                </strong>

                <span>
                  {t("awareness.securelyRecorded")}
                </span>
              </div>

              <div className="clinical-info">
                <div className="info-icon">
                  ♥
                </div>

                <div>
                  <strong>
                    {t("awareness.guidedAssessment")}
                  </strong>

                  <span>
                    {t("awareness.simpleStructured")}
                  </span>
                </div>
              </div>

            </div>

            {/* Decorative medical line */}
            <div className="heartbeat-line">
              <span></span>
              <svg
                viewBox="0 0 180 40"
                preserveAspectRatio="none"
              >
                <polyline
                  points="
                    0,20
                    35,20
                    45,20
                    55,8
                    65,32
                    75,20
                    105,20
                    115,20
                    125,12
                    135,28
                    145,20
                    180,20
                  "
                />
              </svg>
              <span></span>
            </div>

          </div>

        </section>

      </div>


      {/* =====================================================
          PAGE STYLING
      ===================================================== */}
      <style>{`

        /* =====================================================
           PAGE
        ===================================================== */

        .awareness-page {
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;

          margin: 0;
          padding: 0;

          box-sizing: border-box;

          background:
            linear-gradient(
              135deg,
              #f5f9ff 0%,
              #edf5ff 45%,
              #f8fbff 100%
            );

          color: #102a43;

          overflow-x: hidden;
        }


        .awareness-page *,
        .awareness-page *::before,
        .awareness-page *::after {
          box-sizing: border-box;
        }


        /* =====================================================
           MAIN WRAPPER
        ===================================================== */

        .awareness-wrapper {
  width: 100%;
  max-width: 1400px;

  min-height: calc(100vh - 66px);
  min-height: calc(100dvh - 66px);

  margin: 0 auto;

  padding: 40px clamp(30px, 5vw, 80px);

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: clamp(40px, 5vw, 90px);

  box-sizing: border-box;
}
        /* =====================================================
           LEFT SIDE
        ===================================================== */

        .awareness-left {
          width: 52%;
          max-width: 620px;

          display: flex;
          flex-direction: column;

          justify-content: center;
        }


        /* =====================================================
           LABEL
        ===================================================== */

        .awareness-label {
          display: flex;
          align-items: center;

          gap: 10px;

          margin-bottom: 22px;

          color: #2457c5;

          font-size: 11px;
          font-weight: 700;

          letter-spacing: 1.6px;
        }


        .label-line {
          width: 38px;
          height: 2px;

          background: #4b7bec;

          border-radius: 10px;
        }


        /* =====================================================
           TITLE
        ===================================================== */

        .question-title {
          margin: 0;

          max-width: 620px;

          color: #102a43;

          font-size: clamp(30px, 3.1vw, 47px);
          line-height: 1.1;

          font-weight: 700;


          letter-spacing: -1.5px;
        }


        .question-title span {
          color: #2864d7;
        }


        /* =====================================================
           DESCRIPTION
        ===================================================== */

        .question-sub {
          max-width: 570px;
          margin: 18px 0 25px;

          color: #5d7187;

          font-size: 16px;

          line-height: 1.7;
        }


        /* =====================================================
           BUTTONS
        ===================================================== */

        .button-stack {
          width: 100%;

          display: flex;

          flex-direction: column;

          gap: 12px;
        }


        .choice-btn {
          width: 100%;

          display: flex;

          align-items: center;

          gap: 15px;

          border-radius: 14px;

          border:
            1px solid #d8e3f1;

          background: rgba(255,255,255,0.92);

          color: #173b68;

          cursor: pointer;

          text-align: left;

          box-shadow:
            0 4px 14px rgba(31, 75, 125, 0.05);

            min-height: 68px;
            padding: 11px 17px;

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }


        .choice-btn:hover {
          transform: translateY(-2px);

          border-color: #86aef1;

          background: #ffffff;

          box-shadow:
            0 10px 25px rgba(45, 91, 150, 0.10);
        }


        /* =====================================================
           PRIMARY BUTTON
        ===================================================== */

        .choice-primary {
          border-color: #3e72dc;

          background:
            linear-gradient(
              135deg,
              #3d73dc,
              #5489ed
            );

          color: white;

          box-shadow:
            0 10px 25px rgba(61, 115, 220, 0.20);
        }


        .choice-primary:hover {
          border-color: #3164ca;

          background:
            linear-gradient(
              135deg,
              #376bd0,
              #4d82e4
            );

          box-shadow:
            0 14px 30px rgba(61, 115, 220, 0.27);
        }


        /* =====================================================
           BUTTON ICON
        ===================================================== */

        .choice-icon {
          width: 38px;
          height: 38px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 11px;

          background: #edf4ff;

          color: #3167ce;

          font-size: 18px;

          font-weight: 700;
        }


        .choice-primary .choice-icon {
          background: rgba(255,255,255,0.18);

          color: white;
        }


        /* =====================================================
           BUTTON TEXT
        ===================================================== */

        .choice-content {
          flex: 1;

          min-width: 0;
        }


        .choice-title {
          font-size: 15px;

          font-weight: 700;

          line-height: 1.3;
        }


        .choice-description {
          margin-top: 4px;

          color: #71859b;

          font-size: 12px;

          line-height: 1.4;
        }


        .choice-primary .choice-description {
          color: rgba(255,255,255,0.78);
        }


        /* =====================================================
           ARROW
        ===================================================== */

        .choice-arrow {
          width: 30px;

          flex-shrink: 0;

          color: #7290b2;

          font-size: 20px;

          text-align: center;

          transition:
            transform 0.2s ease;
        }


        .choice-btn:hover .choice-arrow {
          transform: translateX(4px);
        }


        .choice-primary .choice-arrow {
          color: white;
        }


        /* =====================================================
           PRIVACY
        ===================================================== */

        .privacy-note {
          max-width: 580px;

          margin-top: 22px;

          display: flex;

          align-items: flex-start;

          gap: 9px;

          color: #71859b;

          font-size: 11px;

          line-height: 1.5;
        }


        .privacy-icon {
          flex-shrink: 0;

          font-size: 12px;
        }


        /* =====================================================
           RIGHT SIDE
        ===================================================== */

        .awareness-right {
          width: 42%;

          display: flex;

          align-items: center;
          justify-content: center;
        }


        /* =====================================================
           CLINICAL CARD
        ===================================================== */

        .clinical-card {
          position: relative;

          width: 100%;

          max-width: 430px;

          padding: 30px 32px;

          overflow: hidden;

          border:
            1px solid rgba(119, 157, 211, 0.25);

          border-radius: 26px;

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,0.96),
              rgba(238,246,255,0.92)
            );

          box-shadow:
            0 25px 60px rgba(45, 91, 150, 0.12);
        }


        /* Decorative circle */

        .clinical-card::before {
          content: "";

          position: absolute;

          width: 230px;
          height: 230px;

          right: -110px;
          top: -100px;

          border-radius: 50%;

          background:
            rgba(80, 135, 225, 0.10);
        }


        .clinical-card::after {
          content: "";

          position: absolute;

          width: 170px;
          height: 170px;

          left: -100px;
          bottom: -90px;

          border-radius: 50%;

          background:
            rgba(94, 161, 236, 0.08);
        }


        /* =====================================================
           MEDICAL SYMBOL
        ===================================================== */

        .medical-symbol {
          position: relative;

          width: 58px;
          height: 58px;

          margin-bottom: 25px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 17px;

          background:
            linear-gradient(
              135deg,
              #3e73dc,
              #6596ed
            );

          box-shadow:
            0 10px 25px rgba(62, 115, 220, 0.22);
        }


        .medical-cross {
          color: white;

          font-size: 32px;

          font-weight: 300;

          line-height: 1;
        }


        /* =====================================================
           CARD TEXT
        ===================================================== */

        .clinical-card-label {
          position: relative;

          margin-bottom: 10px;

          color: #3970d2;

          font-size: 10px;

          font-weight: 700;

          letter-spacing: 1.7px;
        }


        .clinical-card h2 {
          position: relative;

          margin: 0;

          color: #15385f;

          font-size: 26px;

          line-height: 1.25;

          font-weight: 700;
        }


        .clinical-card > p {
          position: relative;

          margin:
            18px
            0
            28px;

          color: #667c94;

          font-size: 14px;

          line-height: 1.7;
        }


        /* =====================================================
           INFO GRID
        ===================================================== */

        .clinical-info-grid {
          position: relative;

          display: flex;

          flex-direction: column;

          gap: 10px;
        }


        .clinical-info {
          padding: 12px;

          display: flex;

          align-items: center;

          gap: 11px;

          border:
            1px solid #dce7f5;

          border-radius: 12px;

          background:
            rgba(255,255,255,0.72);
        }


        .info-icon {
          width: 32px;
          height: 32px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 9px;

          background: #edf4ff;

          color: #3b70d3;

          font-size: 14px;

          font-weight: 700;
        }


        .clinical-info div:last-child {
          display: flex;

          flex-direction: column;

          gap: 2px;
        }


        .clinical-info strong {
          color: #25496f;

          font-size: 12px;

          font-weight: 700;
        }


        .clinical-info span {
          color: #8192a5;

          font-size: 10px;
        }


        /* =====================================================
           HEARTBEAT DECORATION
        ===================================================== */

        .heartbeat-line {
          position: relative;

          margin-top: 28px;

          display: flex;

          align-items: center;

          gap: 8px;

          opacity: 0.6;
        }


        .heartbeat-line span {
          height: 1px;

          flex: 1;

          background: #b9cde9;
        }


        .heartbeat-line svg {
          width: 180px;
          height: 40px;
        }


        .heartbeat-line polyline {
          fill: none;

          stroke: #4e80d8;

          stroke-width: 1.5;

          vector-effect: non-scaling-stroke;
        }


        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 1000px) {

          .awareness-wrapper {
            max-width: 900px;

            padding:
              45px
              35px;

            gap: 40px;
          }


          .question-title {
            font-size: 42px;
          }


          .awareness-right {
            width: 40%;
          }


          .clinical-card {
            padding: 32px 28px;
          }


          .clinical-card h2 {
            font-size: 25px;
          }

        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 760px) {

          .awareness-wrapper {
            width: 100%;

            min-height: 100vh;
            min-height: 100dvh;

            padding:
              35px
              20px
              40px;

            display: flex;

            flex-direction: column;

            align-items: stretch;

            justify-content: center;

            gap: 32px;
          }


          .awareness-left {
            width: 100%;

            max-width: none;

            text-align: left;
          }


          .awareness-label {
            margin-bottom: 17px;

            font-size: 9px;

            letter-spacing: 1.4px;
          }


          .label-line {
            width: 28px;
          }


          .question-title {
            max-width: none;

            font-size: clamp(31px, 9vw, 40px);

            line-height: 1.16;

            letter-spacing: -0.8px;
          }


          .question-sub {
            margin:
              17px
              0
              25px;

            max-width: none;

            font-size: 14px;

            line-height: 1.65;
          }


          .button-stack {
            gap: 10px;
          }


          .choice-btn {
            min-height: 72px;

            padding:
              11px
              12px;

            gap: 11px;

            border-radius: 13px;
          }


          .choice-icon {
            width: 38px;
            height: 38px;

            border-radius: 10px;

            font-size: 16px;
          }


          .choice-title {
            font-size: 13.5px;
          }


          .choice-description {
            font-size: 10.5px;
          }


          .choice-arrow {
            font-size: 18px;
          }


          .privacy-note {
            margin-top: 17px;

            font-size: 10px;
          }


          /* Hide the large card on small phones */
          .awareness-right {
            width: 100%;
          }


          .clinical-card {
            max-width: none;

            padding:
              24px
              22px;

            border-radius: 19px;
          }


          .medical-symbol {
            width: 44px;
            height: 44px;

            margin-bottom: 16px;

            border-radius: 13px;
          }


          .medical-cross {
            font-size: 25px;
          }


          .clinical-card-label {
            font-size: 8px;

            letter-spacing: 1.4px;
          }


          .clinical-card h2 {
            font-size: 21px;
          }


          .clinical-card > p {
            margin:
              12px
              0
              17px;

            font-size: 12px;

            line-height: 1.6;
          }


          .clinical-info {
            padding: 9px;
          }


          .info-icon {
            width: 28px;
            height: 28px;
          }


          .clinical-info strong {
            font-size: 10.5px;
          }


          .clinical-info span {
            font-size: 9px;
          }


          .heartbeat-line {
            display: none;
          }

        }


        /* =====================================================
           SMALL PHONES
        ===================================================== */

        @media (max-width: 420px) {

          .awareness-wrapper {
            padding:
              28px
              16px
              30px;
          }


          .question-title {
            font-size: 29px;
          }


          .question-sub {
            font-size: 13px;
          }


          .choice-btn {
            min-height: 68px;
          }


          .choice-description {
            font-size: 10px;
          }


          .clinical-card {
            padding: 21px 18px;
          }

        }


        /* =====================================================
           REDUCED MOTION
        ===================================================== */

        @media (prefers-reduced-motion: reduce) {

          .choice-btn,
          .choice-arrow {
            transition: none;
          }

        }

        .exercise-home-button {
          margin-top: 2px;
          border-color: #a9c4ef;
          background: linear-gradient(135deg, #ffffff, #f4f8ff);
        }
        .exercise-home-icon {
          background: #eaf1ff;
          color: #376bd4;
        }
      `}
</style>
    </div>
  );
};

export default AwarenessScreen;