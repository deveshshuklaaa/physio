

// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
// import "./Report.css";

// export default function Report() {
//   const navigate = useNavigate();
//   const { t } = useTranslation();

//   // =========================================================
//   // LOAD REPORT + PROFILE
//   // =========================================================

//   let data = {};
//   let profile = {};

//   try {
//     data = JSON.parse(
//       localStorage.getItem("report") || "{}"
//     );
//   } catch (error) {
//     console.error("Unable to read report data:", error);
//     data = {};
//   }

//   try {
//     profile = JSON.parse(
//       localStorage.getItem("profile") || "{}"
//     );
//   } catch (error) {
//     console.error("Unable to read profile data:", error);
//     profile = {};
//   }

//   // =========================================================
//   // SAFE JSON PARSER
//   // =========================================================

//   const parseJSON = (value, fallback = {}) => {
//     if (
//       value === null ||
//       value === undefined ||
//       value === ""
//     ) {
//       return fallback;
//     }

//     if (typeof value === "object") {
//       return value;
//     }

//     try {
//       return JSON.parse(value);
//     } catch {
//       return fallback;
//     }
//   };

//   // =========================================================
//   // ML DATA
//   //
//   // Supports BOTH:
//   //
//   // New:
//   // mlPrediction
//   // mlPredictionLabel
//   // mlPredictionProbability
//   // mlProbabilities
//   // mlFeatures
//   //
//   // Older:
//   // prediction
//   // predictionLabel
//   // predictionProbability
//   // probabilities
//   // features
//   // =========================================================

//   const mlFeatures = parseJSON(
//     data.mlFeatures || data.features,
//     {}
//   );

//   const mlProbabilities = parseJSON(
//     data.mlProbabilities || data.probabilities,
//     {}
//   );

//   // =========================================================
//   // ML PREDICTION NUMBER
//   // =========================================================

//   let predictionNumber = null;

//   if (
//     data.mlPrediction !== undefined &&
//     data.mlPrediction !== null
//   ) {
//     predictionNumber = Number(data.mlPrediction);
//   } else if (
//     data.prediction !== undefined &&
//     data.prediction !== null
//   ) {
//     predictionNumber = Number(data.prediction);
//   }

//   if (
//     Number.isNaN(predictionNumber)
//   ) {
//     predictionNumber = null;
//   }

//   // =========================================================
//   // ML LABEL
//   // =========================================================

//   const predictionLabels = {
//   0: t("report.predictions.healthy"),
//   1: t("report.predictions.mild"),
//   2: t("report.predictions.moderate"),
//   3: t("report.predictions.severe"),
// };

//   const mlLabel =
//     data.mlPredictionLabel ||
//     data.predictionLabel ||
//     (
//       predictionNumber !== null
//         ? predictionLabels[predictionNumber]
//         : null
//     ) ||
//     "N/A";

//   // =========================================================
//   // ML PROBABILITY
//   // =========================================================

//   let probability = null;

//   if (
//     data.mlPredictionProbability !== undefined &&
//     data.mlPredictionProbability !== null
//   ) {
//     probability = Number(
//       data.mlPredictionProbability
//     );
//   } else if (
//     data.predictionProbability !== undefined &&
//     data.predictionProbability !== null
//   ) {
//     probability = Number(
//       data.predictionProbability
//     );
//   }

//   if (
//     probability !== null &&
//     Number.isNaN(probability)
//   ) {
//     probability = null;
//   }

//   /*
//    * Sometimes probability may arrive as 56.63
//    * instead of 0.5663.
//    *
//    * The Python model normally returns 0.5663,
//    * so only convert if it is already percentage-like.
//    */

//   let probabilityPercentage = null;

//   if (probability !== null) {
//     probabilityPercentage =
//       probability <= 1
//         ? probability * 100
//         : probability;
//   }

//   // =========================================================
//   // PROBABILITY BREAKDOWN
//   // =========================================================

//   const getProbability = (classNumber) => {
//     const value =
//       mlProbabilities?.[classNumber] ??
//       mlProbabilities?.[String(classNumber)];

//     if (
//       value === undefined ||
//       value === null
//     ) {
//       return null;
//     }

//     const numericValue = Number(value);

//     if (Number.isNaN(numericValue)) {
//       return null;
//     }

//     const percentage =
//       numericValue <= 1
//         ? numericValue * 100
//         : numericValue;

//     return percentage.toFixed(2);
//   };

//   // =========================================================
//   // FEATURE LABELS
//   // =========================================================

//   const featureLabels = {
//     age: "Age",

//     sex: "Sex",

//     prolonged_bleeding_minor_cut:
//       "Prolonged bleeding after minor cuts",

//     excessive_post_surgery_bleeding:
//       "Excessive bleeding after surgery",

//     excessive_dental_bleeding:
//       "Excessive bleeding after dental procedures",

//     easy_bruising:
//       "Easy bruising",

//     muscle_hematoma:
//       "Muscle swelling / hematoma",

//     recurrent_joint_bleeding:
//       "Recurrent joint bleeding",

//     joint_warmth:
//       "Joint warmth",

//     joint_tightness:
//       "Joint tightness",

//     reduced_joint_mobility:
//       "Reduced joint mobility",

//     hematuria:
//       "Blood in urine",

//     hematochezia:
//       "Blood in stool",

//     family_history_bleeding_disorder:
//       "Family history of bleeding disorder",

//     male_relative_with_hemophilia:
//       "Male relative with hemophilia",

//     previous_factor_test:
//       "Previous factor testing",
//   };

//   // =========================================================
//   // FORMAT FEATURE VALUE
//   // =========================================================

//   const formatFeatureValue = (
//     key,
//     value
//   ) => {
//     // AGE
//     if (key === "age") {
//       return value !== undefined &&
//         value !== null
//         ? `${value} years`
//         : "N/A";
//     }

//     // SEX
//     if (key === "sex") {
//       if (
//         value === 1 ||
//         value === "1" ||
//         value === "male" ||
//         value === "Male"
//       ) {
//         return "Male";
//       }

//       if (
//         value === 0 ||
//         value === "0" ||
//         value === "female" ||
//         value === "Female"
//       ) {
//         return "Female";
//       }

//       return "N/A";
//     }

//     /*
//      * ML MODEL ENCODING
//      *
//      * 0 = No / Never
//      * 1 = Sometimes
//      * 2 = Yes / Often
//      */

//     const ordinalFeatures = [
//       "prolonged_bleeding_minor_cut",
//       "excessive_post_surgery_bleeding",
//       "excessive_dental_bleeding",
//       "easy_bruising",
//       "muscle_hematoma",
//       "recurrent_joint_bleeding",
//       "joint_warmth",
//       "joint_tightness",
//       "reduced_joint_mobility",
//       "hematuria",
//       "hematochezia",
//       "family_history_bleeding_disorder",
//       "male_relative_with_hemophilia",
//       "previous_factor_test",
//     ];

//     if (
//       ordinalFeatures.includes(key)
//     ) {
//       const numericValue = Number(value);

//       if (numericValue === 0) {
//         return "No";
//       }

//       if (numericValue === 1) {
//         return "Sometimes";
//       }

//       if (numericValue === 2) {
//         return "Yes / Often";
//       }

//       return "N/A";
//     }

//     return String(
//       value ?? "N/A"
//     );
//   };

//   // =========================================================
//   // AVAILABLE FEATURES
//   // =========================================================

//   const availableFeatures =
//     Object.entries(
//       mlFeatures || {}
//     ).filter(
//       ([key, value]) =>
//         featureLabels[key] &&
//         value !== undefined &&
//         value !== null
//     );

//   // =========================================================
//   // RESULT CSS CLASS
//   // =========================================================

//   const getResultClass = () => {
//     if (predictionNumber === 0) {
//       return "result-healthy";
//     }

//     if (predictionNumber === 1) {
//       return "result-mild";
//     }

//     if (predictionNumber === 2) {
//       return "result-moderate";
//     }

//     if (predictionNumber === 3) {
//       return "result-severe";
//     }

//     return "";
//   };

//   // =========================================================
//   // EXPLANATION
//   // =========================================================

//   let explanation = [];

//   if (Array.isArray(data.explanation)) {
//     explanation = data.explanation;
//   } else if (
//     typeof data.explanation === "string" &&
//     data.explanation.trim()
//   ) {
//     explanation = [data.explanation];
//   }

//   // =========================================================
//   // IF EXPLANATION IS MISSING BUT ML RESULT EXISTS
//   // =========================================================

//   if (
//     explanation.length === 0 &&
//     mlLabel !== "N/A"
//   ) {
//     explanation = [
//       `Random Forest prediction: ${mlLabel}`,
//     ];
//   }

//   // =========================================================
//   // EMERGENCY FLAG
//   // =========================================================

//   const emergencyFlag =
//     data.emergencyFlag === true ||
//     data.emergencyFlag === "true";

//   // =========================================================
//   // DOWNLOAD PDF
//   // =========================================================

//   const downloadPDF = async () => {
//     const element =
//       document.getElementById(
//         "report-content"
//       );

//     if (!element) {
//       return;
//     }

//     try {
//       const canvas =
//         await html2canvas(element, {
//           scale: 2,
//           backgroundColor: "#ffffff",
//           useCORS: true,
//         });

//       const imgData =
//         canvas.toDataURL("image/png");

//       const pdf = new jsPDF(
//         "p",
//         "mm",
//         "a4"
//       );

//       const pageWidth =
//         pdf.internal.pageSize.getWidth();

//       const pageHeight =
//         pdf.internal.pageSize.getHeight();

//       const margin = 10;

//       const pdfWidth =
//         pageWidth - margin * 2;

//       const pdfHeight =
//         (canvas.height * pdfWidth) /
//         canvas.width;

//       /*
//        * Multi-page PDF
//        */

//       let heightLeft = pdfHeight;

//       let position = margin;

//       pdf.addImage(
//         imgData,
//         "PNG",
//         margin,
//         position,
//         pdfWidth,
//         pdfHeight
//       );

//       heightLeft -=
//         pageHeight - margin * 2;

//       while (heightLeft > 0) {
//         position =
//           heightLeft -
//           pdfHeight +
//           margin;

//         pdf.addPage();

//         pdf.addImage(
//           imgData,
//           "PNG",
//           margin,
//           position,
//           pdfWidth,
//           pdfHeight
//         );

//         heightLeft -=
//           pageHeight - margin * 2;
//       }

//       pdf.save(
//         "Hemophilia_Screening_Report.pdf"
//       );
//     } catch (error) {
//       console.error(
//         "PDF generation error:",
//         error
//       );

//       alert(
//         "Unable to generate the PDF. Please try again."
//       );
//     }
//   };

//   // =========================================================
//   // RENDER
//   // =========================================================

//   return (
//     <div className="report-page">

//       <div className="report-container">

//         {/* =================================================
//             HEADER
//         ================================================= */}

//         <div className="report-header">

//           <div className="report-header-left">

//             <div className="report-icon">
//               +
//             </div>

//             <div>
//               <h1>
//                 Hemophilia Report
//               </h1>

//               <p>
//                 ML Screening Assessment Report
//               </p>
//             </div>

//           </div>

//           <div className="report-status">
//             <span className="status-dot"></span>

//             Assessment Complete
//           </div>

//         </div>


//         {/* =================================================
//             REPORT CONTENT
//         ================================================= */}

//         <div
//           id="report-content"
//           className="report-content"
//         >

//           {/* =================================================
//               TITLE
//           ================================================= */}

//           <div className="report-title-section">

//             <div>

//               <h2>
//                 Screening Assessment
//               </h2>

//               <p>
//                 Summary of your hemophilia
//                 screening assessment
//               </p>

//             </div>

//             <div className="report-badge">
//               ML SCREENING
//             </div>

//           </div>


//           {/* =================================================
//               PATIENT INFORMATION
//           ================================================= */}

//           <section className="report-section">

//             <div className="section-heading">

//               <span className="section-icon">
//                 👤
//               </span>

//               <h3>
//                 Patient Information
//               </h3>

//             </div>


//             <div className="patient-grid">

//               <div className="patient-field">

//                 <span>
//                   Name
//                 </span>

//                 <strong>
//                   {profile.fullName ||
//                     "N/A"}
//                 </strong>

//               </div>


//               <div className="patient-field">

//                 <span>
//                   Patient ID
//                 </span>

//                 <strong>
//                   {profile.patientId ||
//                     "N/A"}
//                 </strong>

//               </div>


//               {mlFeatures.age !==
//                 undefined && (
//                 <div className="patient-field">

//                   <span>
//                     Age
//                   </span>

//                   <strong>
//                     {mlFeatures.age} years
//                   </strong>

//                 </div>
//               )}


//               {mlFeatures.sex !==
//                 undefined && (
//                 <div className="patient-field">

//                   <span>
//                     Sex
//                   </span>

//                   <strong>
//                     {formatFeatureValue(
//                       "sex",
//                       mlFeatures.sex
//                     )}
//                   </strong>

//                 </div>
//               )}

//             </div>

//           </section>


//           {/* =================================================
//               ML SCREENING RESULT
//           ================================================= */}

//           <section className="risk-section">

//             <div className="risk-header">

//               <div>

//                 <span className="small-label">
//                   ML SCREENING RESULT
//                 </span>

//                 <h3>
//                   Hemophilia Screening Prediction
//                 </h3>

//               </div>

//             </div>


//             <div className="risk-result">

//               <div>

//                 <span className="risk-label">
//                   Predicted Category
//                 </span>

//                 <div
//                   className={`risk-value ${getResultClass()}`}
//                 >
//                   {mlLabel}
//                 </div>

//               </div>


//               <div className="score-box">

//                 <span>
//                   Model Probability
//                 </span>

//                 <strong>
//                   {probabilityPercentage !==
//                     null
//                     ? `${probabilityPercentage.toFixed(
//                         2
//                       )}%`
//                     : "N/A"}
//                 </strong>

//               </div>

//             </div>

//           </section>


//           {/* =================================================
//               MODEL PROBABILITY BREAKDOWN
//           ================================================= */}

//           {Object.keys(
//             mlProbabilities || {}
//           ).length > 0 && (

//             <section className="report-section">

//               <div className="section-heading">

//                 <span className="section-icon">
//                   📊
//                 </span>

//                 <h3>
//                   Model Probability Breakdown
//                 </h3>

//               </div>


//               <div className="probability-list">

//                 <div className="probability-item">

//                   <span>
//                     Healthy         :   
//                   </span>

//                   <strong>
                            
//                     {getProbability(0) !==
//                       null
//                       ? `${getProbability(
//                           0
//                         )}%`
//                       : "N/A"}
//                   </strong>

//                 </div>


//                 <div className="probability-item">

//                   <span>
//                     Mild
//                   </span>

//                   <strong>
//                     {getProbability(1) !==
//                       null
//                       ? `${getProbability(
//                           1
//                         )}%`
//                       : "N/A"}
//                   </strong>

//                 </div>


//                 <div className="probability-item">

//                   <span>
//                     Moderate
//                   </span>

//                   <strong>
//                     {getProbability(2) !==
//                       null
//                       ? `${getProbability(
//                           2
//                         )}%`
//                       : "N/A"}
//                   </strong>

//                 </div>


//                 <div className="probability-item">

//                   <span>
//                     Severe
//                   </span>

//                   <strong>
//                     {getProbability(3) !==
//                       null
//                       ? `${getProbability(
//                           3
//                         )}%`
//                       : "N/A"}
//                   </strong>

//                 </div>

//               </div>

//             </section>
//           )}


//           {/* =================================================
//               SCREENING FEATURES
//           ================================================= */}

//           {availableFeatures.length >
//             0 && (

//             <section className="report-section">

//               <div className="section-heading">

//                 <span className="section-icon">
//                   🩺
//                 </span>

//                 <h3>
//                   Screening Information
//                 </h3>

//               </div>


//               <div className="feature-grid">

//                 {availableFeatures.map(
//                   ([key, value]) => (

//                     <div
//                       className="feature-item"
//                       key={key}
//                     >

//                       <span>
//                         {featureLabels[key]}
//                       </span>

//                       <strong>
//                         {formatFeatureValue(
//                           key,
//                           value
//                         )}
//                       </strong>

//                     </div>

//                   )
//                 )}

//               </div>

//             </section>
//           )}


//           {/* =================================================
//               ASSESSMENT EXPLANATION
//           ================================================= */}

//           <section className="report-section">

//             <div className="section-heading">

//               <span className="section-icon">
//                 🔍
//               </span>

//               <h3>
//                 Assessment Explanation
//               </h3>

//             </div>


//             {explanation.length > 0 ? (

//               <div className="explanation-list">

//                 {explanation.map(
//                   (item, index) => (

//                     <div
//                       className="explanation-item"
//                       key={index}
//                     >

//                       <span className="explanation-number">
//                         {index + 1}
//                       </span>

//                       <span>
//                         {item}
//                       </span>

//                     </div>

//                   )
//                 )}

//               </div>

//             ) : (

//               <p className="no-data">
//                 The screening assessment was
//                 completed using the collected
//                 information and machine
//                 learning model.
//               </p>

//             )}

//           </section>


//           {/* =================================================
//               EMERGENCY NOTICE
//           ================================================= */}

//           {emergencyFlag && (

//             <div className="report-emergency">

//               <div className="warning-icon">
//                 !
//               </div>

//               <div>

//                 <strong>
//                   Urgent Medical Attention
//                 </strong>

//                 <p>
//                   One or more emergency bleeding
//                   symptoms were identified during
//                   the screening. Please seek
//                   appropriate medical attention
//                   promptly.
//                 </p>

//               </div>

//             </div>

//           )}


//           {/* =================================================
//               IMPORTANT MEDICAL NOTICE
//           ================================================= */}

//           <div className="report-disclaimer">

//             <div className="warning-icon">
//               !
//             </div>

//             <div>

//               <strong>
//                 Important Medical Notice
//               </strong>

//               <p>
//                 This report is generated from
//                 an AI-assisted screening
//                 assessment and is not a medical
//                 diagnosis. The machine learning
//                 prediction represents a screening
//                 result based on the information
//                 provided during the assessment.
//                 Model probability should not be
//                 interpreted as a clinical
//                 probability or diagnosis. Please
//                 consult a qualified healthcare
//                 professional for proper evaluation,
//                 diagnosis, and treatment.
//               </p>

//             </div>

//           </div>


//           {/* =================================================
//               FOOTER
//           ================================================= */}

//           <div className="report-footer">

//             <span>
//               Hemophilia AI Assistant
//             </span>

//             <span>
//               ML screening guidance only
//             </span>

//           </div>

//         </div>


//         {/* =================================================
//             ACTION BUTTONS
//         ================================================= */}

//         <div className="report-actions">

//           <button
//             className="download-button"
//             onClick={downloadPDF}
//           >
//             📥 Download Report
//           </button>


//           <button
//             className="back-button"
//             onClick={() =>
//               navigate("/chatbot")
//             }
//           >
//             🔙 Back to Chat
//           </button>

//         </div>

//       </div>


//       {/* =================================================
//           OUTSIDE DISCLAIMER
//       ================================================= */}

//       <div className="page-disclaimer">

//         <span className="info-icon">
//           i
//         </span>

//         This assessment provides screening
//         guidance only and does not replace
//         diagnosis or treatment from a qualified
//         medical professional.

//       </div>

//     </div>
//   );
// }


import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Report.css";

export default function Report() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  // =========================================================
  // CURRENT LANGUAGE
  // =========================================================

  const currentLanguage =
    (i18n.language || "en").split("-")[0];

  const language =
    ["en", "hi", "mr"].includes(currentLanguage)
      ? currentLanguage
      : "en";

  // =========================================================
  // REPORT TRANSLATIONS
  // =========================================================

  const TEXT = {
    en: {
      reportTitle: "Hemophilia Report",
      reportSubtitle: "Screening Assessment",

      assessmentComplete: "Assessment Complete",

      screeningAssessment: "Screening Assessment",

      summary:
        "Based on the information you provided during the assessment, your responses were most consistent with the selected screening category.",

      mlScreening: "SCREENING REPORT",

      patientInformation:
        "Patient Details",

      name: "Name",

      patientId: "Patient ID",

      age: "Age",

      years: "years",

      sex: "Sex",

      male: "Male",

      female: "Female",

      mlScreeningResult:
        "ML SCREENING RESULT",

      hemophiliaScreeningPrediction:
        "Your Screening Result",

      predictedCategory:
        "Predicted Category",

      modelProbability:
        "Screening Confidence",

      probabilityBreakdown:
        "Screening Result Details",

      confidenceHelp:
        "This shows how strongly the screening system supports the category based on the answers you provided. It is not the chance that you have hemophilia.",

      factorsTitle:
        "What information was considered?",

      factorsIntro:
        "These are the symptoms and health history you reported during the assessment.",

      factorsNote:
        "This information helps with screening, but it does not confirm hemophilia. A healthcare professional should interpret it together with appropriate medical tests.",

      resultMeaningTitle:
        "What Does This Result Mean?",

      screeningSummary:
        "Screening Summary",

      summaryConfidence:
        "Based on the information you provided during the assessment, your responses were most consistent with",

      summaryWithConfidence:
        "",

      summaryNote:
        "This is a screening result, not a diagnosis. Your healthcare professional can confirm your condition using clinical evaluation and appropriate tests.",

      healthy: "Healthy",

      mild: "Mild",

      moderate: "Moderate",

      severe: "Severe",

      screeningInformation:
        "Screening Information",

      assessmentExplanation:
        "Assessment Explanation",

      randomForestPrediction:
        "Screening result",

      urgentMedicalAttention:
        "Urgent Medical Attention",

      emergencyText:
        "One or more emergency bleeding symptoms were identified during the screening. Please seek appropriate medical attention promptly.",

      contactTitle:
        "Need Help?",
      contactText:
        "If you would like to discuss your screening result or need further physiotherapy or hemophilia care, you can contact the K. J. Somaiya Department of Physiotherapy.",
      contactPhone:
        "+91 22 2409 1796",
      contactEmail:
        "somaiya_physiotherapy@somaiya.edu",
      contactAddress:
        "K. J. Somaiya College of Physiotherapy, Ayurvihar Complex, Eastern Express Highway, Sion, Mumbai – 400022",
      contactHours:
        "Monday–Friday: 9:00 AM – 4:00 PM | Saturday: 9:00 AM – 1:00 PM",

      importantMedicalNotice:
        "Important",

      medicalNoticeText:
        "This screening result is not a medical diagnosis. Please consult a healthcare professional for appropriate evaluation and testing.",

      noExplanation:
        "Your screening result was generated from the information you provided during the assessment.",

      downloadReport:
        "Download Report",

      backToChat:
        "Back to Chat",

      footer:
        "Screening guidance only",

      outsideDisclaimer:
        "This screening result is not a medical diagnosis.",

      no: "No",

      sometimes: "Sometimes",

      yesOften: "Yes / Often",

      notAvailable: "N/A",

      features: {
        prolongedMinorCut:
          "Prolonged bleeding after minor cuts",

        postSurgery:
          "Excessive bleeding after surgery",

        dental:
          "Excessive bleeding after dental procedures",

        easyBruising:
          "Easy bruising",

        muscleHematoma:
          "Muscle swelling / hematoma",

        recurrentJointBleeding:
          "Recurrent joint bleeding",

        jointWarmth:
          "Joint warmth",

        jointTightness:
          "Joint tightness",

        reducedMobility:
          "Reduced joint mobility",

        bloodUrine:
          "Blood in urine",

        bloodStool:
          "Blood in stool",

        familyHistory:
          "Family history of bleeding disorder",

        maleRelative:
          "Male relative with hemophilia",

        previousFactorTest:
          "Previous factor testing",
      },
    },

    // =======================================================
    // HINDI
    // =======================================================

    hi: {
      reportTitle: "हीमोफीलिया रिपोर्ट",

      reportSubtitle:
        "तुमच्या स्क्रीनिंग मूल्यांकनाचा सारांश",

      assessmentComplete:
        "मूल्यांकन पूरा हुआ",

      screeningAssessment:
        "स्क्रीनिंग मूल्यांकन",

      summary:
        "आपके हीमोफीलिया स्क्रीनिंग मूल्यांकन का सारांश",

      mlScreening:
        "एमएल स्क्रीनिंग",

      patientInformation:
        "रोगी की जानकारी",

      name:
        "नाम",

      patientId:
        "रोगी आईडी",

      age:
        "उम्र",

      years:
        "वर्ष",

      sex:
        "लिंग",

      male:
        "पुरुष",

      female:
        "महिला",

      mlScreeningResult:
        "स्क्रीनिंग परिणाम",

      hemophiliaScreeningPrediction:
        "आपका स्क्रीनिंग परिणाम",

      predictedCategory:
        "अनुमानित श्रेणी",

      modelProbability:
        "स्क्रीनिंग विश्वास स्तर",

      probabilityBreakdown:
        "स्क्रीनिंग परिणाम विवरण",

      confidenceHelp:
        "यह बताता है कि आपके उत्तरों के आधार पर स्क्रीनिंग प्रणाली इस श्रेणी का कितना समर्थन करती है। यह हीमोफीलिया होने की संभावना नहीं है।",

      factorsTitle:
        "कौन-सी जानकारी ध्यान में रखी गई?",

      factorsIntro:
        "ये वे लक्षण और स्वास्थ्य संबंधी जानकारी हैं जो आपने मूल्यांकन के दौरान बताई।",

      factorsNote:
        "यह जानकारी केवल स्क्रीनिंग में सहायता करती है और हीमोफीलिया की पुष्टि नहीं करती। स्वास्थ्य विशेषज्ञ उचित चिकित्सीय जांच के साथ इसका मूल्यांकन करेंगे।",

      resultMeaningTitle:
        "आपके परिणाम का क्या अर्थ है?",

      screeningSummary:
        "स्क्रीनिंग सारांश",

      summaryConfidence:
        "मूल्यांकन के दौरान आपके द्वारा दी गई जानकारी के आधार पर, आपके उत्तर सबसे अधिक",

      summaryWithConfidence:
        "स्क्रीनिंग श्रेणी से संगत पाए गए।",

      summaryNote:
        "यह केवल स्क्रीनिंग परिणाम है, निदान नहीं। आपकी स्थिति की पुष्टि चिकित्सकीय जांच और उचित परीक्षणों से की जा सकती है।",

      healthy:
        "स्वस्थ",

      mild:
        "हल्का",

      moderate:
        "मध्यम",

      severe:
        "गंभीर",

      screeningInformation:
        "स्क्रीनिंग जानकारी",

      assessmentExplanation:
        "मूल्यांकन विवरण",

      randomForestPrediction:
        "स्क्रीनिंग परिणाम",

      urgentMedicalAttention:
        "तत्काल चिकित्सा सहायता",

      emergencyText:
        "स्क्रीनिंग के दौरान एक या अधिक आपातकालीन रक्तस्राव संबंधी लक्षण पाए गए। कृपया तुरंत उचित चिकित्सा सहायता लें।",

      contactTitle:
        "मदद चाहिए?",
      contactText:
        "यदि आप अपने स्क्रीनिंग परिणाम के बारे में चर्चा करना चाहते हैं या फिजियोथेरेपी या हीमोफीलिया देखभाल की आवश्यकता है, तो आप K. J. Somaiya Department of Physiotherapy से संपर्क कर सकते हैं।",
      contactPhone:
        "+91 22 2409 1796",
      contactEmail:
        "somaiya_physiotherapy@somaiya.edu",
      contactAddress:
        "K. J. Somaiya College of Physiotherapy, Ayurvihar Complex, Eastern Express Highway, Sion, Mumbai – 400022",
      contactHours:
        "सोमवार–शुक्रवार: सुबह 9:00 – शाम 4:00 | शनिवार: सुबह 9:00 – दोपहर 1:00",

      importantMedicalNotice:
        "महत्वपूर्ण",

      medicalNoticeText:
        "यह रिपोर्ट आपके द्वारा दी गई जानकारी के आधार पर एआई-सहायता प्राप्त स्क्रीनिंग परिणाम प्रदान करती है। यह चिकित्सा निदान नहीं है और हीमोफीलिया की पुष्टि या उसे खारिज नहीं करती। उचित चिकित्सीय मूल्यांकन और जांच के लिए योग्य स्वास्थ्य सेवा पेशेवर से परामर्श करें।",

      noExplanation:
        "आपका स्क्रीनिंग परिणाम मूल्यांकन के दौरान दी गई जानकारी के आधार पर तैयार किया गया है।",

      downloadReport:
        "रिपोर्ट डाउनलोड करें",

      backToChat:
        "चैट पर वापस जाएँ",

      footer:
        "केवल स्क्रीनिंग मार्गदर्शन",

      outsideDisclaimer:
        "यह मूल्यांकन केवल स्क्रीनिंग मार्गदर्शन प्रदान करता है और योग्य चिकित्सा पेशेवर द्वारा निदान या उपचार का विकल्प नहीं है।",

      no:
        "नहीं",

      sometimes:
        "कभी-कभी",

      yesOften:
        "हाँ / अक्सर",

      notAvailable:
        "उपलब्ध नहीं",

      features: {
        prolongedMinorCut:
          "छोटी चोट या कट के बाद लंबे समय तक रक्तस्राव",

        postSurgery:
          "सर्जरी के बाद अत्यधिक रक्तस्राव",

        dental:
          "दंत प्रक्रिया के बाद अत्यधिक रक्तस्राव",

        easyBruising:
          "आसानी से शरीर पर नीले निशान पड़ना",

        muscleHematoma:
          "मांसपेशियों में सूजन / हेमेटोमा",

        recurrentJointBleeding:
          "बार-बार जोड़ों में रक्तस्राव",

        jointWarmth:
          "जोड़ों में गर्माहट",

        jointTightness:
          "जोड़ों में जकड़न",

        reducedMobility:
          "जोड़ों की गति में कमी",

        bloodUrine:
          "पेशाब में रक्त",

        bloodStool:
          "मल में रक्त",

        familyHistory:
          "रक्तस्राव संबंधी विकार का पारिवारिक इतिहास",

        maleRelative:
          "हीमोफीलिया से पीड़ित पुरुष रिश्तेदार",

        previousFactorTest:
          "पहले फैक्टर परीक्षण हुआ है",
      },
    },

    // =======================================================
    // MARATHI
    // =======================================================

    mr: {
      reportTitle:
        "हिमोफिलिया रिपोर्ट",

      reportSubtitle:
        "तुमच्या स्क्रीनिंग मूल्यांकनाचा सारांश",

      assessmentComplete:
        "मूल्यांकन पूर्ण",

      screeningAssessment:
        "स्क्रीनिंग मूल्यांकन",

      summary:
        "तुमच्या हिमोफिलिया स्क्रीनिंग मूल्यांकनाचा सारांश",

      mlScreening:
        "एमएल स्क्रीनिंग",

      patientInformation:
        "रुग्णाची माहिती",

      name:
        "नाव",

      patientId:
        "रुग्ण आयडी",

      age:
        "वय",

      years:
        "वर्षे",

      sex:
        "लिंग",

      male:
        "पुरुष",

      female:
        "स्त्री",

      mlScreeningResult:
        "स्क्रीनिंग निकाल",

      hemophiliaScreeningPrediction:
        "तुमचा स्क्रीनिंग निकाल",

      predictedCategory:
        "अंदाजित श्रेणी",

      modelProbability:
        "स्क्रीनिंग विश्वास पातळी",

      probabilityBreakdown:
        "स्क्रीनिंग निकाल तपशील",

      confidenceHelp:
        "तुमच्या उत्तरांच्या आधारे स्क्रीनिंग प्रणाली या श्रेणीला किती समर्थन देते हे दर्शवते. ही हिमोफिलिया असण्याची शक्यता नाही.",

      factorsTitle:
        "कोणती माहिती विचारात घेतली गेली?",

      factorsIntro:
        "मूल्यांकनादरम्यान तुम्ही सांगितलेली ही लक्षणे आणि आरोग्याशी संबंधित माहिती विचारात घेतली गेली.",

      factorsNote:
        "ही माहिती केवळ स्क्रीनिंगसाठी मदत करते आणि हिमोफिलियाची पुष्टी करत नाही. योग्य वैद्यकीय तपासण्यांसह आरोग्यसेवा तज्ज्ञ याचे मूल्यांकन करतील.",

      resultMeaningTitle:
        "तुमच्या निकालाचा अर्थ काय?",

      screeningSummary:
        "स्क्रीनिंग सारांश",

      summaryConfidence:
        "मूल्यांकनादरम्यान तुम्ही दिलेल्या माहितीच्या आधारे, तुमची उत्तरे",

      summaryWithConfidence:
        "या स्क्रीनिंग श्रेणीशी सर्वाधिक सुसंगत असल्याचे आढळले.",

      summaryNote:
        "हा केवळ स्क्रीनिंग निकाल आहे, निदान नाही. योग्य वैद्यकीय तपासण्या आणि चाचण्यांद्वारे स्थितीची पुष्टी केली जाऊ शकते.",

      healthy:
        "निरोगी",

      mild:
        "सौम्य",

      moderate:
        "मध्यम",

      severe:
        "गंभीर",

      screeningInformation:
        "स्क्रीनिंग माहिती",

      assessmentExplanation:
        "मूल्यांकनाचे स्पष्टीकरण",

      randomForestPrediction:
        "स्क्रीनिंग निकाल",

      urgentMedicalAttention:
        "तातडीची वैद्यकीय मदत",

      emergencyText:
        "स्क्रीनिंगदरम्यान एक किंवा अधिक आपत्कालीन रक्तस्त्रावाची लक्षणे आढळली. कृपया त्वरित योग्य वैद्यकीय मदत घ्या.",

      contactTitle:
        "मदत हवी आहे?",
      contactText:
        "तुमच्या स्क्रीनिंग निकालाबद्दल चर्चा करायची असल्यास किंवा फिजिओथेरपी किंवा हिमोफिलिया काळजीची गरज असल्यास, तुम्ही K. J. Somaiya Department of Physiotherapy शी संपर्क साधू शकता.",
      contactPhone:
        "+91 22 2409 1796",
      contactEmail:
        "somaiya_physiotherapy@somaiya.edu",
      contactAddress:
        "K. J. Somaiya College of Physiotherapy, Ayurvihar Complex, Eastern Express Highway, Sion, Mumbai – 400022",
      contactHours:
        "सोमवार–शुक्रवार: सकाळी 9:00 – संध्याकाळी 4:00 | शनिवार: सकाळी 9:00 – दुपारी 1:00",

      importantMedicalNotice:
        "महत्त्वाचे",

      medicalNoticeText:
        "हा रिपोर्ट तुम्ही दिलेल्या माहितीवर आधारित एआय-सहाय्यित स्क्रीनिंग निकाल देतो. हे वैद्यकीय निदान नाही आणि हिमोफिलियाची पुष्टी किंवा शक्यता नाकारत नाही. योग्य वैद्यकीय मूल्यांकन आणि निदानासाठी पात्र आरोग्यसेवा व्यावसायिकांचा सल्ला घ्या.",

      noExplanation:
        "तुमचा स्क्रीनिंग निकाल मूल्यांकनादरम्यान तुम्ही दिलेल्या माहितीच्या आधारे तयार करण्यात आला आहे.",

      downloadReport:
        "रिपोर्ट डाउनलोड करा",

      backToChat:
        "चॅटकडे परत जा",

      footer:
        "फक्त स्क्रीनिंग मार्गदर्शन",

      outsideDisclaimer:
        "हे मूल्यांकन केवळ स्क्रीनिंग मार्गदर्शन देते आणि पात्र वैद्यकीय व्यावसायिकांकडून होणाऱ्या निदान किंवा उपचारांचा पर्याय नाही.",

      no:
        "नाही",

      sometimes:
        "कधीकधी",

      yesOften:
        "होय / अनेकदा",

      notAvailable:
        "उपलब्ध नाही",

      features: {
        prolongedMinorCut:
          "किरकोळ कटानंतर दीर्घकाळ रक्तस्त्राव",

        postSurgery:
          "शस्त्रक्रियेनंतर जास्त रक्तस्त्राव",

        dental:
          "दातांच्या उपचारानंतर जास्त रक्तस्त्राव",

        easyBruising:
          "सहजपणे निळे डाग पडणे",

        muscleHematoma:
          "स्नायूंमध्ये सूज / हेमॅटोमा",

        recurrentJointBleeding:
          "वारंवार सांध्यांमध्ये रक्तस्त्राव",

        jointWarmth:
          "सांध्यांमध्ये उष्णता",

        jointTightness:
          "सांध्यांमध्ये ताठरपणा",

        reducedMobility:
          "सांध्यांची हालचाल कमी होणे",

        bloodUrine:
          "लघवीमध्ये रक्त",

        bloodStool:
          "शौचामध्ये रक्त",

        familyHistory:
          "रक्तस्त्रावाच्या विकाराचा कौटुंबिक इतिहास",

        maleRelative:
          "हिमोफिलिया असलेला पुरुष नातेवाईक",

        previousFactorTest:
          "पूर्वी फॅक्टर चाचणी झाली आहे",
      },
    },
  };

  const txt =
    TEXT[language] || TEXT.en;

  // =========================================================
  // LOAD REPORT + PROFILE
  // =========================================================

  let data = {};
  let profile = {};

  try {
    data = JSON.parse(
      localStorage.getItem("report") || "{}"
    );
  } catch (error) {
    console.error(
      "Unable to read report data:",
      error
    );

    data = {};
  }

  try {
    profile = JSON.parse(
      localStorage.getItem("profile") || "{}"
    );
  } catch (error) {
    console.error(
      "Unable to read profile data:",
      error
    );

    profile = {};
  }

  // =========================================================
  // SAFE JSON PARSER
  // =========================================================

  const parseJSON = (
    value,
    fallback = {}
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return fallback;
    }

    if (
      typeof value === "object"
    ) {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  // =========================================================
  // ML DATA
  // =========================================================

  const mlFeatures = parseJSON(
    data.mlFeatures ||
      data.features,
    {}
  );

  const mlProbabilities =
    parseJSON(
      data.mlProbabilities ||
        data.probabilities,
      {}
    );

  // =========================================================
  // ML PREDICTION NUMBER
  // =========================================================

  let predictionNumber = null;

  if (
    data.mlPrediction !==
      undefined &&
    data.mlPrediction !== null
  ) {
    predictionNumber =
      Number(data.mlPrediction);
  } else if (
    data.prediction !==
      undefined &&
    data.prediction !== null
  ) {
    predictionNumber =
      Number(data.prediction);
  }

  if (
    Number.isNaN(
      predictionNumber
    )
  ) {
    predictionNumber = null;
  }

  // =========================================================
  // ML LABEL
  // =========================================================

  const predictionLabels = {
    0: txt.healthy,
    1: txt.mild,
    2: txt.moderate,
    3: txt.severe,
  };

  /*
   * IMPORTANT:
   *
   * We use the numeric prediction first for translation.
   *
   * This prevents the English backend value
   * "Severe" from appearing when Hindi/Marathi
   * is selected.
   */

  const mlLabel =
    predictionNumber !== null &&
    predictionLabels[
      predictionNumber
    ]
      ? predictionLabels[
          predictionNumber
        ]
      : data.mlPredictionLabel ||
        data.predictionLabel ||
        txt.notAvailable;

  // =========================================================
  // ML PROBABILITY
  // =========================================================

  let probability = null;

  if (
    data.mlPredictionProbability !==
      undefined &&
    data.mlPredictionProbability !==
      null
  ) {
    probability = Number(
      data.mlPredictionProbability
    );
  } else if (
    data.predictionProbability !==
      undefined &&
    data.predictionProbability !==
      null
  ) {
    probability = Number(
      data.predictionProbability
    );
  }

  if (
    probability !== null &&
    Number.isNaN(probability)
  ) {
    probability = null;
  }

  let probabilityPercentage =
    null;

  if (probability !== null) {
    probabilityPercentage =
      probability <= 1
        ? probability * 100
        : probability;
  }

  // =========================================================
  // PROBABILITY BREAKDOWN
  // =========================================================

  const getProbability = (
    classNumber
  ) => {
    const value =
      mlProbabilities?.[
        classNumber
      ] ??
      mlProbabilities?.[
        String(classNumber)
      ];

    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }

    const numericValue =
      Number(value);

    if (
      Number.isNaN(
        numericValue
      )
    ) {
      return null;
    }

    const percentage =
      numericValue <= 1
        ? numericValue * 100
        : numericValue;

    return percentage.toFixed(2);
  };

  // =========================================================
  // FEATURE LABELS
  // =========================================================

  const featureLabels = {
    age:
      txt.age,

    sex:
      txt.sex,

    prolonged_bleeding_minor_cut:
      txt.features.prolongedMinorCut,

    excessive_post_surgery_bleeding:
      txt.features.postSurgery,

    excessive_dental_bleeding:
      txt.features.dental,

    easy_bruising:
      txt.features.easyBruising,

    muscle_hematoma:
      txt.features.muscleHematoma,

    recurrent_joint_bleeding:
      txt.features.recurrentJointBleeding,

    joint_warmth:
      txt.features.jointWarmth,

    joint_tightness:
      txt.features.jointTightness,

    reduced_joint_mobility:
      txt.features.reducedMobility,

    hematuria:
      txt.features.bloodUrine,

    hematochezia:
      txt.features.bloodStool,

    family_history_bleeding_disorder:
      txt.features.familyHistory,

    male_relative_with_hemophilia:
      txt.features.maleRelative,

    previous_factor_test:
      txt.features.previousFactorTest,
  };

  // =========================================================
  // FORMAT FEATURE VALUE
  // =========================================================

  const formatFeatureValue = (
    key,
    value
  ) => {
    // AGE

    if (key === "age") {
      return value !==
        undefined &&
        value !== null
        ? `${value} ${txt.years}`
        : txt.notAvailable;
    }

    // SEX

    if (key === "sex") {
      if (
        value === 1 ||
        value === "1" ||
        value === "male" ||
        value === "Male"
      ) {
        return txt.male;
      }

      if (
        value === 0 ||
        value === "0" ||
        value === "female" ||
        value === "Female"
      ) {
        return txt.female;
      }

      return txt.notAvailable;
    }

    // =====================================================
    // ML MODEL ENCODING
    //
    // 0 = No / Never
    // 1 = Sometimes
    // 2 = Yes / Often
    // =====================================================

    const ordinalFeatures = [
      "prolonged_bleeding_minor_cut",
      "excessive_post_surgery_bleeding",
      "excessive_dental_bleeding",
      "easy_bruising",
      "muscle_hematoma",
      "recurrent_joint_bleeding",
      "joint_warmth",
      "joint_tightness",
      "reduced_joint_mobility",
      "hematuria",
      "hematochezia",
      "family_history_bleeding_disorder",
      "male_relative_with_hemophilia",
      "previous_factor_test",
    ];

    if (
      ordinalFeatures.includes(key)
    ) {
      const numericValue =
        Number(value);

      if (
        numericValue === 0
      ) {
        return txt.no;
      }

      if (
        numericValue === 1
      ) {
        return txt.sometimes;
      }

      if (
        numericValue === 2
      ) {
        return txt.yesOften;
      }

      return txt.notAvailable;
    }

    return String(
      value ??
        txt.notAvailable
    );
  };

  // =========================================================
  // AVAILABLE FEATURES
  // =========================================================

  const availableFeatures =
    Object.entries(
      mlFeatures || {}
    ).filter(
      ([key, value]) =>
        featureLabels[key] &&
        value !== undefined &&
        value !== null
    );

  // =========================================================
  // RESULT CSS CLASS
  // =========================================================

  const getResultClass = () => {
    if (
      predictionNumber === 0
    ) {
      return "result-healthy";
    }

    if (
      predictionNumber === 1
    ) {
      return "result-mild";
    }

    if (
      predictionNumber === 2
    ) {
      return "result-moderate";
    }

    if (
      predictionNumber === 3
    ) {
      return "result-severe";
    }

    return "";
  };

  // =========================================================
  // EXPLANATION
  // =========================================================

  let explanation = [];

  if (
    Array.isArray(
      data.explanation
    )
  ) {
    explanation =
      data.explanation;
  } else if (
    typeof data.explanation ===
      "string" &&
    data.explanation.trim()
  ) {
    explanation = [
      data.explanation,
    ];
  }

  /*
   * Translate the standard Random Forest
   * explanation according to selected language.
   */

  explanation =
    explanation.map(
      (item) => {
        if (
          typeof item ===
            "string" &&
          item
            .toLowerCase()
            .startsWith(
              "random forest prediction:"
            )
        ) {
          return `${txt.randomForestPrediction}: ${mlLabel}`;
        }

        return item;
      }
    );

  // =========================================================
  // DEFAULT EXPLANATION
  // =========================================================

  if (
    explanation.length === 0 &&
    mlLabel !==
      txt.notAvailable
  ) {
    explanation = [
      `${txt.randomForestPrediction}: ${mlLabel}`,
    ];
  }

  // =========================================================
  // EMERGENCY FLAG
  // =========================================================

  const emergencyFlag =
    data.emergencyFlag ===
      true ||
    data.emergencyFlag ===
      "true";

  // =========================================================
  // PATIENT-FRIENDLY EXPLANATION
  // =========================================================

  const isTechnicalExplanation = (item) => {
    if (typeof item !== "string") {
      return true;
    }

    const text = item
      .toLowerCase()
      .trim();

    return (
      text.startsWith("random forest prediction:") ||
      text.startsWith("ml screening prediction:") ||
      text.startsWith("prediction confidence:") ||
      text.startsWith("model probability:") ||
      text.startsWith("prediction probability:") ||
      text.includes("random forest") ||
      text.includes("machine learning")
    );
  };

  const cleanExplanationItems = (items) =>
    items
      .filter(
        (item) =>
          typeof item === "string"
      )
      .map((item) =>
        item
          .replace(/^[-•✓]\s*/, "")
          .trim()
      )
      .filter(Boolean)
      .filter(
        (item) =>
          !isTechnicalExplanation(item)
    );

  let influenceExplanations =
    cleanExplanationItems(
      explanation
    );

  if (
    influenceExplanations.length === 0 &&
    typeof data.summaryText === "string"
  ) {
    influenceExplanations =
      cleanExplanationItems(
        data.summaryText.split("\n")
      );
  }

  if (
    influenceExplanations.length === 0 &&
    Array.isArray(data.answers)
  ) {
    const answerMap = Object.fromEntries(
      data.answers
        .filter(
          (item) =>
            item &&
            item.question !== undefined
        )
        .map((item) => [
          item.question,
          item.answer,
        ])
    );

    const positiveReasons = [];

    const addReason = (condition, text) => {
      if (condition) {
        positiveReasons.push(text);
      }
    };

    addReason(
      ["sometimes", "often", "yes", "2", 2].includes(
        answerMap.prolonged_bleeding_minor_cut
      ),
      txt.features.prolongedMinorCut
    );

    addReason(
      ["yes", "2", 2].includes(
        answerMap.excessive_post_surgery_bleeding
      ),
      txt.features.postSurgery
    );

    addReason(
      ["yes", "2", 2].includes(
        answerMap.excessive_dental_bleeding
      ),
      txt.features.dental
    );

    addReason(
      ["sometimes", "often", "yes", "2", 2].includes(
        answerMap.easy_bruising
      ),
      txt.features.easyBruising
    );

    addReason(
      ["yes", "2", 2].includes(
        answerMap.muscle_hematoma
      ),
      txt.features.muscleHematoma
    );

    addReason(
      ["yes", "2", 2].includes(
        answerMap.recurrent_joint_bleeding
      ),
      txt.features.recurrentJointBleeding
    );

    addReason(
      ["yes", "2", 2].includes(
        answerMap.joint_warmth
      ),
      txt.features.jointWarmth
    );

    addReason(
      ["yes", "2", 2].includes(
        answerMap.joint_tightness
      ),
      txt.features.jointTightness
    );

    addReason(
      ["yes", "2", 2].includes(
        answerMap.reduced_joint_mobility
      ),
      txt.features.reducedMobility
    );

    addReason(
      ["yes", "2", 2].includes(
        answerMap.hematuria
      ),
      txt.features.bloodUrine
    );

    addReason(
      ["yes", "2", 2].includes(
        answerMap.hematochezia
      ),
      txt.features.bloodStool
    );

    addReason(
      ["yes", "2", 2].includes(
        answerMap.family_history_bleeding_disorder
      ),
      txt.features.familyHistory
    );

    addReason(
      ["yes", "2", 2].includes(
        answerMap.male_relative_with_hemophilia
      ),
      txt.features.maleRelative
    );

    addReason(
      ["yes", "2", 2].includes(
        answerMap.previous_factor_test
      ),
      txt.features.previousFactorTest
    );

    influenceExplanations =
      positiveReasons;
  }

  const displayInfluences =
    influenceExplanations.length > 0
      ? influenceExplanations.slice(0, 6)
      : [
          txt.noExplanation,
        ];

  const resultMeaning = {
    0: "Your answers did not show a strong pattern associated with hemophilia in this screening assessment. This means the overall information you provided was not strongly matched to the hemophilia-related categories used by the screening system. This result does not completely rule out a medical condition.",
    1: "Your answers were most consistent with the Mild screening category. In simple terms, the overall pattern of information you provided was closer to the Mild category used by the screening system. This does not mean that you have mild hemophilia. A healthcare professional must confirm your condition using appropriate medical evaluation and testing.",
    2: "Your answers were most consistent with the Moderate screening category. In simple terms, the overall pattern of information you provided was closer to the Moderate category used by the screening system. This does not mean that you have moderate hemophilia. A healthcare professional must confirm your condition and severity using appropriate medical evaluation and testing.",
    3: "Your answers were most consistent with the Severe screening category. In simple terms, the overall pattern of information you provided was closer to the Severe category used by the screening system. This does not mean that you have severe hemophilia. A healthcare professional must confirm your condition and severity using appropriate medical evaluation and testing.",
  };

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================

  const downloadPDF =
    async () => {
      const element =
        document.getElementById(
          "report-content"
        );

      if (!element) {
        return;
      }

      try {
        const canvas =
          await html2canvas(
            element,
            {
              scale: 2,
              backgroundColor:
                "#ffffff",
              useCORS: true,
            }
          );

        const imgData =
          canvas.toDataURL(
            "image/png"
          );

        const pdf =
          new jsPDF(
            "p",
            "mm",
            "a4"
          );

        const pageWidth =
          pdf.internal.pageSize.getWidth();

        const pageHeight =
          pdf.internal.pageSize.getHeight();

        const margin = 10;

        const pdfWidth =
          pageWidth -
          margin * 2;

        const pdfHeight =
          (canvas.height *
            pdfWidth) /
          canvas.width;

        let heightLeft =
          pdfHeight;

        let position =
          margin;

        pdf.addImage(
          imgData,
          "PNG",
          margin,
          position,
          pdfWidth,
          pdfHeight
        );

        heightLeft -=
          pageHeight -
          margin * 2;

        while (
          heightLeft > 0
        ) {
          position =
            heightLeft -
            pdfHeight +
            margin;

          pdf.addPage();

          pdf.addImage(
            imgData,
            "PNG",
            margin,
            position,
            pdfWidth,
            pdfHeight
          );

          heightLeft -=
            pageHeight -
            margin * 2;
        }

        pdf.save(
          "Hemophilia_Screening_Report.pdf"
        );
      } catch (error) {
        console.error(
          "PDF generation error:",
          error
        );

        alert(
          "Unable to generate the PDF. Please try again."
        );
      }
    };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="report-page">

      <div className="report-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="report-header">

          <div className="report-header-left">

            <div className="report-icon">
              +
            </div>

            <div>

              <h1>
                {txt.reportTitle}
              </h1>

              <p>
                {txt.reportSubtitle}
              </p>

            </div>

          </div>


          <div className="report-status">

            <span className="status-dot"></span>

            {txt.assessmentComplete}

          </div>

        </div>

        <style>{`
          .contact-section {
            margin-top: 8px;
          }

          .contact-section .section-intro {
            margin: 8px 0 16px;
            color: #53657a;
            line-height: 1.6;
          }

          .contact-details {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-top: 10px;
          }

          .contact-action {
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: 68px;
            padding: 12px 16px;
            border: 1px solid #d7e7f4;
            border-radius: 12px;
            background: #f7fbff;
            color: #123f63;
            text-decoration: none;
            transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
          }

          .contact-action:hover {
            transform: translateY(-1px);
            border-color: #1683c4;
            box-shadow: 0 5px 16px rgba(22, 131, 196, .10);
          }

          .contact-action-icon {
            width: 38px;
            height: 38px;
            flex: 0 0 38px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: #e6f5ff;
            color: #0877b8;
            font-size: 17px;
            font-weight: 700;
          }

          .contact-action-content {
            min-width: 0;
          }

          .contact-action-label {
            display: block;
            margin-bottom: 3px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .04em;
            color: #718399;
          }

          .contact-action-value {
            display: block;
            font-size: 14px;
            font-weight: 700;
            color: #0b69a1;
            overflow-wrap: anywhere;
          }

          .contact-address {
            grid-column: 1 / -1;
            align-items: flex-start;
          }

          .contact-address-value {
            display: block;
            font-size: 13px;
            line-height: 1.55;
            font-weight: 600;
            color: #31556f;
            overflow-wrap: anywhere;
          }

          .contact-hours {
            grid-column: 1 / -1;
            padding: 12px 16px;
            border-radius: 10px;
            background: #f1f8fc;
            border: 1px solid #e0edf5;
            color: #4d657b;
            font-size: 13px;
            text-align: center;
          }

          @media (max-width: 700px) {
            .contact-details {
              grid-template-columns: 1fr;
            }

            .contact-hours {
              grid-column: auto;
            }
          }
        `}</style>

        {/* =================================================
            REPORT CONTENT
        ================================================= */}

        <div
          id="report-content"
          className="report-content"
        >

          {/* =================================================
              REPORT TITLE
          ================================================= */}

          <div className="report-title-section">

            <div>

              <h2>
                {txt.screeningAssessment}
              </h2>

              <p>
                {txt.summary}
              </p>

            </div>


            <div className="report-badge">
              {txt.mlScreening}
            </div>

          </div>


          {/* =================================================
              PATIENT INFORMATION
          ================================================= */}

          <section className="report-section">

            <div className="section-heading">

              <span className="section-icon">
                👤
              </span>

              <h3>
                {txt.patientInformation}
              </h3>

            </div>


            <div className="patient-grid">

              <div className="patient-field">

                <span>
                  {txt.name}
                </span>

                <strong>
                  {profile.fullName ||
                    txt.notAvailable}
                </strong>

              </div>


              <div className="patient-field">

                <span>
                  {txt.patientId}
                </span>

                <strong>
                  {profile.patientId ||
                    txt.notAvailable}
                </strong>

              </div>


              {mlFeatures.age !==
                undefined && (

                <div className="patient-field">

                  <span>
                    {txt.age}
                  </span>

                  <strong>
                    {mlFeatures.age}{" "}
                    {txt.years}
                  </strong>

                </div>

              )}


              {mlFeatures.sex !==
                undefined && (

                <div className="patient-field">

                  <span>
                    {txt.sex}
                  </span>

                  <strong>
                    {formatFeatureValue(
                      "sex",
                      mlFeatures.sex
                    )}
                  </strong>

                </div>

              )}

            </div>

          </section>


          {/* =================================================
              ML SCREENING RESULT
          ================================================= */}

          <section className="risk-section">

            <div className="risk-header">

              <div>

                <span className="small-label">
                  {txt.mlScreeningResult}
                </span>

                <h3>
                  {txt.hemophiliaScreeningPrediction}
                </h3>

              </div>

            </div>


            <div className="risk-result">

              <div>

                <span className="risk-label">
                  {txt.predictedCategory}
                </span>

                <div
                  className={`risk-value ${getResultClass()}`}
                >
                  {mlLabel}
                </div>

              </div>


              {/* =================================================
                  MODEL PROBABILITY BOX
              ================================================= */}

              <div className="score-box">

                <span>
                  {txt.modelProbability}
                </span>

                <strong>
                  {probabilityPercentage !==
                    null
                    ? `${probabilityPercentage.toFixed(
                        2
                      )}%`
                    : txt.notAvailable}
                </strong>

              </div>

            </div>

          </section>

          {/* =================================================
              WHAT DOES THIS RESULT MEAN?
          ================================================= */}

          <section className="report-section result-meaning-section">
            <div className="section-heading">
              <span className="section-icon">💡</span>
              <h3>{txt.resultMeaningTitle}</h3>
            </div>

            <div className="result-meaning-card">
              <strong>{mlLabel}</strong>
              <p>
                {resultMeaning[predictionNumber] ||
                  "The screening result is based on the information provided during the assessment."}
              </p>
            </div>
          </section>

          {/* =================================================
              SCREENING SUMMARY
          ================================================= */}

          <section className="report-section">
            <div className="section-heading">
              <span className="section-icon">📋</span>
              <h3>{txt.screeningSummary}</h3>
            </div>

            <div className="summary-card">
              <p>
                {txt.summaryConfidence}{" "}
                <strong>{mlLabel}</strong>{" "}
                {txt.summaryWithConfidence}
              </p>
            </div>
          </section>


          {/* =================================================
              MODEL PROBABILITY BREAKDOWN
          ================================================= */}

          {Object.keys(
            mlProbabilities || {}
          ).length > 0 && (

            <section className="report-section">

              <div className="section-heading">

                <span className="section-icon">
                  📊
                </span>

                <h3>
                  {txt.probabilityBreakdown}
                </h3>

              </div>


              <div className="probability-list">

                {/* HEALTHY */}

                <div className="probability-item">

                  <span>
                    {txt.healthy}
                  </span>

                  <strong>
                    {getProbability(0) !==
                      null
                      ? `${getProbability(
                          0
                        )}%`
                      : txt.notAvailable}
                  </strong>

                </div>


                {/* MILD */}

                <div className="probability-item">

                  <span>
                    {txt.mild}
                  </span>

                  <strong>
                    {getProbability(1) !==
                      null
                      ? `${getProbability(
                          1
                        )}%`
                      : txt.notAvailable}
                  </strong>

                </div>


                {/* MODERATE */}

                <div className="probability-item">

                  <span>
                    {txt.moderate}
                  </span>

                  <strong>
                    {getProbability(2) !==
                      null
                      ? `${getProbability(
                          2
                        )}%`
                      : txt.notAvailable}
                  </strong>

                </div>


                {/* SEVERE */}

                <div className="probability-item">

                  <span>
                    {txt.severe}
                  </span>

                  <strong>
                    {getProbability(3) !==
                      null
                      ? `${getProbability(
                          3
                        )}%`
                      : txt.notAvailable}
                  </strong>

                </div>

              </div>

            </section>

          )}


          {/* =================================================
              SCREENING FEATURES
          ================================================= */}

          {availableFeatures.length >
            0 && (

            <section className="report-section">

              <div className="section-heading">

                <span className="section-icon">
                  🩺
                </span>

                <h3>
                  {txt.screeningInformation}
                </h3>

              </div>


              <div className="feature-grid">

                {availableFeatures.map(
                  ([key, value]) => (

                    <div
                      className="feature-item"
                      key={key}
                    >

                      <span>
                        {featureLabels[key]}
                      </span>

                      <strong>
                        {formatFeatureValue(
                          key,
                          value
                        )}
                      </strong>

                    </div>

                  )
                )}

              </div>

            </section>

          )}


          {/* =================================================
              ASSESSMENT EXPLANATION
          ================================================= */}

          <section className="report-section">

            <div className="section-heading">

              <span className="section-icon">
                🔍
              </span>

              <h3>
                {txt.assessmentExplanation}
              </h3>

            </div>


            {explanation.length > 0 ? (

              <div className="explanation-list">

                {explanation.map(
                  (item, index) => (

                    <div
                      className="explanation-item"
                      key={index}
                    >

                      <span className="explanation-number">
                        {index + 1}
                      </span>

                      <span>
                        {item}
                      </span>

                    </div>

                  )
                )}

              </div>

            ) : (

              <p className="no-data">
                {txt.noExplanation}
              </p>

            )}

          </section>


          {/* =================================================
              EMERGENCY NOTICE
          ================================================= */}

          {emergencyFlag && (

            <div className="report-emergency">

              <div className="warning-icon">
                !
              </div>

              <div>

                <strong>
                  {txt.urgentMedicalAttention}
                </strong>

                <p>
                  {txt.emergencyText}
                </p>

              </div>

            </div>

          )}

          {/* =================================================
              CONTACT / NEXT STEP
          ================================================= */}

          <section className="report-section contact-section">
            <div className="section-heading">
              <span className="section-icon">📞</span>
              <h3>{txt.contactTitle}</h3>
            </div>

            <p className="section-intro">
              {txt.contactText}
            </p>

            <div className="contact-details">
              <a
                href={`tel:${txt.contactPhone.replace(/[^+\d]/g, "")}`}
                className="contact-action"
              >
                <span className="contact-action-icon">☎</span>
                <span className="contact-action-content">
                  <span className="contact-action-label">
                    Phone
                  </span>
                  <span className="contact-action-value">
                    {txt.contactPhone}
                  </span>
                </span>
              </a>

              <a
                href={`mailto:${txt.contactEmail}`}
                className="contact-action"
              >
                <span className="contact-action-icon">✉</span>
                <span className="contact-action-content">
                  <span className="contact-action-label">
                    Email
                  </span>
                  <span className="contact-action-value">
                    {txt.contactEmail}
                  </span>
                </span>
              </a>

              <div className="contact-action contact-address">
                <span className="contact-action-icon">📍</span>
                <span className="contact-action-content">
                  <span className="contact-action-label">
                    Address
                  </span>
                  <span className="contact-address-value">
                    {txt.contactAddress}
                  </span>
                </span>
              </div>

              <div className="contact-hours">
                🕘&nbsp; {txt.contactHours}
              </div>
            </div>
          </section>


          {/* =================================================
              IMPORTANT MEDICAL NOTICE
          ================================================= */}

          <div className="report-disclaimer">

            <div className="warning-icon">
              !
            </div>

            <div>

              <strong>
                {txt.importantMedicalNotice}
              </strong>

              <p>
                {txt.medicalNoticeText}
              </p>

            </div>

          </div>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="report-footer">

            <span>
              Hemophilia AI Assistant
            </span>

            <span>
              {txt.footer}
            </span>

          </div>

        </div>


        {/* =================================================
            ACTION BUTTONS
        ================================================= */}

        <div className="report-actions">

          <button
            className="download-button"
            onClick={downloadPDF}
          >
            📥 {txt.downloadReport}
          </button>


          <button
            className="back-button"
            onClick={() =>
              navigate("/chatbot")
            }
          >
            🔙 {txt.backToChat}
          </button>

        </div>

      </div>


      {/* =================================================
          OUTSIDE DISCLAIMER
      ================================================= */}

      <div className="page-disclaimer">

        <span className="info-icon">
          i
        </span>

        {txt.outsideDisclaimer}

      </div>

    </div>
  );
}