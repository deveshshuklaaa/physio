// // // import React, { useEffect, useMemo, useState } from "react";
// // // import { useNavigate } from "react-router-dom";
// // // import api from "../apiClient";

// // // const ExercisePlan = () => {
// // //   const navigate = useNavigate();
// // //   const [items, setItems] = useState([]);
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState("");

// // //   const load = async () => {
// // //     try {
// // //       setLoading(true);
// // //       setError("");
// // //       const response = await api.get("/exercise-recommendations");
// // //       setItems(response.data?.recommendations || []);
// // //     } catch (err) {
// // //       setError(err.response?.data?.message || "Unable to load your exercise plan.");
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   useEffect(() => { load(); }, []);

// // //   const active = useMemo(
// // //     () => items.filter((item) => item.status === "ACTIVE"),
// // //     [items]
// // //   );
// // //   const pending = useMemo(
// // //     () => items.filter((item) => item.status === "PENDING_DOCTOR_REVIEW"),
// // //     [items]
// // //   );

// // //   return (
// // //     <div className="exercise-page">
// // //       <div className="exercise-shell">
// // //         <button className="exercise-back" onClick={() => navigate("/awareness")}>← Back to Home</button>

// // //         <header className="exercise-hero">
// // //           <div className="exercise-hero-icon">✦</div>
// // //           <div>
// // //             <span className="exercise-eyebrow">PERSONALISED REHABILITATION</span>
// // //             <h1>My Exercise Plan</h1>
// // //             <p>Exercises recommended from your clinical profile and reviewed by your consulting doctor.</p>
// // //           </div>
// // //         </header>

// // //         <div className="exercise-notice">
// // //           <span>ⓘ</span>
// // //           <div>
// // //             <strong>Doctor review is required</strong>
// // //             <p>New ML recommendations remain pending until your consulting doctor approves them.</p>
// // //           </div>
// // //         </div>

// // //         {error && <div className="exercise-error">{error}</div>}

// // //         {loading ? (
// // //           <div className="exercise-empty">Loading your exercise plan…</div>
// // //         ) : (
// // //           <>
// // //             {active.length > 0 && (
// // //               <section className="exercise-section">
// // //                 <div className="exercise-section-head">
// // //                   <div>
// // //                     <span className="exercise-section-label">ACTIVE PLAN</span>
// // //                     <h2>Exercises approved for you</h2>
// // //                   </div>
// // //                   <span className="exercise-count">{active.length}</span>
// // //                 </div>
// // //                 <div className="exercise-grid">
// // //                   {active.map((item) => <ExerciseCard key={item._id} item={item} active />)}
// // //                 </div>
// // //               </section>
// // //             )}

// // //             {pending.length > 0 && (
// // //               <section className="exercise-section">
// // //                 <div className="exercise-section-head">
// // //                   <div>
// // //                     <span className="exercise-section-label pending">WAITING FOR REVIEW</span>
// // //                     <h2>Doctor review in progress</h2>
// // //                   </div>
// // //                   <span className="exercise-count pending-count">{pending.length}</span>
// // //                 </div>
// // //                 <div className="exercise-grid">
// // //                   {pending.map((item) => <ExerciseCard key={item._id} item={item} />)}
// // //                 </div>
// // //               </section>
// // //             )}

// // //             {active.length === 0 && pending.length === 0 && (
// // //               <div className="exercise-empty">
// // //                 <div className="exercise-empty-icon">♡</div>
// // //                 <h3>No exercise recommendations yet</h3>
// // //                 <p>Complete your clinical details and your care team can generate a personalised plan.</p>
// // //               </div>
// // //             )}
// // //           </>
// // //         )}
// // //       </div>

// // //       <style>{`
// // //         .exercise-page{min-height:100vh;background:linear-gradient(135deg,#eef3fa,#f8fbff);padding:32px 20px;color:#1d2a47;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
// // //         .exercise-shell{width:min(1040px,100%);margin:0 auto}
// // //         .exercise-back{border:0;background:transparent;color:#49698f;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:22px;padding:6px 0}
// // //         .exercise-hero{display:flex;align-items:center;gap:18px;background:#fff;border:1px solid #dce5f0;border-radius:20px;padding:26px 28px;box-shadow:0 16px 45px rgba(30,48,95,.08)}
// // //         .exercise-hero-icon{width:54px;height:54px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#24328f,#4a7dfc);color:#fff;font-size:24px}
// // //         .exercise-eyebrow,.exercise-section-label{font-size:10px;letter-spacing:1.3px;font-weight:800;color:#4a7dfc}
// // //         .exercise-hero h1{margin:5px 0 6px;font-size:30px}
// // //         .exercise-hero p{margin:0;color:#71829a;font-size:14px;line-height:1.55}
// // //         .exercise-notice{margin-top:16px;padding:14px 16px;display:flex;gap:11px;background:#eff8ff;border:1px solid #cfe2f4;border-radius:13px;color:#315d70}
// // //         .exercise-notice p{margin:3px 0 0;color:#648499;font-size:12px}
// // //         .exercise-error{margin-top:16px;padding:13px 15px;background:#fff2f2;border:1px solid #efcaca;border-radius:11px;color:#a33b3b;font-weight:600}
// // //         .exercise-section{margin-top:25px;background:#fff;border:1px solid #dce5f0;border-radius:18px;padding:22px;box-shadow:0 12px 32px rgba(30,48,95,.06)}
// // //         .exercise-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:17px}
// // //         .exercise-section-head h2{margin:4px 0 0;font-size:20px}
// // //         .exercise-section-label.pending{color:#b27820}.exercise-count{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#edf3ff;color:#315dd0;font-weight:800}.pending-count{background:#fff5df;color:#9a6719}
// // //         .exercise-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
// // //         .exercise-card{border:1px solid #e0e7f0;border-radius:15px;padding:18px;background:#fbfcff;transition:.2s}.exercise-card:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(30,48,95,.07)}
// // //         .exercise-card-top{display:flex;justify-content:space-between;gap:10px}.exercise-card h3{margin:0;font-size:17px}.exercise-status{font-size:9px;font-weight:800;padding:5px 8px;border-radius:20px;white-space:nowrap;background:#e8f7ef;color:#278454}.exercise-status.pending{background:#fff5df;color:#9a6719}
// // //         .exercise-purpose{color:#71829a;font-size:12px;line-height:1.5;margin:8px 0 15px}.exercise-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.exercise-meta div{background:#fff;border:1px solid #e5eaf1;border-radius:9px;padding:9px}.exercise-meta span{display:block;color:#8b98aa;font-size:9px;margin-bottom:3px}.exercise-meta strong{font-size:11px;color:#34445f}.exercise-joint{margin-top:12px;color:#49698f;font-size:11px;font-weight:700}.exercise-confidence{margin-top:8px;color:#7b8ba0;font-size:10px}
// // //         .exercise-empty{margin-top:24px;padding:50px 20px;text-align:center;background:#fff;border:1px solid #dce5f0;border-radius:18px;color:#71829a}.exercise-empty-icon{font-size:30px;color:#4a7dfc}.exercise-empty h3{margin:10px 0 5px;color:#263650}.exercise-empty p{margin:0;font-size:13px}
// // //         @media(max-width:720px){.exercise-page{padding:20px 12px}.exercise-hero{padding:20px}.exercise-hero h1{font-size:24px}.exercise-grid{grid-template-columns:1fr}.exercise-meta{grid-template-columns:1fr 1fr}}
// // //       `}</style>
// // //     </div>
// // //   );
// // // };

// // // const ExerciseCard = ({ item, active }) => (
// // //   <article className="exercise-card">
// // //     <div className="exercise-card-top">
// // //       <h3>{item.exerciseName}</h3>
// // //       <span className={`exercise-status ${active ? "" : "pending"}`}>{active ? "Approved" : "Pending review"}</span>
// // //     </div>
// // //     <p className="exercise-purpose">{item.purpose || "Personalised rehabilitation exercise."}</p>
// // //     <div className="exercise-meta">
// // //       <div><span>Sets</span><strong>{item.sets ?? "—"}</strong></div>
// // //       <div><span>Reps / Duration</span><strong>{item.repetitionsOrDuration || "—"}</strong></div>
// // //       <div><span>Frequency</span><strong>{item.frequency || "As advised"}</strong></div>
// // //     </div>
// // //     {item.joint && <div className="exercise-joint">Target joint: {item.joint}</div>}
// // //     {item.mlConfidence != null && <div className="exercise-confidence">ML confidence: {Math.round(item.mlConfidence * 100)}%</div>}
// // //   </article>
// // // );

// // // export default ExercisePlan;




// // import React, { useEffect, useMemo, useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import api from "../apiClient";

// // const ExercisePlan = () => {
// //   const navigate = useNavigate();
// //   const [items, setItems] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState("");

// //   const load = async () => {
// //     try {
// //       setLoading(true);
// //       setError("");

// //       let response = await api.get("/exercise-recommendations");
// //       let recommendations = response.data?.recommendations || [];

// //       // If the patient has already completed clinical details but no
// //       // recommendation record exists yet, trigger generation here too.
// //       // This makes the page recover automatically from an earlier failed
// //       // generation attempt instead of permanently showing an empty state.
// //       if (recommendations.length === 0) {
// //         try {
// //           const generated = await api.post("/exercise-recommendations/generate");
// //           console.log("[EXERCISE PLAN] Generate response:", generated.data);

// //           response = await api.get("/exercise-recommendations");
// //           recommendations = response.data?.recommendations || [];
// //         } catch (generateError) {
// //           console.error(
// //             "[EXERCISE PLAN] Automatic generation failed:",
// //             generateError.response?.data || generateError.message
// //           );

// //           // Keep the original GET result. The backend may already have
// //           // records even if generation was not available at this moment.
// //         }
// //       }

// //       setItems(recommendations);
// //     } catch (err) {
// //       console.error("[EXERCISE PLAN] Load error:", err);
// //       setError(
// //         err.response?.data?.message ||
// //           "Unable to load your exercise plan."
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => { load(); }, []);

// //   const active = useMemo(
// //     () => items.filter((item) => item.status === "ACTIVE"),
// //     [items]
// //   );
// //   const pending = useMemo(
// //     () => items.filter((item) => item.status === "PENDING_DOCTOR_REVIEW"),
// //     [items]
// //   );

// //   return (
// //     <div className="exercise-page">
// //       <div className="exercise-shell">
// //         <button className="exercise-back" onClick={() => navigate("/awareness")}>← Back to Home</button>

// //         <header className="exercise-hero">
// //           <div className="exercise-hero-icon">✦</div>
// //           <div>
// //             <span className="exercise-eyebrow">PERSONALISED REHABILITATION</span>
// //             <h1>My Exercise Plan</h1>
// //             <p>Exercises recommended from your clinical profile and reviewed by your consulting doctor.</p>
// //           </div>
// //         </header>

// //         <div className="exercise-notice">
// //           <span>ⓘ</span>
// //           <div>
// //             <strong>Doctor review is required</strong>
// //             <p>New ML recommendations remain pending until your consulting doctor approves them.</p>
// //           </div>
// //         </div>

// //         {error && <div className="exercise-error">{error}</div>}

// //         {loading ? (
// //           <div className="exercise-empty">Loading your exercise plan…</div>
// //         ) : (
// //           <>
// //             {active.length > 0 && (
// //               <section className="exercise-section">
// //                 <div className="exercise-section-head">
// //                   <div>
// //                     <span className="exercise-section-label">ACTIVE PLAN</span>
// //                     <h2>Exercises approved for you</h2>
// //                   </div>
// //                   <span className="exercise-count">{active.length}</span>
// //                 </div>
// //                 <div className="exercise-grid">
// //                   {active.map((item) => <ExerciseCard key={item._id} item={item} active />)}
// //                 </div>
// //               </section>
// //             )}

// //             {pending.length > 0 && (
// //               <section className="exercise-section">
// //                 <div className="exercise-section-head">
// //                   <div>
// //                     <span className="exercise-section-label pending">WAITING FOR REVIEW</span>
// //                     <h2>Doctor review in progress</h2>
// //                   </div>
// //                   <span className="exercise-count pending-count">{pending.length}</span>
// //                 </div>
// //                 <div className="exercise-grid">
// //                   {pending.map((item) => <ExerciseCard key={item._id} item={item} />)}
// //                 </div>
// //               </section>
// //             )}

// //             {active.length === 0 && pending.length === 0 && (
// //               <div className="exercise-empty">
// //                 <div className="exercise-empty-icon">♡</div>
// //                 <h3>No exercise recommendations yet</h3>
// //                 <p>Your clinical details may still be processing. Try generating your personalised plan again.</p>
// //                 <button className="exercise-refresh-btn" onClick={load}>Generate / Refresh Plan</button>
// //               </div>
// //             )}
// //           </>
// //         )}
// //       </div>

// //       <style>{`
// //         .exercise-page{min-height:100vh;background:linear-gradient(135deg,#eef3fa,#f8fbff);padding:32px 20px;color:#1d2a47;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
// //         .exercise-shell{width:min(1040px,100%);margin:0 auto}
// //         .exercise-back{border:0;background:transparent;color:#49698f;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:22px;padding:6px 0}
// //         .exercise-hero{display:flex;align-items:center;gap:18px;background:#fff;border:1px solid #dce5f0;border-radius:20px;padding:26px 28px;box-shadow:0 16px 45px rgba(30,48,95,.08)}
// //         .exercise-hero-icon{width:54px;height:54px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#24328f,#4a7dfc);color:#fff;font-size:24px}
// //         .exercise-eyebrow,.exercise-section-label{font-size:10px;letter-spacing:1.3px;font-weight:800;color:#4a7dfc}
// //         .exercise-hero h1{margin:5px 0 6px;font-size:30px}
// //         .exercise-hero p{margin:0;color:#71829a;font-size:14px;line-height:1.55}
// //         .exercise-notice{margin-top:16px;padding:14px 16px;display:flex;gap:11px;background:#eff8ff;border:1px solid #cfe2f4;border-radius:13px;color:#315d70}
// //         .exercise-notice p{margin:3px 0 0;color:#648499;font-size:12px}
// //         .exercise-error{margin-top:16px;padding:13px 15px;background:#fff2f2;border:1px solid #efcaca;border-radius:11px;color:#a33b3b;font-weight:600}
// //         .exercise-section{margin-top:25px;background:#fff;border:1px solid #dce5f0;border-radius:18px;padding:22px;box-shadow:0 12px 32px rgba(30,48,95,.06)}
// //         .exercise-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:17px}
// //         .exercise-section-head h2{margin:4px 0 0;font-size:20px}
// //         .exercise-section-label.pending{color:#b27820}.exercise-count{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#edf3ff;color:#315dd0;font-weight:800}.pending-count{background:#fff5df;color:#9a6719}
// //         .exercise-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
// //         .exercise-card{border:1px solid #e0e7f0;border-radius:15px;padding:18px;background:#fbfcff;transition:.2s}.exercise-card:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(30,48,95,.07)}
// //         .exercise-card-top{display:flex;justify-content:space-between;gap:10px}.exercise-card h3{margin:0;font-size:17px}.exercise-status{font-size:9px;font-weight:800;padding:5px 8px;border-radius:20px;white-space:nowrap;background:#e8f7ef;color:#278454}.exercise-status.pending{background:#fff5df;color:#9a6719}
// //         .exercise-purpose{color:#71829a;font-size:12px;line-height:1.5;margin:8px 0 15px}.exercise-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.exercise-meta div{background:#fff;border:1px solid #e5eaf1;border-radius:9px;padding:9px}.exercise-meta span{display:block;color:#8b98aa;font-size:9px;margin-bottom:3px}.exercise-meta strong{font-size:11px;color:#34445f}.exercise-joint{margin-top:12px;color:#49698f;font-size:11px;font-weight:700}.exercise-confidence{margin-top:8px;color:#7b8ba0;font-size:10px}
// //         .exercise-empty{margin-top:24px;padding:50px 20px;text-align:center;background:#fff;border:1px solid #dce5f0;border-radius:18px;color:#71829a}.exercise-empty-icon{font-size:30px;color:#4a7dfc}.exercise-empty h3{margin:10px 0 5px;color:#263650}.exercise-empty p{margin:0;font-size:13px}.exercise-refresh-btn{margin-top:16px;border:0;border-radius:10px;padding:10px 16px;background:#356fd3;color:#fff;font-weight:700;cursor:pointer}.exercise-refresh-btn:hover{opacity:.92}
// //         @media(max-width:720px){.exercise-page{padding:20px 12px}.exercise-hero{padding:20px}.exercise-hero h1{font-size:24px}.exercise-grid{grid-template-columns:1fr}.exercise-meta{grid-template-columns:1fr 1fr}}
// //       `}</style>
// //     </div>
// //   );
// // };

// // const ExerciseCard = ({ item, active }) => (
// //   <article className="exercise-card">
// //     <div className="exercise-card-top">
// //       <h3>{item.exerciseName}</h3>
// //       <span className={`exercise-status ${active ? "" : "pending"}`}>{active ? "Approved" : "Pending review"}</span>
// //     </div>
// //     <p className="exercise-purpose">{item.purpose || "Personalised rehabilitation exercise."}</p>
// //     <div className="exercise-meta">
// //       <div><span>Sets</span><strong>{item.sets ?? "—"}</strong></div>
// //       <div><span>Reps / Duration</span><strong>{item.repetitionsOrDuration || "—"}</strong></div>
// //       <div><span>Frequency</span><strong>{item.frequency || "As advised"}</strong></div>
// //     </div>
// //     {item.joint && <div className="exercise-joint">Target joint: {item.joint}</div>}
// //     {item.mlConfidence != null && <div className="exercise-confidence">ML confidence: {Math.round(item.mlConfidence * 100)}%</div>}
// //   </article>
// // );

// // export default ExercisePlan;





























// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../apiClient";

// const T = {
//   en: {
//     back: "← Back to Home",
//     eyebrow: "PERSONALISED REHABILITATION",
//     title: "My Exercise Plan",
//     subtitle: "Exercises recommended from your clinical profile and reviewed by your consulting doctor.",
//     noticeTitle: "Doctor review is required",
//     notice: "New ML recommendations remain pending until your consulting doctor approves them.",
//     activeLabel: "ACTIVE PLAN",
//     activeTitle: "Exercises approved for you",
//     pendingLabel: "WAITING FOR REVIEW",
//     pendingTitle: "Doctor review in progress",
//     approved: "Approved",
//     pending: "Pending review",
//     sets: "Sets",
//     reps: "Reps / Duration",
//     frequency: "Frequency",
//     joint: "Target joint",
//     confidence: "ML confidence",
//     empty: "No exercise recommendations yet",
//     emptyText: "Your clinical details may still be processing. Try generating your personalised plan again.",
//     refresh: "Generate / Refresh Plan",
//     loading: "Loading your exercise plan…",
//     language: "Language",
//     english: "English",
//     hindi: "हिंदी",
//     marathi: "मराठी",
//     error: "Unable to load your exercise plan.",
//   },
//   hi: {
//     back: "← होम पर वापस जाएँ",
//     eyebrow: "व्यक्तिगत पुनर्वास",
//     title: "मेरी व्यायाम योजना",
//     subtitle: "आपकी क्लिनिकल प्रोफ़ाइल के आधार पर सुझाए गए और आपके परामर्शदाता डॉक्टर द्वारा समीक्षा किए गए व्यायाम।",
//     noticeTitle: "डॉक्टर की समीक्षा आवश्यक है",
//     notice: "नई ML सिफारिशें तब तक लंबित रहेंगी जब तक आपके डॉक्टर उन्हें स्वीकृत नहीं करते।",
//     activeLabel: "सक्रिय योजना",
//     activeTitle: "आपके लिए स्वीकृत व्यायाम",
//     pendingLabel: "समीक्षा लंबित",
//     pendingTitle: "डॉक्टर की समीक्षा जारी है",
//     approved: "स्वीकृत",
//     pending: "समीक्षा लंबित",
//     sets: "सेट",
//     reps: "दोहराव / अवधि",
//     frequency: "आवृत्ति",
//     joint: "लक्षित जोड़",
//     confidence: "ML विश्वसनीयता",
//     empty: "अभी कोई व्यायाम सिफारिश नहीं है",
//     emptyText: "आपकी क्लिनिकल जानकारी अभी प्रोसेस हो सकती है। अपनी व्यक्तिगत योजना फिर से जनरेट करें।",
//     refresh: "योजना जनरेट / रिफ्रेश करें",
//     loading: "आपकी व्यायाम योजना लोड हो रही है…",
//     language: "भाषा",
//     english: "English",
//     hindi: "हिंदी",
//     marathi: "मराठी",
//     error: "आपकी व्यायाम योजना लोड नहीं हो सकी।",
//   },
//   mr: {
//     back: "← होमवर परत जा",
//     eyebrow: "वैयक्तिक पुनर्वसन",
//     title: "माझी व्यायाम योजना",
//     subtitle: "तुमच्या क्लिनिकल प्रोफाइलनुसार सुचवलेले आणि तुमच्या सल्लागार डॉक्टरांनी तपासलेले व्यायाम।",
//     noticeTitle: "डॉक्टरांचे पुनरावलोकन आवश्यक आहे",
//     notice: "तुमचे डॉक्टर मंजूर करेपर्यंत नवीन ML शिफारसी प्रलंबित राहतील।",
//     activeLabel: "सक्रिय योजना",
//     activeTitle: "तुमच्यासाठी मंजूर केलेले व्यायाम",
//     pendingLabel: "पुनरावलोकन प्रलंबित",
//     pendingTitle: "डॉक्टरांचे पुनरावलोकन सुरू आहे",
//     approved: "मंजूर",
//     pending: "पुनरावलोकन प्रलंबित",
//     sets: "सेट",
//     reps: "पुनरावृत्ती / कालावधी",
//     frequency: "वारंवारता",
//     joint: "लक्षित सांधा",
//     confidence: "ML विश्वास",
//     empty: "अद्याप कोणतीही व्यायाम शिफारस नाही",
//     emptyText: "तुमची क्लिनिकल माहिती अद्याप प्रक्रिया होत असू शकते. तुमची वैयक्तिक योजना पुन्हा तयार करा।",
//     refresh: "योजना तयार / रिफ्रेश करा",
//     loading: "तुमची व्यायाम योजना लोड होत आहे…",
//     language: "भाषा",
//     english: "English",
//     hindi: "हिंदी",
//     marathi: "मराठी",
//     error: "तुमची व्यायाम योजना लोड करता आली नाही।",
//   },
// };

// const getInitialLanguage = () => {
//   const saved = localStorage.getItem("preferredLanguage") || "en";
//   if (["en", "hi", "mr"].includes(saved)) return saved;
//   if (saved.toLowerCase().startsWith("hindi")) return "hi";
//   if (saved.toLowerCase().startsWith("marathi")) return "mr";
//   return "en";
// };

// const ExercisePlan = () => {
//   const navigate = useNavigate();
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [language, setLanguage] = useState(getInitialLanguage);

//   const t = T[language] || T.en;

//   const changeLanguage = (value) => {
//     setLanguage(value);
//     localStorage.setItem("preferredLanguage", value);
//   };

//   const load = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       let response = await api.get("/exercise-recommendations");
//       let recommendations = response.data?.recommendations || [];

//       if (recommendations.length === 0) {
//         try {
//           const generated = await api.post("/exercise-recommendations/generate");
//           console.log("[EXERCISE PLAN] Generate response:", generated.data);
//           response = await api.get("/exercise-recommendations");
//           recommendations = response.data?.recommendations || [];
//         } catch (generateError) {
//           console.error(
//             "[EXERCISE PLAN] Automatic generation failed:",
//             generateError.response?.data || generateError.message
//           );
//         }
//       }

//       setItems(recommendations);
//     } catch (err) {
//       console.error("[EXERCISE PLAN] Load error:", err);
//       setError(err.response?.data?.message || t.error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const active = useMemo(
//     () => items.filter((item) => item.status === "ACTIVE"),
//     [items]
//   );

//   const pending = useMemo(
//     () => items.filter((item) => item.status === "PENDING_DOCTOR_REVIEW"),
//     [items]
//   );

//   return (
//     <div className="exercise-page">
//       <div className="exercise-shell">
//         <div className="exercise-topbar">
//           <button className="exercise-back" onClick={() => navigate("/awareness")}>
//             {t.back}
//           </button>

//           <label className="exercise-language">
//             <span>{t.language}</span>
//             <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
//               <option value="en">{t.english}</option>
//               <option value="hi">{t.hindi}</option>
//               <option value="mr">{t.marathi}</option>
//             </select>
//           </label>
//         </div>

//         <header className="exercise-hero">
//           <div className="exercise-hero-icon">✦</div>
//           <div>
//             <span className="exercise-eyebrow">{t.eyebrow}</span>
//             <h1>{t.title}</h1>
//             <p>{t.subtitle}</p>
//           </div>
//         </header>

//         <div className="exercise-notice">
//           <span>ⓘ</span>
//           <div>
//             <strong>{t.noticeTitle}</strong>
//             <p>{t.notice}</p>
//           </div>
//         </div>

//         {error && <div className="exercise-error">{error}</div>}

//         {loading ? (
//           <div className="exercise-empty">{t.loading}</div>
//         ) : (
//           <>
//             {active.length > 0 && (
//               <section className="exercise-section">
//                 <div className="exercise-section-head">
//                   <div>
//                     <span className="exercise-section-label">{t.activeLabel}</span>
//                     <h2>{t.activeTitle}</h2>
//                   </div>
//                   <span className="exercise-count">{active.length}</span>
//                 </div>
//                 <div className="exercise-grid">
//                   {active.map((item) => (
//                     <ExerciseCard key={item._id} item={item} active t={t} />
//                   ))}
//                 </div>
//               </section>
//             )}

//             {pending.length > 0 && (
//               <section className="exercise-section">
//                 <div className="exercise-section-head">
//                   <div>
//                     <span className="exercise-section-label pending">{t.pendingLabel}</span>
//                     <h2>{t.pendingTitle}</h2>
//                   </div>
//                   <span className="exercise-count pending-count">{pending.length}</span>
//                 </div>
//                 <div className="exercise-grid">
//                   {pending.map((item) => (
//                     <ExerciseCard key={item._id} item={item} t={t} />
//                   ))}
//                 </div>
//               </section>
//             )}

//             {active.length === 0 && pending.length === 0 && (
//               <div className="exercise-empty">
//                 <div className="exercise-empty-icon">♡</div>
//                 <h3>{t.empty}</h3>
//                 <p>{t.emptyText}</p>
//                 <button className="exercise-refresh-btn" onClick={load}>{t.refresh}</button>
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       <style>{`
//         .exercise-page{min-height:100vh;background:linear-gradient(135deg,#eef3fa,#f8fbff);padding:32px 20px;color:#1d2a47;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
//         .exercise-shell{width:min(1040px,100%);margin:0 auto}
//         .exercise-topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:14px}
//         .exercise-back{border:0;background:transparent;color:#49698f;font-size:14px;font-weight:700;cursor:pointer;padding:6px 0}
//         .exercise-language{display:flex;align-items:center;gap:8px;border:1px solid #dce5f0;background:#fff;border-radius:11px;padding:7px 10px;color:#58708e;font-size:11px;font-weight:700}
//         .exercise-language select{border:0;background:transparent;color:#294363;font-weight:700;outline:0;cursor:pointer}
//         .exercise-hero{display:flex;align-items:center;gap:18px;background:#fff;border:1px solid #dce5f0;border-radius:20px;padding:26px 28px;box-shadow:0 16px 45px rgba(30,48,95,.08)}
//         .exercise-hero-icon{width:54px;height:54px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#24328f,#4a7dfc);color:#fff;font-size:24px}
//         .exercise-eyebrow,.exercise-section-label{font-size:10px;letter-spacing:1.3px;font-weight:800;color:#4a7dfc}
//         .exercise-hero h1{margin:5px 0 6px;font-size:30px}.exercise-hero p{margin:0;color:#71829a;font-size:14px;line-height:1.55}
//         .exercise-notice{margin-top:16px;padding:14px 16px;display:flex;gap:11px;background:#eff8ff;border:1px solid #cfe2f4;border-radius:13px;color:#315d70}.exercise-notice p{margin:3px 0 0;color:#648499;font-size:12px}
//         .exercise-error{margin-top:16px;padding:13px 15px;background:#fff2f2;border:1px solid #efcaca;border-radius:11px;color:#a33b3b;font-weight:600}
//         .exercise-section{margin-top:25px;background:#fff;border:1px solid #dce5f0;border-radius:18px;padding:22px;box-shadow:0 12px 32px rgba(30,48,95,.06)}
//         .exercise-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:17px}.exercise-section-head h2{margin:4px 0 0;font-size:20px}
//         .exercise-section-label.pending{color:#b27820}.exercise-count{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#edf3ff;color:#315dd0;font-weight:800}.pending-count{background:#fff5df;color:#9a6719}
//         .exercise-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.exercise-card{border:1px solid #e0e7f0;border-radius:15px;padding:18px;background:#fbfcff;transition:.2s}.exercise-card:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(30,48,95,.07)}
//         .exercise-card-top{display:flex;justify-content:space-between;gap:10px}.exercise-card h3{margin:0;font-size:17px}.exercise-status{font-size:9px;font-weight:800;padding:5px 8px;border-radius:20px;white-space:nowrap;background:#e8f7ef;color:#278454}.exercise-status.pending{background:#fff5df;color:#9a6719}
//         .exercise-purpose{color:#71829a;font-size:12px;line-height:1.5;margin:8px 0 15px}.exercise-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.exercise-meta div{background:#fff;border:1px solid #e5eaf1;border-radius:9px;padding:9px}.exercise-meta span{display:block;color:#8b98aa;font-size:9px;margin-bottom:3px}.exercise-meta strong{font-size:11px;color:#34445f}.exercise-joint{margin-top:12px;color:#49698f;font-size:11px;font-weight:700}.exercise-confidence{margin-top:8px;color:#7b8ba0;font-size:10px}
//         .exercise-empty{margin-top:24px;padding:50px 20px;text-align:center;background:#fff;border:1px solid #dce5f0;border-radius:18px;color:#71829a}.exercise-empty-icon{font-size:30px;color:#4a7dfc}.exercise-empty h3{margin:10px 0 5px;color:#263650}.exercise-empty p{margin:0;font-size:13px}.exercise-refresh-btn{margin-top:16px;border:0;border-radius:10px;padding:10px 16px;background:#356fd3;color:#fff;font-weight:700;cursor:pointer}.exercise-refresh-btn:hover{opacity:.92}
//         @media(max-width:720px){.exercise-page{padding:20px 12px}.exercise-topbar{align-items:flex-start}.exercise-language{flex-direction:column;align-items:flex-start}.exercise-hero{padding:20px}.exercise-hero h1{font-size:24px}.exercise-grid{grid-template-columns:1fr}.exercise-meta{grid-template-columns:1fr 1fr}}
//       `}</style>
//     </div>
//   );
// };

// const ExerciseCard = ({ item, active, t }) => (
//   <article className="exercise-card">
//     <div className="exercise-card-top">
//       <h3>{item.exerciseName}</h3>
//       <span className={`exercise-status ${active ? "" : "pending"}`}>
//         {active ? t.approved : t.pending}
//       </span>
//     </div>
//     <p className="exercise-purpose">{item.purpose || "Personalised rehabilitation exercise."}</p>
//     <div className="exercise-meta">
//       <div><span>{t.sets}</span><strong>{item.sets ?? "—"}</strong></div>
//       <div><span>{t.reps}</span><strong>{item.repetitionsOrDuration || "—"}</strong></div>
//       <div><span>{t.frequency}</span><strong>{item.frequency || "As advised"}</strong></div>
//     </div>
//     {item.joint && <div className="exercise-joint">{t.joint}: {item.joint}</div>}
//     {item.mlConfidence != null && (
//       <div className="exercise-confidence">{t.confidence}: {Math.round(Number(item.mlConfidence) * 100)}%</div>
//     )}
//     {item.source === "DOCTOR" && (
//       <div className="exercise-confidence">Doctor prescribed</div>
//     )}
//   </article>
// );

// export default ExercisePlan;






import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apiClient";

const T = {
  en: {
    back: "← Back to Home",
    eyebrow: "PERSONALISED REHABILITATION",
    title: "My Exercise Plan",
    subtitle: "Exercises recommended from your clinical profile and reviewed by your consulting doctor.",
    noticeTitle: "Doctor review is required",
    notice: "New ML recommendations remain pending until your consulting doctor approves them.",
    activeLabel: "ACTIVE PLAN",
    activeTitle: "Exercises approved for you",
    pendingLabel: "WAITING FOR REVIEW",
    pendingTitle: "Doctor review in progress",
    approved: "Approved",
    pending: "Pending review",
    sets: "Sets",
    reps: "Reps / Duration",
    frequency: "Frequency",
    joint: "Target joint",
    confidence: "ML confidence",
    empty: "No exercise recommendations yet",
    emptyText: "Your clinical details may still be processing. Try generating your personalised plan again.",
    refresh: "Generate / Refresh Plan",
    loading: "Loading your exercise plan…",
    language: "Language",
    english: "English",
    hindi: "हिंदी",
    marathi: "मराठी",
    error: "Unable to load your exercise plan.",
    startNow: "Start Now",
    awaitingApproval: "Awaiting doctor approval",
    pastSessionsLabel: "SESSION HISTORY",
    pastSessionsTitle: "Past sessions",
    colDate: "Date",
    colExercise: "Exercise",
    colReps: "Reps",
    colCleanRate: "Clean rate",
    viewReport: "View report",
    noPastSessions: "No sessions yet. Start an exercise above to see it here.",
    pastSessionsError: "Unable to load your session history.",
  },
  hi: {
    back: "← होम पर वापस जाएँ",
    eyebrow: "व्यक्तिगत पुनर्वास",
    title: "मेरी व्यायाम योजना",
    subtitle: "आपकी क्लिनिकल प्रोफ़ाइल के आधार पर सुझाए गए और आपके परामर्शदाता डॉक्टर द्वारा समीक्षा किए गए व्यायाम।",
    noticeTitle: "डॉक्टर की समीक्षा आवश्यक है",
    notice: "नई ML सिफारिशें तब तक लंबित रहेंगी जब तक आपके डॉक्टर उन्हें स्वीकृत नहीं करते।",
    activeLabel: "सक्रिय योजना",
    activeTitle: "आपके लिए स्वीकृत व्यायाम",
    pendingLabel: "समीक्षा लंबित",
    pendingTitle: "डॉक्टर की समीक्षा जारी है",
    approved: "स्वीकृत",
    pending: "समीक्षा लंबित",
    sets: "सेट",
    reps: "दोहराव / अवधि",
    frequency: "आवृत्ति",
    joint: "लक्षित जोड़",
    confidence: "ML विश्वसनीयता",
    empty: "अभी कोई व्यायाम सिफारिश नहीं है",
    emptyText: "आपकी क्लिनिकल जानकारी अभी प्रोसेस हो सकती है। अपनी व्यक्तिगत योजना फिर से जनरेट करें।",
    refresh: "योजना जनरेट / रिफ्रेश करें",
    loading: "आपकी व्यायाम योजना लोड हो रही है…",
    language: "भाषा",
    english: "English",
    hindi: "हिंदी",
    marathi: "मराठी",
    error: "आपकी व्यायाम योजना लोड नहीं हो सकी।",
    startNow: "अभी शुरू करें",
    awaitingApproval: "डॉक्टर की स्वीकृति की प्रतीक्षा है",
    pastSessionsLabel: "सत्र इतिहास",
    pastSessionsTitle: "पिछले सत्र",
    colDate: "तारीख",
    colExercise: "व्यायाम",
    colReps: "दोहराव",
    colCleanRate: "क्लीन दर",
    viewReport: "रिपोर्ट देखें",
    noPastSessions: "अभी तक कोई सत्र नहीं। यहाँ देखने के लिए ऊपर से व्यायाम शुरू करें।",
    pastSessionsError: "आपका सत्र इतिहास लोड नहीं हो सका।",
  },
  mr: {
    back: "← होमवर परत जा",
    eyebrow: "वैयक्तिक पुनर्वसन",
    title: "माझी व्यायाम योजना",
    subtitle: "तुमच्या क्लिनिकल प्रोफाइलनुसार सुचवलेले आणि तुमच्या सल्लागार डॉक्टरांनी तपासलेले व्यायाम।",
    noticeTitle: "डॉक्टरांचे पुनरावलोकन आवश्यक आहे",
    notice: "तुमचे डॉक्टर मंजूर करेपर्यंत नवीन ML शिफारसी प्रलंबित राहतील।",
    activeLabel: "सक्रिय योजना",
    activeTitle: "तुमच्यासाठी मंजूर केलेले व्यायाम",
    pendingLabel: "पुनरावलोकन प्रलंबित",
    pendingTitle: "डॉक्टरांचे पुनरावलोकन सुरू आहे",
    approved: "मंजूर",
    pending: "पुनरावलोकन प्रलंबित",
    sets: "सेट",
    reps: "पुनरावृत्ती / कालावधी",
    frequency: "वारंवारता",
    joint: "लक्षित सांधा",
    confidence: "ML विश्वास",
    empty: "अद्याप कोणतीही व्यायाम शिफारस नाही",
    emptyText: "तुमची क्लिनिकल माहिती अद्याप प्रक्रिया होत असू शकते. तुमची वैयक्तिक योजना पुन्हा तयार करा।",
    refresh: "योजना तयार / रिफ्रेश करा",
    loading: "तुमची व्यायाम योजना लोड होत आहे…",
    language: "भाषा",
    english: "English",
    hindi: "हिंदी",
    marathi: "मराठी",
    error: "तुमची व्यायाम योजना लोड करता आली नाही।",
    startNow: "आता सुरू करा",
    awaitingApproval: "डॉक्टरांच्या मंजुरीची प्रतीक्षा आहे",
    pastSessionsLabel: "सत्र इतिहास",
    pastSessionsTitle: "मागील सत्रे",
    colDate: "तारीख",
    colExercise: "व्यायाम",
    colReps: "पुनरावृत्ती",
    colCleanRate: "क्लीन दर",
    viewReport: "अहवाल पहा",
    noPastSessions: "अद्याप कोणतेही सत्र नाही. येथे पाहण्यासाठी वरील व्यायाम सुरू करा.",
    pastSessionsError: "तुमचा सत्र इतिहास लोड करता आला नाही.",
  },
};

// G2-E4: their exerciseId -> whether our engine can assess it. Fetched once;
// missing/failed fetch means "assume unsupported" (no Start Now button) --
// D7's "never render an enabled button we can't back up" applies here too,
// not just to the doctor-approval gate.
const CAPABILITIES_URL = "/engine/capabilities";

// G2-G2/G3: same relative-path, no-`api`-param convention as CAPABILITIES_URL
// above -- this page always runs same-origin behind nginx. "me" is history.py's
// alias for "the caller's own patientUserId" (this page only ever has
// localStorage.authToken, never its own ObjectId).
const PAST_SESSIONS_URL = "/engine/patients/me/sessions?limit=10";
// The report link passes api=/engine explicitly so report.html's own fetch
// (which defaults to a bare dev host, ?api=<url>) hits the same nginx-routed
// path this page just used, instead of a hardcoded localhost:8000.
const reportLink = (sessionId) =>
  `/dist/report.html?session_id=${encodeURIComponent(sessionId)}&api=${encodeURIComponent("/engine")}`;

const getInitialLanguage = () => {
  const saved = localStorage.getItem("preferredLanguage") || "en";
  if (["en", "hi", "mr"].includes(saved)) return saved;
  if (saved.toLowerCase().startsWith("hindi")) return "hi";
  if (saved.toLowerCase().startsWith("marathi")) return "mr";
  return "en";
};


// -----------------------------------------------------------------------------
// Exercise translations
// The backend/ML model stores canonical English names. These dictionaries
// translate those values for the patient's selected navbar language.
// -----------------------------------------------------------------------------
const EXERCISE_TRANSLATIONS = {
  hi: {
    "Inversion-eversion exercises": "पैर के टखने को अंदर-बाहर घुमाने के व्यायाम",
    "Shoulder rotations": "कंधे की घुमाव वाली कसरत",
    "Static quadriceps": "क्वाड्रिसेप्स स्थिर व्यायाम",
    "Ankle pumps": "टखने के पंप व्यायाम",
    "Elbow flexion-extension": "कोहनी मोड़ने-सीधा करने का व्यायाम",
    "Hip abduction": "कूल्हे को बाहर की ओर ले जाने का व्यायाम",
    "Diaphragmatic breathing": "डायाफ्रामिक श्वास व्यायाम",
    "Knee": "घुटना",
    "Ankle": "टखना",
    "Elbow": "कोहनी",
    "Shoulder": "कंधा",
    "Hip": "कूल्हा",
    "Wrist": "कलाई",
    "Lumbar Spine": "कमर की रीढ़",
    "General": "सामान्य",
    "Daily": "प्रतिदिन",
    "Once daily": "दिन में एक बार",
    "Twice daily": "दिन में दो बार",
    "3 times per week": "सप्ताह में 3 बार",
    "As advised": "डॉक्टर की सलाह के अनुसार",
    "Personalised rehabilitation exercise.": "व्यक्तिगत पुनर्वास व्यायाम।",
    "Doctor prescribed": "डॉक्टर द्वारा निर्धारित",
  },
  mr: {
    "Inversion-eversion exercises": "घोटा आत-बाहेर फिरवण्याचे व्यायाम",
    "Shoulder rotations": "खांद्याचे फिरवण्याचे व्यायाम",
    "Static quadriceps": "क्वाड्रिसेप्स स्थिर व्यायाम",
    "Ankle pumps": "घोट्याचे पंप व्यायाम",
    "Elbow flexion-extension": "कोपर वाकवणे-सरळ करण्याचा व्यायाम",
    "Hip abduction": "कंबरेचा पाय बाहेर नेण्याचा व्यायाम",
    "Diaphragmatic breathing": "डायाफ्रामिक श्वसन व्यायाम",
    "Knee": "गुडघा",
    "Ankle": "घोटा",
    "Elbow": "कोपर",
    "Shoulder": "खांदा",
    "Hip": "कंबर",
    "Wrist": "मनगट",
    "Lumbar Spine": "कंबरेचा मणका",
    "General": "सामान्य",
    "Daily": "दररोज",
    "Once daily": "दिवसातून एकदा",
    "Twice daily": "दिवसातून दोनदा",
    "3 times per week": "आठवड्यातून 3 वेळा",
    "As advised": "डॉक्टरांच्या सल्ल्यानुसार",
    "Personalised rehabilitation exercise.": "वैयक्तिक पुनर्वसन व्यायाम।",
    "Doctor prescribed": "डॉक्टरांनी निर्धारित केलेले",
  },
};

const translateExerciseValue = (value, language) => {
  if (!value || language === "en") return value;
  return EXERCISE_TRANSLATIONS[language]?.[value] || value;
};

const translateExercisePurpose = (purpose, language) => {
  if (!purpose) {
    return language === "hi"
      ? "व्यक्तिगत पुनर्वास व्यायाम।"
      : language === "mr"
        ? "वैयक्तिक पुनर्वसन व्यायाम।"
        : "Personalised rehabilitation exercise.";
  }

  if (language === "en") return purpose;

  const exact = EXERCISE_TRANSLATIONS[language]?.[purpose];
  if (exact) return exact;

  // Common ML catalogue purpose phrases.
  const phraseMap = language === "hi"
    ? {
        "Improve ankle mobility and stability.": "टखने की गतिशीलता और स्थिरता में सुधार करें।",
        "Improve shoulder mobility.": "कंधे की गतिशीलता में सुधार करें।",
        "Improve knee strength and stability.": "घुटने की ताकत और स्थिरता में सुधार करें।",
        "Improve ankle mobility.": "टखने की गतिशीलता में सुधार करें।",
        "Improve elbow mobility.": "कोहनी की गतिशीलता में सुधार करें।",
        "Improve hip strength and mobility.": "कूल्हे की ताकत और गतिशीलता में सुधार करें।",
        "Improve breathing control and relaxation.": "श्वास नियंत्रण और विश्राम में सुधार करें।",
      }
    : {
        "Improve ankle mobility and stability.": "घोट्याची हालचाल आणि स्थिरता सुधारण्यास मदत करते.",
        "Improve shoulder mobility.": "खांद्याची हालचाल सुधारण्यास मदत करते.",
        "Improve knee strength and stability.": "गुडघ्याची ताकद आणि स्थिरता सुधारण्यास मदत करते.",
        "Improve ankle mobility.": "घोट्याची हालचाल सुधारण्यास मदत करते.",
        "Improve elbow mobility.": "कोपराची हालचाल सुधारण्यास मदत करते.",
        "Improve hip strength and mobility.": "कंबरेची ताकद आणि हालचाल सुधारण्यास मदत करते.",
        "Improve breathing control and relaxation.": "श्वसन नियंत्रण आणि विश्रांती सुधारण्यास मदत करते.",
      };

  return phraseMap[purpose] || purpose;
};

const EXERCISE_YOUTUBE_LINKS = {
  heel_slides: "https://youtu.be/rAMPY8lAbfY?si=gYGBEpyl5Ny8Uh2s",
  mini_squats: "https://youtu.be/LYPJeQUuI3E?si=R8wFvt9pmLKMMHCb",
  seated_knee_extension: "https://youtu.be/VuJZ6dqMf8M?si=dSCt3mwYKvx5iC0W",
  terminal_knee_extension: "https://youtu.be/xdKm8PSX438?si=TolDquZL3hAQDSrK",
  squat: "https://youtu.be/8uoaYwS6iFM?si=2P705qcqVpojAyGB",
  straight_leg_raise: "https://youtu.be/U4L_6JEv9Jg?si=Il_2yCxht-Xt5hv3",
};

const ExercisePlan = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // G2-E4: their exerciseId -> our engine exercise name. {} until it loads,
  // which is also its safe "nothing is supported yet" default.
  const [engineSupported, setEngineSupported] = useState({});
  // G2-G3: "Past sessions" -- history from OUR physiosessions collection,
  // not theirs. Independent loading/error state from the plan itself: a
  // failure here must not blank out the exercise plan above it.
  const [pastSessions, setPastSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  // The NAVBAR is the only language selector.
  // Exercise Plan follows the same preferredLanguage value.
  const [language, setLanguage] = useState(getInitialLanguage);

  const t = T[language] || T.en;

  useEffect(() => {
    const syncLanguage = () => {
      const next = getInitialLanguage();
      setLanguage((current) => (current === next ? current : next));
    };

    // Supports the navbar changing language in the same browser tab.
    const onLanguageChanged = () => syncLanguage();
    window.addEventListener("preferredLanguageChanged", onLanguageChanged);
    window.addEventListener("languageChanged", onLanguageChanged);
    window.addEventListener("focus", syncLanguage);
    document.addEventListener("visibilitychange", syncLanguage);

    // Fallback for navbars that only update localStorage.
    const interval = window.setInterval(syncLanguage, 500);

    return () => {
      window.removeEventListener("preferredLanguageChanged", onLanguageChanged);
      window.removeEventListener("languageChanged", onLanguageChanged);
      window.removeEventListener("focus", syncLanguage);
      document.removeEventListener("visibilitychange", syncLanguage);
      window.clearInterval(interval);
    };
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      let response = await api.get("/exercise-recommendations");
      let recommendations = response.data?.recommendations || [];

      if (recommendations.length === 0) {
        try {
          const generated = await api.post("/exercise-recommendations/generate");
          console.log("[EXERCISE PLAN] Generate response:", generated.data);
          response = await api.get("/exercise-recommendations");
          recommendations = response.data?.recommendations || [];
        } catch (generateError) {
          console.error(
            "[EXERCISE PLAN] Automatic generation failed:",
            generateError.response?.data || generateError.message
          );
        }
      }

      setItems(recommendations);
    } catch (err) {
      console.error("[EXERCISE PLAN] Load error:", err);
      setError(err.response?.data?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // G2-E4: relative fetch (same origin, nginx routes /engine/* to the
    // FastAPI backend, stripping the prefix). Best-effort -- if this fails,
    // engineSupported stays {} and every Start Now button stays absent
    // rather than guessing.
    fetch(CAPABILITIES_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.engineSupported) setEngineSupported(data.engineSupported);
      })
      .catch((err) => console.error("[EXERCISE PLAN] capabilities fetch failed:", err));

    // G2-G3: our history route, authorized via the same Bearer token this
    // whole app already stores at localStorage.authToken (G2-B).
    const token = localStorage.getItem("authToken");
    setSessionsLoading(true);
    fetch(PAST_SESSIONS_URL, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`))))
      .then((data) => setPastSessions(Array.isArray(data?.sessions) ? data.sessions : []))
      .catch((err) => {
        console.error("[EXERCISE PLAN] session history fetch failed:", err);
        setSessionsError("error");
      })
      .finally(() => setSessionsLoading(false));
  }, []);

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
        <div className="exercise-topbar">
          {/* <button className="exercise-back" onClick={() => navigate("/awareness")}>
            {t.back}
          </button> */}
        </div>

        <header className="exercise-hero">
          <div className="exercise-hero-icon">✦</div>
          <div>
            <span className="exercise-eyebrow">{t.eyebrow}</span>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </header>

        <div className="exercise-notice">
          <span>ⓘ</span>
          <div>
            <strong>{t.noticeTitle}</strong>
            <p>{t.notice}</p>
          </div>
        </div>

        {error && <div className="exercise-error">{error}</div>}

        {loading ? (
          <div className="exercise-empty">{t.loading}</div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="exercise-section">
                <div className="exercise-section-head">
                  <div>
                    <span className="exercise-section-label">{t.activeLabel}</span>
                    <h2>{t.activeTitle}</h2>
                  </div>
                  <span className="exercise-count">{active.length}</span>
                </div>
                <div className="exercise-grid">
                  {active.map((item) => (
                    <ExerciseCard key={item._id} item={item} active t={t} engineSupported={engineSupported} />
                  ))}
                </div>
              </section>
            )}

            {pending.length > 0 && (
              <section className="exercise-section">
                <div className="exercise-section-head">
                  <div>
                    <span className="exercise-section-label pending">{t.pendingLabel}</span>
                    <h2>{t.pendingTitle}</h2>
                  </div>
                  <span className="exercise-count pending-count">{pending.length}</span>
                </div>
                <div className="exercise-grid">
                  {pending.map((item) => (
                    <ExerciseCard key={item._id} item={item} t={t} engineSupported={engineSupported} />
                  ))}
                </div>
              </section>
            )}

            {active.length === 0 && pending.length === 0 && (
              <div className="exercise-empty">
                <div className="exercise-empty-icon">♡</div>
                <h3>{t.empty}</h3>
                <p>{t.emptyText}</p>
                <button className="exercise-refresh-btn" onClick={load}>{t.refresh}</button>
              </div>
            )}

            {/* G2-G3: date, exercise, reps, clean rate, link into our report
                page. Coaching-narrative framing only (§8) -- no clinical
                verdict rendered here, just the counts the patient already
                saw live. */}
            <section className="exercise-section">
              <div className="exercise-section-head">
                <div>
                  <span className="exercise-section-label">{t.pastSessionsLabel}</span>
                  <h2>{t.pastSessionsTitle}</h2>
                </div>
                <span className="exercise-count">{pastSessions.length}</span>
              </div>
              {sessionsLoading ? (
                <div className="exercise-empty">{t.loading}</div>
              ) : sessionsError ? (
                <div className="exercise-error">{t.pastSessionsError}</div>
              ) : pastSessions.length === 0 ? (
                <p className="exercise-purpose">{t.noPastSessions}</p>
              ) : (
                <div className="past-sessions-table">
                  <div className="past-sessions-row past-sessions-head">
                    <span>{t.colDate}</span>
                    <span>{t.colExercise}</span>
                    <span>{t.colReps}</span>
                    <span>{t.colCleanRate}</span>
                    <span />
                  </div>
                  {pastSessions.map((s) => {
                    const reps = s.repCount ?? 0;
                    const clean = s.cleanReps ?? 0;
                    const cleanRate = reps > 0 ? `${Math.round((clean / reps) * 100)}%` : "—";
                    const started = s.startedAt ? new Date(s.startedAt).toLocaleDateString() : "—";
                    return (
                      <div className="past-sessions-row" key={s.sessionId}>
                        <span>{started}</span>
                        <span>{s.engineExercise || s.exerciseId || "—"}</span>
                        <span>{reps}</span>
                        <span>{cleanRate}</span>
                        <a href={reportLink(s.sessionId)}>{t.viewReport}</a>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* EMG section commented out — no longer showing dashboard/history links
            <section className="exercise-section">
              <div className="exercise-section-head">
                <div>
                  <span className="exercise-section-label">MUSCLE ACTIVITY</span>
                  <h2>EMG recordings</h2>
                </div>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <a className="exercise-start-btn" href="http://127.0.0.1:5000/progress.html" target="_blank" rel="noopener noreferrer">Open EMG dashboard</a>
                <a className="exercise-start-btn" href="http://127.0.0.1:5000/history.html" target="_blank" rel="noopener noreferrer">Open EMG recordings</a>
              </div>
            </section>
            */}
          </>
        )}
      </div>

      <style>{`
        .exercise-page{min-height:100vh;background:linear-gradient(135deg,#eef3fa,#f8fbff);padding:32px 20px;color:#1d2a47;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .exercise-shell{width:min(1040px,100%);margin:0 auto}
        .exercise-topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:14px}
        .exercise-back{border:0;background:transparent;color:#49698f;font-size:14px;font-weight:700;cursor:pointer;padding:6px 0}
        .exercise-language{display:flex;align-items:center;gap:8px;border:1px solid #dce5f0;background:#fff;border-radius:11px;padding:7px 10px;color:#58708e;font-size:11px;font-weight:700}
        .exercise-language select{border:0;background:transparent;color:#294363;font-weight:700;outline:0;cursor:pointer}
        .exercise-hero{display:flex;align-items:center;gap:18px;background:#fff;border:1px solid #dce5f0;border-radius:20px;padding:26px 28px;box-shadow:0 16px 45px rgba(30,48,95,.08)}
        .exercise-hero-icon{width:54px;height:54px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#24328f,#4a7dfc);color:#fff;font-size:24px}
        .exercise-eyebrow,.exercise-section-label{font-size:10px;letter-spacing:1.3px;font-weight:800;color:#4a7dfc}
        .exercise-hero h1{margin:5px 0 6px;font-size:30px}.exercise-hero p{margin:0;color:#71829a;font-size:14px;line-height:1.55}
        .exercise-notice{margin-top:16px;padding:14px 16px;display:flex;gap:11px;background:#eff8ff;border:1px solid #cfe2f4;border-radius:13px;color:#315d70}.exercise-notice p{margin:3px 0 0;color:#648499;font-size:12px}
        .exercise-error{margin-top:16px;padding:13px 15px;background:#fff2f2;border:1px solid #efcaca;border-radius:11px;color:#a33b3b;font-weight:600}
        .exercise-section{margin-top:25px;background:#fff;border:1px solid #dce5f0;border-radius:18px;padding:22px;box-shadow:0 12px 32px rgba(30,48,95,.06)}
        .exercise-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:17px}.exercise-section-head h2{margin:4px 0 0;font-size:20px}
        .exercise-section-label.pending{color:#b27820}.exercise-count{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#edf3ff;color:#315dd0;font-weight:800}.pending-count{background:#fff5df;color:#9a6719}
        .exercise-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.exercise-card{border:1px solid #e0e7f0;border-radius:15px;padding:18px;background:#fbfcff;transition:.2s}.exercise-card:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(30,48,95,.07)}
        .exercise-card-top{display:flex;justify-content:space-between;gap:10px}.exercise-card h3{margin:0;font-size:17px}.exercise-status{font-size:9px;font-weight:800;padding:5px 8px;border-radius:20px;white-space:nowrap;background:#e8f7ef;color:#278454}.exercise-status.pending{background:#fff5df;color:#9a6719}
        .exercise-purpose{color:#71829a;font-size:12px;line-height:1.5;margin:8px 0 15px}.exercise-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.exercise-meta div{background:#fff;border:1px solid #e5eaf1;border-radius:9px;padding:9px}.exercise-meta span{display:block;color:#8b98aa;font-size:9px;margin-bottom:3px}.exercise-meta strong{font-size:11px;color:#34445f}.exercise-joint{margin-top:12px;color:#49698f;font-size:11px;font-weight:700}.exercise-confidence{margin-top:8px;color:#7b8ba0;font-size:10px}
        .exercise-empty{margin-top:24px;padding:50px 20px;text-align:center;background:#fff;border:1px solid #dce5f0;border-radius:18px;color:#71829a}.exercise-empty-icon{font-size:30px;color:#4a7dfc}.exercise-empty h3{margin:10px 0 5px;color:#263650}.exercise-empty p{margin:0;font-size:13px}.exercise-refresh-btn{margin-top:16px;border:0;border-radius:10px;padding:10px 16px;background:#356fd3;color:#fff;font-weight:700;cursor:pointer}.exercise-refresh-btn:hover{opacity:.92}
        .exercise-start-btn{display:block;text-align:center;margin-top:14px;border:0;border-radius:10px;padding:10px 14px;background:#278454;color:#fff;font-weight:700;font-size:13px;text-decoration:none;cursor:pointer}.exercise-start-btn:hover{opacity:.92}.exercise-start-btn--disabled{background:#eef1f6;color:#8b98aa;cursor:not-allowed}
        .exercise-youtube-btn{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:6px 14px;border-radius:8px;background:#ff0000;color:#fff;font-size:13px;font-weight:600;text-decoration:none;transition:background .15s ease, transform .15s ease}.exercise-youtube-btn:hover{background:#cc0000;transform:translateY(-1px)}
        .past-sessions-table{display:flex;flex-direction:column;gap:2px}.past-sessions-row{display:grid;grid-template-columns:1fr 1.4fr .7fr .8fr .9fr;gap:8px;align-items:center;padding:10px 8px;border-bottom:1px solid #eef1f6;font-size:12px;color:#34445f}.past-sessions-head{color:#8b98aa;font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;border-bottom:2px solid #e5eaf1}.past-sessions-row a{color:#356fd3;font-weight:700;text-decoration:none;justify-self:end}.past-sessions-row a:hover{text-decoration:underline}
        @media(max-width:720px){.exercise-page{padding:20px 12px}.exercise-hero{padding:20px}.exercise-hero h1{font-size:24px}.exercise-grid{grid-template-columns:1fr}.exercise-meta{grid-template-columns:1fr 1fr}}
      `}</style>
    </div>
  );
};

const ExerciseCard = ({ item, active, t, engineSupported }) => {
  const language = Object.keys(T).find((key) => T[key] === t) || "en";

  // E1: breathing cards get no button at all, ever -- not disabled, absent.
  const isBreathing = item.category === "Breathing";
  // E4: only render a button for an exerciseId our engine can actually
  // assess (GET /engine/capabilities). Anything else stays buttonless here
  // rather than linking somewhere that will 404 into "unmapped exercise".
  const engineExercise = engineSupported?.[item.exerciseId];
  const showStartNow = !isBreathing && !!engineExercise;
  // D7, the app's central clinical safety property: a machine-generated
  // exercise never reaches a patient without doctor approval. "Greyed out
  // but present" (item.status !== "ACTIVE") is the maximum concession --
  // never enable this for a non-ACTIVE row.
  const canStart = item.status === "ACTIVE";
  // D12: only exercise + recommendation id in the URL. No token, no patient
  // id -- identity reaches the engine solely via localStorage.authToken,
  // read by ExerciseSelect.jsx on the other end.
  const startHref = `/dist/index.html?exercise=${encodeURIComponent(item.exerciseId)}&rec=${encodeURIComponent(item._id)}`;

  const exerciseName = translateExerciseValue(item.exerciseName, language);
  const purpose = translateExercisePurpose(item.purpose, language);
  const joint = translateExerciseValue(item.joint, language);
  const frequency = translateExerciseValue(item.frequency || "As advised", language);
  const youtubeUrl = EXERCISE_YOUTUBE_LINKS[item.exerciseId] || null;

  return (
    <article className="exercise-card">
      <div className="exercise-card-top">
        <h3>{exerciseName}</h3>
        <span className={`exercise-status ${active ? "" : "pending"}`}>
          {active ? t.approved : t.pending}
        </span>
      </div>

      <p className="exercise-purpose">{purpose}</p>

      <div className="exercise-meta">
        <div><span>{t.sets}</span><strong>{item.sets ?? "—"}</strong></div>
        <div><span>{t.reps}</span><strong>{item.repetitionsOrDuration || "—"}</strong></div>
        <div><span>{t.frequency}</span><strong>{frequency}</strong></div>
      </div>

      {item.joint && (
        <div className="exercise-joint">
          {t.joint}: {joint}
        </div>
      )}

      {item.mlConfidence != null && (
        <div className="exercise-confidence">
          {t.confidence}: {Math.round(Number(item.mlConfidence) * 100)}%
        </div>
      )}

      {item.source === "DOCTOR" && (
        <div className="exercise-confidence">
          {language === "hi"
            ? "डॉक्टर द्वारा निर्धारित"
            : language === "mr"
              ? "डॉक्टरांनी निर्धारित केलेले"
              : "Doctor prescribed"}
        </div>
      )}

      {showStartNow && (
        canStart ? (
          <a className="exercise-start-btn" href={startHref}>
            {t.startNow}
          </a>
        ) : (
          <div className="exercise-start-btn exercise-start-btn--disabled" aria-disabled="true">
            {t.awaitingApproval}
          </div>
        )
      )}

      {youtubeUrl && (
        <a
          className="exercise-youtube-btn"
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Watch ${exerciseName} on YouTube`}
        >
          ▶ YouTube
        </a>
      )}
    </article>
  );
};

export default ExercisePlan;
