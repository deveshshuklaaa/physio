// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../apiClient";

// const jointsList = ["Knee", "Ankle", "Elbow", "Shoulder", "Hip", "Wrist"];

// const ChatbotScreen = () => {
//   const [step, setStep] = useState(0);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const [answers, setAnswers] = useState({
//     q1EmergencySymptoms: [],
//     q2BleedMinorCuts: "",
//     q3DentalSurgeryBleeding: "",
//     q4Bruises: "",
//     q5MuscleSwelling: "",
//     q6JointSwelling: "",
//     q7JointsList: [],
//     q8JointWarmthTightness: "",
//     q9BloodUrineStool: "",
//     q10FamilyHistory: "",
//     q10MaleRelativeFlag: false,
//     q11HeavyMenstrual: "",
//     q12PreviousTesting: "",
//     q12FactorLow: "",
//   });

//   const toggleEmergencySymptom = (symptom) => {
//     setAnswers((prev) => {
//       const exists = prev.q1EmergencySymptoms.includes(symptom);
//       return {
//         ...prev,
//         q1EmergencySymptoms: exists
//           ? prev.q1EmergencySymptoms.filter((s) => s !== symptom)
//           : [...prev.q1EmergencySymptoms, symptom],
//       };
//     });
//   };

//   const toggleJoint = (joint) => {
//     setAnswers((prev) => {
//       const exists = prev.q7JointsList.includes(joint);
//       return {
//         ...prev,
//         q7JointsList: exists
//           ? prev.q7JointsList.filter((j) => j !== joint)
//           : [...prev.q7JointsList, joint],
//       };
//     });
//   };

//   const setField = (field, value) => {
//     setAnswers((prev) => ({ ...prev, [field]: value }));
//   };

//   const isCurrentStepValid = () => {
//     // Step 1: Q2 & Q3 must be answered
//     if (step === 1) {
//       return answers.q2BleedMinorCuts && answers.q3DentalSurgeryBleeding;
//     }
//     // Step 2: Q4 & Q5
//     if (step === 2) {
//       return answers.q4Bruises && answers.q5MuscleSwelling;
//     }
//     // Step 3: Q6 (+ Q8 when applicable)
//     if (step === 3) {
//       if (!answers.q6JointSwelling) return false;
//       if (answers.q6JointSwelling === "Yes" && !answers.q8JointWarmthTightness) {
//         return false;
//       }
//       return true;
//     }
//     // Step 4: Q9 & Q10 & Q10 male flag optional
//     if (step === 4) {
//       return answers.q9BloodUrineStool && answers.q10FamilyHistory;
//     }
//     // Step 5: Q11
//     if (step === 5) {
//       return !!answers.q11HeavyMenstrual;
//     }
//     // Step 6: Q12 (+ Q12 low when applicable)
//     if (step === 6) {
//       if (!answers.q12PreviousTesting) return false;
//       if (answers.q12PreviousTesting === "Yes" && !answers.q12FactorLow) return false;
//       return true;
//     }
//     return true;
//   };

//   const handleNext = async () => {
//     setError("");
//     // Emergency check at step 0
//     if (step === 0 && answers.q1EmergencySymptoms.length > 0) {
//       try {
//         setSaving(true);
//         const res = await api.post("/chatbot/screening", {
//           q1EmergencySymptoms: answers.q1EmergencySymptoms,
//         });
//         navigate(`/screening-result/${res.data.id}`);
//       } catch (err) {
//         setError(
//           err.response?.data?.message ||
//             "Failed to process screening. Please try again."
//         );
//       } finally {
//         setSaving(false);
//       }
//       return;
//     }

//     // For all non-emergency steps, enforce required answers
//     if (step > 0 && step < 7 && !isCurrentStepValid()) {
//       setError("Please answer all questions on this page before continuing.");
//       return;
//     }

//     // Final submission at last step
//     if (step === 6) {
//       try {
//         setSaving(true);
//         const res = await api.post("/chatbot/screening", answers);
//         navigate(`/screening-result/${res.data.id}`);
//       } catch (err) {
//         setError(
//           err.response?.data?.message ||
//             "Failed to process screening. Please try again."
//         );
//       } finally {
//         setSaving(false);
//       }
//       return;
//     }

//     setStep((s) => s + 1);
//   };

//   const handleBack = () => {
//     if (step > 0) setStep((s) => s - 1);
//   };

//   const renderStep = () => {
//     switch (step) {
//       case 0:
//         return (
//           <>
//             <div className="question-title">
//               Are you currently experiencing any of the following?
//             </div>
//             <div className="chip-group">
//               {[
//                 "Head injury with headache, vomiting, confusion",
//                 "Severe bleeding not stopping after 20 minutes",
//                 "Blood in vomit or black stools",
//                 "Severe joint swelling with inability to move limb",
//               ].map((item) => (
//                 <button
//                   key={item}
//                   type="button"
//                   className={`chip ${
//                     answers.q1EmergencySymptoms.includes(item) ? "selected" : ""
//                   }`}
//                   onClick={() => toggleEmergencySymptom(item)}
//                 >
//                   {item}
//                 </button>
//               ))}
//             </div>
//             <p className="disclaimer">
//               If you select any of the above, the app will advise immediate
//               emergency care.
//             </p>
//           </>
//         );
//       case 1:
//         return (
//           <>
//             <div className="question-title">
//               Do you bleed longer than others after minor cuts?
//             </div>
//             <div className="radio-group">
//               {["Never", "Sometimes", "Often"].map((opt) => (
//                 <label key={opt}>
//                   <input
//                     type="radio"
//                     name="q2"
//                     checked={answers.q2BleedMinorCuts === opt}
//                     onChange={() => setField("q2BleedMinorCuts", opt)}
//                   />{" "}
//                   {opt}
//                 </label>
//               ))}
//             </div>
//             <div className="question-title" style={{ marginTop: "1rem" }}>
//               Excess bleeding after dental procedure, surgery, or stitches?
//             </div>
//             <div className="radio-group">
//               {["Yes", "No", "Not sure"].map((opt) => (
//                 <label key={opt}>
//                   <input
//                     type="radio"
//                     name="q3"
//                     checked={answers.q3DentalSurgeryBleeding === opt}
//                     onChange={() => setField("q3DentalSurgeryBleeding", opt)}
//                   />{" "}
//                   {opt}
//                 </label>
//               ))}
//             </div>
//           </>
//         );
//       case 2:
//         return (
//           <>
//             <div className="question-title">Large or deep bruises easily?</div>
//             <div className="radio-group">
//               {["Never", "Sometimes", "Often"].map((opt) => (
//                 <label key={opt}>
//                   <input
//                     type="radio"
//                     name="q4"
//                     checked={answers.q4Bruises === opt}
//                     onChange={() => setField("q4Bruises", opt)}
//                   />{" "}
//                   {opt}
//                 </label>
//               ))}
//             </div>
//             <div className="question-title" style={{ marginTop: "1rem" }}>
//               Deep muscle swelling without major injury?
//             </div>
//             <div className="radio-group">
//               {["Yes", "No"].map((opt) => (
//                 <label key={opt}>
//                   <input
//                     type="radio"
//                     name="q5"
//                     checked={answers.q5MuscleSwelling === opt}
//                     onChange={() => setField("q5MuscleSwelling", opt)}
//                   />{" "}
//                   {opt}
//                 </label>
//               ))}
//             </div>
//           </>
//         );
//       case 3:
//         return (
//           <>
//             <div className="question-title">
//               Repeated joint swelling without significant trauma?
//             </div>
//             <div className="radio-group">
//               {["Yes", "No"].map((opt) => (
//                 <label key={opt}>
//                   <input
//                     type="radio"
//                     name="q6"
//                     checked={answers.q6JointSwelling === opt}
//                     onChange={() => setField("q6JointSwelling", opt)}
//                   />{" "}
//                   {opt}
//                 </label>
//               ))}
//             </div>
//             {answers.q6JointSwelling === "Yes" && (
//               <>
//                 <div className="question-title" style={{ marginTop: "1rem" }}>
//                   Which joints are affected?
//                 </div>
//                 <div className="chip-group">
//                   {jointsList.map((joint) => (
//                     <button
//                       key={joint}
//                       type="button"
//                       className={`chip ${
//                         answers.q7JointsList.includes(joint) ? "selected" : ""
//                       }`}
//                       onClick={() => toggleJoint(joint)}
//                     >
//                       {joint}
//                     </button>
//                   ))}
//                 </div>
//                 <div className="question-title" style={{ marginTop: "1rem" }}>
//                   Warmth, tightness, or reduced movement during episodes?
//                 </div>
//                 <div className="radio-group">
//                   {["Yes", "No"].map((opt) => (
//                     <label key={opt}>
//                       <input
//                         type="radio"
//                         name="q8"
//                         checked={answers.q8JointWarmthTightness === opt}
//                         onChange={() =>
//                           setField("q8JointWarmthTightness", opt)
//                         }
//                       />{" "}
//                       {opt}
//                     </label>
//                   ))}
//                 </div>
//               </>
//             )}
//           </>
//         );
//       case 4:
//         return (
//           <>
//             <div className="question-title">Blood in urine or stool?</div>
//             <div className="radio-group">
//               {["Yes", "No"].map((opt) => (
//                 <label key={opt}>
//                   <input
//                     type="radio"
//                     name="q9"
//                     checked={answers.q9BloodUrineStool === opt}
//                     onChange={() => setField("q9BloodUrineStool", opt)}
//                   />{" "}
//                   {opt}
//                 </label>
//               ))}
//             </div>
//             <div className="question-title" style={{ marginTop: "1rem" }}>
//               Family member with hemophilia or bleeding disorder?
//             </div>
//             <div className="radio-group">
//               {["Yes", "No", "Unknown"].map((opt) => (
//                 <label key={opt}>
//                   <input
//                     type="radio"
//                     name="q10"
//                     checked={answers.q10FamilyHistory === opt}
//                     onChange={() => setField("q10FamilyHistory", opt)}
//                   />{" "}
//                   {opt}
//                 </label>
//               ))}
//             </div>
//             {answers.q10FamilyHistory === "Yes" && (
//               <label style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
//                 <input
//                   type="checkbox"
//                   checked={answers.q10MaleRelativeFlag}
//                   onChange={(e) =>
//                     setField("q10MaleRelativeFlag", e.target.checked)
//                   }
//                 />{" "}
//                 Male relative affected
//               </label>
//             )}
//           </>
//         );
//       case 5:
//         return (
//           <>
//             <div className="question-title">Heavy menstrual bleeding?</div>
//             <div className="radio-group">
//               {["Yes", "No"].map((opt) => (
//                 <label key={opt}>
//                   <input
//                     type="radio"
//                     name="q11"
//                     checked={answers.q11HeavyMenstrual === opt}
//                     onChange={() => setField("q11HeavyMenstrual", opt)}
//                   />{" "}
//                   {opt}
//                 </label>
//               ))}
//             </div>
//             <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
//               If this question is not applicable (e.g., male patient), you can
//               select &quot;No&quot;.
//             </p>
//           </>
//         );
//       case 6:
//         return (
//           <>
//             <div className="question-title">
//               Previous clotting factor testing done?
//             </div>
//             <div className="radio-group">
//               {["Yes", "No"].map((opt) => (
//                 <label key={opt}>
//                   <input
//                     type="radio"
//                     name="q12"
//                     checked={answers.q12PreviousTesting === opt}
//                     onChange={() => setField("q12PreviousTesting", opt)}
//                   />{" "}
//                   {opt}
//                 </label>
//               ))}
//             </div>
//             {answers.q12PreviousTesting === "Yes" && (
//               <>
//                 <div className="question-title" style={{ marginTop: "1rem" }}>
//                   Was Factor VIII or IX reported low?
//                 </div>
//                 <div className="radio-group">
//                   {["Yes", "No"].map((opt) => (
//                     <label key={opt}>
//                       <input
//                         type="radio"
//                         name="q12low"
//                         checked={answers.q12FactorLow === opt}
//                         onChange={() => setField("q12FactorLow", opt)}
//                       />{" "}
//                       {opt}
//                     </label>
//                   ))}
//                 </div>
//               </>
//             )}
//           </>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//   <div className="chatbot-page">
//     <div className="chatbot-glass">

//       <h1 className="chatbot-title">Symptom Self-Assessment</h1>
//       <p className="chatbot-subtitle">
//         Answer a few questions so we can estimate your likelihood of hemophilia
//         and suggest next steps.
//       </p>

//       {/* Progress Bar */}
//       <div className="progress-bar">
//         <div
//           className="progress-fill"
//           style={{ width: `${((step + 1) / 7) * 100}%` }}
//         />
//       </div>

//       {renderStep()}

//       {error && <div className="error-box">{error}</div>}

//       <div className="btn-row">
//         <button
//           type="button"
//           className="secondary"
//           onClick={handleBack}
//           disabled={step === 0}
//         >
//           Back
//         </button>

//         <button
//           type="button"
//           className="primary"
//           onClick={handleNext}
//           disabled={saving}
//         >
//           {step === 6 ? (saving ? "Submitting..." : "Finish") : "Next"}
//         </button>
//       </div>

//       <div className="chatbot-disclaimer">
//         This chatbot provides screening guidance and does not replace medical diagnosis.
//       </div>

//     </div>

//     <style>{`

//       .chatbot-page {
//         min-height: 100vh;
//         width: 100%;
//         padding: 80px 20px;
//         background-image: url("/images/login-bg.png");
//         background-size: cover;
//         background-position: center;
//         display: flex;
//         justify-content: center;
//         align-items: center;
//       }

//       .chatbot-glass {
//         width: 900px;
//         max-width: 95%;
//         padding: 60px;
//         border-radius: 32px;
//         background: rgba(255,255,255,0.15);
//         backdrop-filter: blur(30px);
//         -webkit-backdrop-filter: blur(30px);
//         border: 1px solid rgba(255,255,255,0.3);
//         box-shadow: 0 50px 120px rgba(0,0,0,0.3);
//       }

//       .chatbot-title {
//         font-size: 32px;
//         font-weight: 600;
//         color: black;
//         margin-bottom: 10px;
//       }

//       .chatbot-subtitle {
//         color: black;
//         margin-bottom: 25px;
//       }

//       .progress-bar {
//         width: 100%;
//         height: 6px;
//         background: rgba(255,255,255,0.2);
//         border-radius: 10px;
//         margin-bottom: 30px;
//       }

//       .progress-fill {
//         height: 100%;
//         background: linear-gradient(90deg,#4a7dfc,#5f8dff);
//         border-radius: 10px;
//         transition: width 0.3s ease;
//       }

//       .question-title {
//         font-size: 20px;
//         color: black;
//         margin-bottom: 12px;
//         margin-top: 10px;
//       }

//       .chip-group {
//         display: flex;
//         flex-wrap: wrap;
//         gap: 10px;
//         margin-bottom: 10px;
//       }

//       .chip {
//         padding: 8px 16px;
//         border-radius: 30px;
//         border: 1px solid rgba(255,255,255,0.4);
//         background: rgba(255,255,255,0.2);
//         color: black;
//         font-size: 18px;
//         cursor: pointer;
//         transition: 0.3s ease;
//       }

//       .chip:hover {
//         background: rgba(255,255,255,0.3);
//       }

//       .chip.selected {
//         background: linear-gradient(90deg,#4a7dfc,#5f8dff);
//         border: none;
//         box-shadow: 0 8px 25px rgba(74,125,252,0.5);
//       }

//       .radio-group label {
//         display: block;
//         color: black;
//         font-size: 19px;
//         margin-bottom: 8px;
//         cursor: pointer;
//       }

//       .radio-group input {
//         margin-right: 6px;
//         accent-color: #4a7dfc;
//       }

//       .btn-row {
//         margin-top: 35px;
//         display: flex;
//         justify-content: space-between;
//       }

//       .secondary {
//         padding: 12px 26px;
//         border-radius: 40px;
//         background: rgba(255,255,255,0.2);
//         border: 1px solid rgba(255,255,255,0.4);
//         color: black;
//         height: 48px;
//           font-size: 18px;
//         cursor: pointer;
//       }

//       .primary {
//         padding: 12px 32px;
//         border-radius: 40px;
//         border: none;
//         background: linear-gradient(90deg,#4a7dfc,#5f8dff);
//         color: black;
//         font-weight: 500;
//         cursor: pointer;
//         height: 48px;
//           font-size: 18px;
//         box-shadow: 0 15px 35px rgba(74,125,252,0.4);
//       }

//       .primary:hover {
//         transform: translateY(-2px);
//       }

//       .error-box {
//         margin-top: 15px;
//         color: #ff6b6b;
//       }

//       .chatbot-disclaimer {
//         margin-top: 25px;
//         font-size: 17px;
//         color: black;
//       }

//      /* ================= MOBILE ================= */

// @media (max-width:768px){

// .chatbot-page{
// padding:40px 15px;
// align-items:flex-start;
// }

// .chatbot-glass{
// padding:24px 18px;
// border-radius:20px;
// }

// /* TITLE */

// .chatbot-title{
// font-size:22px;
// }

// .chatbot-subtitle{
// font-size:14px;
// margin-bottom:18px;
// }

// /* PROGRESS BAR */

// .progress-bar{
// height:5px;
// margin-bottom:20px;
// }

// /* QUESTION */

// .question-title{
// font-size:16px;
// margin-bottom:8px;
// }

// /* CHIPS */

// .chip{
// font-size:13px;
// padding:6px 12px;
// }

// /* RADIO OPTIONS */

// .radio-group label{
// font-size:14px;
// margin-bottom:6px;
// }

// /* BUTTONS */

// .btn-row{
// flex-direction:column;
// gap:10px;
// margin-top:25px;
// }

// .primary,
// .secondary{
// width:100%;
// height:42px;
// font-size:14px;
// }

// /* DISCLAIMER */

// .chatbot-disclaimer{
// font-size:12px;
// margin-top:18px;
// }

// /* ERROR */

// .error-box{
// font-size:13px;
// }

// }

//     `}</style>
//   </div>
// );
// };

// export default ChatbotScreen;

