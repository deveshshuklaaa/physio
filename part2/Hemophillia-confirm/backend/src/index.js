// // require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });

// // const express = require("express");
// // 
// // const connectDB = require("../config/db");
// // const doctorAuthRoutes = require("./routes/doctorAuth");
// // const doctorDashboardRoutes = require("./routes/doctorDashboard");
// // const { verifyEmailConnection } = require("./services/emailService");
// // // ===============================
// // // Register Models BEFORE Connection
// // // ===============================

// // require("./models/User");
// // require("./models/PatientProfile");
// // require("./models/HemophiliaDetails");
// // require("./models/Assessment");
// // require("./models/FHIRResource");
// // require("./models/ScreeningSession");


// // // ===============================
// // // Route Imports
// // // ===============================

// // const authRoutes = require("./routes/auth");
// // const profileRoutes = require("./routes/profile");
// // const hemophiliaDetailsRoutes = require("./routes/hemophiliaDetails");
// // const chatbotRoutes = require("./routes/chatbot");
// // const reportRoutes = require("./routes/reports");
// // const fhirRoutes = require("./routes/fhir");
// // const patientResearchRoutes = require("./routes/patientResearch");
// // const adminAuthRoutes = require("./routes/adminAuth");
// // const adminRoutes = require("./routes/admin");
// // const otpAuthRoutes = require("./routes/otpAuth");

// // const doctorRegistrationRoutes = require("./routes/doctorRegistration");
// // const { GoogleGenAI } = require("@google/genai");
// // const adminPatientResearchRoutes = require("./routes/adminPatientResearch");

// // const app = express();

// // // =========================
// // // Middleware
// // // =========================

// // // =========================
// // // Middleware
// // // =========================

// // const allowedOrigins = [
// //   "http://localhost:5173",
// //   "http://10.72.90.1:5173",
// // ];

// // app.use(
// //   cors({
// //     origin: allowedOrigins,
// //     credentials: true,
// //   })
// // );

// // // =====================================================
// // // BODY PARSERS
// // // MUST COME BEFORE ROUTES
// // // =====================================================

// // app.use(express.json());

// // app.use(
// //   express.urlencoded({
// //     extended: true,
// //   })
// // );


// // app.use(
// //   "/api/doctor",
// //   doctorRegistrationRoutes
// // );

// // // =====================================================
// // // ROUTES THAT ARE REGISTERED BEFORE DB STARTUP
// // // =====================================================

// // app.use(
// //   "/api/doctor/patient-research",
// //   patientResearchRoutes
// // );

// // app.use(
// //   "/api/admin/patient-research",
// //   adminPatientResearchRoutes
// // );

// // app.use(
// //   "/api/admin",
// //   adminAuthRoutes
// // );

// // app.use(
// //   "/api/auth",
// //   otpAuthRoutes
// // );
// // // =========================
// // // Health Route
// // // =========================

// // app.get("/api/health", (req, res) => {
// //   res.json({ status: "ok" });
// // });

// // // =========================
// // // Gemini AI
// // // =========================

// // const API_KEY = process.env.API_KEY;

// // const ai = new GoogleGenAI({
// //   apiKey: API_KEY,
// // });

// // // =====================================================
// // // HEMOPHILIA AI CHATBOT
// // // STEP 1 → LLM CLASSIFIER
// // // STEP 2 → LLM ANSWER
// // // =====================================================

// // app.post("/ai", async (req, res) => {
// //   const { message } = req.body;

// //   if (!message || !message.trim()) {
// //     return res.status(400).json({
// //       reply: "Please enter a question.",
// //     });
// //   }

// //   const question = message.trim();

// //   console.log("\n=================================");
// //   console.log("🤖 AI CHATBOT REQUEST");
// //   console.log("Question:", question);
// //   console.log("=================================");

// //   // =====================================================
// //   // MODELS
// //   // =====================================================

// //   const models = [
// //     "gemini-3.5-flash",
// //     "gemini-3.1-flash-lite",
// //     "gemini-2.5-flash-lite",
// //     "gemini-2.5-pro",
// //     "gemini-2.0-flash",
// //   ];

// //   // =====================================================
// //   // STEP 1 — CLASSIFICATION
// //   // =====================================================

// //   const classifierPrompt = `
// // You are a strict query-classification system.

// // Your ONLY task is to determine whether the user's question
// // is relevant to the domain of:

// // - hemophilia
// // - inherited bleeding disorders
// // - bleeding symptoms
// // - clotting factors
// // - coagulation
// // - factor replacement therapy
// // - hemophilia diagnosis
// // - hemophilia screening
// // - hemophilia treatment
// // - hemophilia complications
// // - hemophilia management
// // - hemophilia care
// // - hemophilia patient monitoring
// // - this application's hemophilia assessment, screening,
// //   reports, or care-related functionality

// // You must NOT answer the user's question.

// // You must NOT explain anything.

// // You must NOT provide medical advice.

// // Return EXACTLY ONE of these two values:

// // IN_SCOPE

// // or

// // OUT_OF_SCOPE

// // Important:
// // Classify based on the actual meaning and intent of the question,
// // not merely because the question contains a medical word.

// // For example:
// // - A general question about machine learning is OUT_OF_SCOPE.
// // - A general question about reinforcement learning is OUT_OF_SCOPE.
// // - A question about how machine learning could be used specifically
// //   for hemophilia patient monitoring may be IN_SCOPE.
// // - A question about diabetes treatment is OUT_OF_SCOPE.
// // - A question about hemophilia treatment is IN_SCOPE.
// // - A question about a patient's bleeding symptoms is IN_SCOPE.

// // User question:
// // ${question}
// // `;

// //   let classification = null;
// //   let classifierModel = null;

// //   // =====================================================
// //   // TRY MODELS FOR CLASSIFICATION
// //   // =====================================================

// //   for (const model of models) {
// //     try {
// //       console.log("\n🔎 CLASSIFIER TRYING:", model);

// //       const response = await ai.models.generateContent({
// //         model,
// //         contents: classifierPrompt,
// //       });

// //       const rawText = (response.text || "").trim();

// //       console.log("🔎 CLASSIFIER RAW RESPONSE:", rawText);

// //       const normalized = rawText
// //         .toUpperCase()
// //         .replace(/[`"'.,:;]/g, "")
// //         .trim();

// //       if (normalized.includes("OUT_OF_SCOPE")) {
// //         classification = "OUT_OF_SCOPE";
// //       } else if (normalized.includes("IN_SCOPE")) {
// //         classification = "IN_SCOPE";
// //       }

// //       if (classification) {
// //         classifierModel = model;

// //         console.log(
// //           "✅ CLASSIFICATION:",
// //           classification
// //         );

// //         console.log(
// //           "✅ CLASSIFIER MODEL:",
// //           classifierModel
// //         );

// //         break;
// //       }

// //       console.log(
// //         "⚠️ Invalid classifier response from:",
// //         model
// //       );

// //     } catch (error) {
// //       console.log(
// //         "❌ CLASSIFIER FAILED:",
// //         model
// //       );

// //       console.log(error.message);
// //     }
// //   }

// //   // =====================================================
// //   // CLASSIFIER FAILED
// //   // =====================================================

// //   if (!classification) {
// //     console.log(
// //       "❌ ALL CLASSIFIER MODELS FAILED"
// //     );

// //     return res.status(500).json({
// //       reply:
// //         "I'm currently unable to determine whether your question is related to hemophilia. Please try again.",
// //     });
// //   }

// //   // =====================================================
// //   // STEP 1 RESULT — OUT OF SCOPE
// //   // =====================================================

// //   if (classification === "OUT_OF_SCOPE") {

// //     console.log(
// //       "🚫 QUESTION REJECTED AS OUT OF SCOPE"
// //     );

// //     return res.json({
// //       reply:
// //         "Sorry, I can only help with questions related to hemophilia, inherited bleeding disorders, bleeding symptoms, treatment, screening, and this application's hemophilia-related features.",
// //       classification: "OUT_OF_SCOPE",
// //       classifierModel,
// //     });
// //   }

// //   // =====================================================
// //   // STEP 2 — QUESTION IS IN SCOPE
// //   // NOW ASK ANOTHER LLM TO ANSWER
// //   // =====================================================

// //   const answerPrompt = `
// // You are a medical information assistant specialized in
// // hemophilia and inherited bleeding disorders.

// // The user's question has already been classified as being
// // related to hemophilia or an inherited bleeding disorder.

// // Answer ONLY the user's actual question.

// // Use clear, simple language suitable for patients,
// // caregivers, and healthcare users.

// // Do not answer questions unrelated to hemophilia,
// // inherited bleeding disorders, bleeding symptoms,
// // coagulation, clotting factors, hemophilia treatment,
// // screening, diagnosis, monitoring, or management.

// // Do not invent medical facts.

// // Do not diagnose the patient.

// // Do not prescribe medication or treatment.

// // If the question requires individual medical assessment,
// // clearly recommend consulting a qualified doctor,
// // hematologist, or healthcare professional.

// // Where appropriate, base explanations on established
// // medical guidance and reputable sources such as WFH,
// // WHO, CDC, and peer-reviewed hematology guidance.

// // Keep the response reasonably concise.

// // User question:
// // ${question}
// // `;

// //   // =====================================================
// //   // TRY MODELS FOR FINAL ANSWER
// //   // =====================================================

// //   for (const model of models) {
// //     try {
// //       console.log(
// //         "\n🧠 ANSWER MODEL TRYING:",
// //         model
// //       );

// //       const response = await ai.models.generateContent({
// //         model,
// //         contents: answerPrompt,
// //       });

// //       const answer = (response.text || "").trim();

// //       if (!answer) {
// //         console.log(
// //           "⚠️ Empty answer from:",
// //           model
// //         );
// //         continue;
// //       }

// //       console.log(
// //         "✅ ANSWER GENERATED BY:",
// //         model
// //       );

// //       console.log(
// //         "================================="
// //       );

// //       return res.json({
// //         reply: answer,
// //         classification: "IN_SCOPE",
// //         classifierModel,
// //         answerModel: model,
// //       });

// //     } catch (error) {
// //       console.log(
// //         "❌ ANSWER MODEL FAILED:",
// //         model
// //       );

// //       console.log(error.message);
// //     }
// //   }

// //   // =====================================================
// //   // ALL ANSWER MODELS FAILED
// //   // =====================================================

// //   return res.status(500).json({
// //     reply:
// //       "I'm currently unable to generate an answer. Please try again.",
// //     classification: "IN_SCOPE",
// //     classifierModel,
// //   });
// // });


// // // =========================
// // // Root Route
// // // =========================

// // app.get("/", (req, res) => {
// //   res.send("Backend working ✅");
// // });

// // // =========================
// // // Connect DB & Start Server
// // // =========================

// // app.use("/api/doctor", doctorAuthRoutes);
// // app.use("/api/doctor", doctorDashboardRoutes);
// // app.use(
// //   "/api/admin",
// //   adminRoutes
// // );
// // const PORT = process.env.PORT || 5000;

// // connectDB()
// //   .then(async () => {
// //     await verifyEmailConnection();

// //     // =========================
// //     // Register Routes
// //     // =========================
// //     // =========================
// //     // Register Routes
// //     // =========================

// //     app.use("/api/auth", authRoutes);
// //     app.use("/api/profile", profileRoutes);
// //     app.use(
// //       "/api/hemophilia-details",
// //       hemophiliaDetailsRoutes
// //     );
// //     app.use("/api/chatbot", chatbotRoutes);
// //     app.use("/api/reports", reportRoutes);
// //     app.use(
// //       "/api/assessment",
// //       require("./routes/assessment")
// //     );
// //     app.use("/api/fhir", fhirRoutes);

// //     // =========================
// //     // Start Server
// //     // =========================

// //     app.listen(PORT, "0.0.0.0", () => {
// //       console.log("=================================");
// //       console.log("🚀 Server Started Successfully");
// //       console.log("=================================");
// //       console.log(
// //         `Local   : http://localhost:${PORT}`
// //       );
// //       console.log("=================================");
// //     });
// //   })
// //   .catch((err) => {
// //     console.error(
// //       "❌ Failed to connect to MongoDB"
// //     );
// //     console.error(err);

// //     process.exit(1);
// //   });

// require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });

// const express = require("express");
// const cors = require("cors");

// const connectDB = require("../config/db");

// const doctorAuthRoutes = require("./routes/doctorAuth");
// const doctorDashboardRoutes = require("./routes/doctorDashboard");

// const { verifyEmailConnection } = require("./services/emailService");

// // =====================================================
// // REGISTER MODELS BEFORE CONNECTION
// // =====================================================

// require("./models/User");
// require("./models/PatientProfile");
// require("./models/HemophiliaDetails");
// require("./models/Assessment");
// require("./models/FHIRResource");
// require("./models/ScreeningSession");

// // =====================================================
// // ROUTE IMPORTS
// // =====================================================

// const authRoutes = require("./routes/auth");
// const profileRoutes = require("./routes/profile");
// const hemophiliaDetailsRoutes = require("./routes/hemophiliaDetails");
// const chatbotRoutes = require("./routes/chatbot");
// const reportRoutes = require("./routes/reports");
// const fhirRoutes = require("./routes/fhir");

// const patientResearchRoutes =
//   require("./routes/patientResearch");

// const adminAuthRoutes =
//   require("./routes/adminAuth");

// const adminRoutes =
//   require("./routes/admin");

// const otpAuthRoutes =
//   require("./routes/otpAuth");

// const doctorRegistrationRoutes =
//   require("./routes/doctorRegistration");

// const adminPatientResearchRoutes =
//   require("./routes/adminPatientResearch");

// // =====================================================
// // EXPRESS APP
// // =====================================================

// const app = express();

// // =====================================================
// // CORS
// // =====================================================

// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://10.72.90.1:5173",
// ];

// app.use(
//   cors({
//     origin: allowedOrigins,
//     credentials: true,
//   })
// );

// // =====================================================
// // BODY PARSERS
// // MUST COME BEFORE ROUTES
// // =====================================================

// app.use(express.json());

// app.use(
//   express.urlencoded({
//     extended: true,
//   })
// );

// // =====================================================
// // DOCTOR REGISTRATION
// // =====================================================

// app.use(
//   "/api/doctor",
//   doctorRegistrationRoutes
// );

// // =====================================================
// // DOCTOR PATIENT RESEARCH
// // =====================================================

// app.use(
//   "/api/doctor/patient-research",
//   patientResearchRoutes
// );

// // =====================================================
// // ADMIN PATIENT RESEARCH
// // =====================================================

// app.use(
//   "/api/admin/patient-research",
//   adminPatientResearchRoutes
// );

// // =====================================================
// // ADMIN AUTH
// // =====================================================

// app.use(
//   "/api/admin",
//   adminAuthRoutes
// );

// // =====================================================
// // OTP AUTH
// // =====================================================

// app.use(
//   "/api/auth",
//   otpAuthRoutes
// );

// // =====================================================
// // HEALTH CHECK
// // =====================================================

// app.get(
//   "/api/health",
//   (req, res) => {
//     res.json({
//       status: "ok",
//     });
//   }
// );

// // =====================================================
// // ROOT ROUTE
// // =====================================================

// app.get(
//   "/",
//   (req, res) => {
//     res.send("Backend working ✅");
//   }
// );

// // =====================================================
// // PORT
// // =====================================================

// const PORT =
//   process.env.PORT || 5000;

// // =====================================================
// // CONNECT DATABASE
// // THEN REGISTER ROUTES
// // THEN START SERVER
// // =====================================================

// connectDB()
//   .then(async () => {

//     console.log(
//       "✅ MongoDB connected successfully"
//     );

//     // =================================================
//     // VERIFY EMAIL CONNECTION
//     // =================================================

//     await verifyEmailConnection();

//     // =================================================
//     // AUTH
//     // =================================================

//     app.use(
//       "/api/auth",
//       authRoutes
//     );

//     // =================================================
//     // PROFILE
//     // =================================================

//     app.use(
//       "/api/profile",
//       profileRoutes
//     );

//     // =================================================
//     // HEMOPHILIA DETAILS
//     // =================================================

//     app.use(
//       "/api/hemophilia-details",
//       hemophiliaDetailsRoutes
//     );

//     // =================================================
//     // CHATBOT
//     //
//     // IMPORTANT:
//     // All chatbot/Gemini logic is now inside
//     // routes/chatbot.js
//     //
//     // Frontend endpoint:
//     // POST /api/chatbot/message
//     // =================================================

//     app.use(
//       "/api/chatbot",
//       chatbotRoutes
//     );

//     // =================================================
//     // REPORTS
//     // =================================================

//     app.use(
//       "/api/reports",
//       reportRoutes
//     );

//     // =================================================
//     // ASSESSMENT
//     // =================================================

//     app.use(
//       "/api/assessment",
//       require("./routes/assessment")
//     );

//     // =================================================
//     // FHIR
//     // =================================================

//     app.use(
//       "/api/fhir",
//       fhirRoutes
//     );

//     // =================================================
//     // DOCTOR AUTH
//     // =================================================

//     app.use(
//       "/api/doctor",
//       doctorAuthRoutes
//     );

//     // =================================================
//     // DOCTOR DASHBOARD
//     // =================================================

//     app.use(
//       "/api/doctor",
//       doctorDashboardRoutes
//     );

//     // =================================================
//     // ADMIN
//     // =================================================

//     app.use(
//       "/api/admin",
//       adminRoutes
//     );

//     // =================================================
//     // START SERVER
//     // =================================================

//     app.listen(
//       PORT,
//       "0.0.0.0",
//       () => {

//         console.log(
//           "================================="
//         );

//         console.log(
//           "🚀 Server Started Successfully"
//         );

//         console.log(
//           "================================="
//         );

//         console.log(
//           `Local   : http://localhost:${PORT}`
//         );

//         console.log(
//           `Chatbot : http://localhost:${PORT}/api/chatbot/message`
//         );

//         console.log(
//           "================================="
//         );
//       }
//     );

//   })
//   .catch((err) => {

//     console.error(
//       "❌ Failed to connect to MongoDB"
//     );

//     console.error(err);

//     process.exit(1);
//   });


// require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });

// const express = require("express");
// const cors = require("cors");

// const connectDB = require("../config/db");

// const { verifyEmailConnection } =
//   require("./services/emailService");


// // ============================================================
// // MODELS
// // ============================================================

// require("./models/User");
// require("./models/PatientProfile");
// require("./models/HemophiliaDetails");
// require("./models/Assessment");
// require("./models/FHIRResource");
// require("./models/ScreeningSession");
// require("./models/DoctorChangeRequest");


// // ============================================================
// // ROUTES
// // ============================================================

// const authRoutes =
//   require("./routes/auth");

// const profileRoutes =
//   require("./routes/profile");

// const hemophiliaDetailsRoutes =
//   require("./routes/hemophiliaDetails");

// const chatbotRoutes =
//   require("./routes/chatbot");

// const reportRoutes =
//   require("./routes/reports");

// const fhirRoutes =
//   require("./routes/fhir");

// const patientResearchRoutes =
//   require("./routes/patientResearch");

// const adminAuthRoutes =
//   require("./routes/adminAuth");

// const adminRoutes =
//   require("./routes/admin");

// const otpAuthRoutes =
//   require("./routes/otpAuth");

// const doctorRegistrationRoutes =
//   require("./routes/doctorRegistration");

// const doctorAuthRoutes =
//   require("./routes/doctorAuth");

// const doctorDashboardRoutes =
//   require("./routes/doctorDashboard");

// const adminPatientResearchRoutes =
//   require("./routes/adminPatientResearch");

//   const doctorPatientRoutes =
//   require("./routes/doctorPatients");

//   const exerciseRecommendationRoutes =
//   require("./routes/exerciseRecommendations");


// // ============================================================
// // EXPRESS
// // ============================================================

// const app = express();


// // ============================================================
// // CORS
// // ============================================================

// const allowedOrigins = [

//   "http://localhost:5173",

//   "http://10.72.90.1:5173",

// ];


// app.use(
//   cors({

//     origin: allowedOrigins,

//     credentials: true,

//   })
// );


// // ============================================================
// // BODY PARSERS
// // ============================================================

// app.use(
//   express.json()
// );

// app.use(
//   express.urlencoded({
//     extended: true,
//   })
// );


// // ============================================================
// // HEALTH CHECK
// // ============================================================

// app.get(
//   "/api/health",
//   (req, res) => {

//     res.json({
//       status: "ok",
//     });

//   }
// );


// // ============================================================
// // ROOT
// // ============================================================

// app.get(
//   "/",
//   (req, res) => {

//     res.send(
//       "Hemophilia Care Backend working ✅"
//     );

//   }
// );

// app.use(
//   "/api/exercise-recommendations",
//   exerciseRecommendationRoutes
// );


// // ============================================================
// // PORT
// // ============================================================

// const PORT =
//   process.env.PORT || 5000;


// // ============================================================
// // DATABASE
// // ============================================================

// connectDB()

//   .then(async () => {

//     console.log(
//       "================================="
//     );

//     console.log(
//       "✅ MongoDB Connected"
//     );

//     console.log(
//       "================================="
//     );


//     // ========================================================
//     // EMAIL
//     // ========================================================

//     await verifyEmailConnection();


//     // ========================================================
//     // AUTH
//     // ========================================================

//     app.use(
//       "/api/auth",
//       authRoutes
//     );


//     // ========================================================
//     // OTP AUTH
//     // ========================================================

//     app.use(
//       "/api/auth",
//       otpAuthRoutes
//     );

//     app.use(
//   "/api/doctor",
//   doctorPatientRoutes
// );


//     // ========================================================
//     // PROFILE
//     // ========================================================

//     app.use(
//       "/api/profile",
//       profileRoutes
//     );


//     // ========================================================
//     // HEMOPHILIA DETAILS
//     // ========================================================

//     app.use(
//       "/api/hemophilia-details",
//       hemophiliaDetailsRoutes
//     );


//     // ========================================================
//     // CHATBOT
//     //
//     // POST /api/chatbot/message
//     // POST /api/chatbot/predict
//     // GET  /api/chatbot/health
//     // ========================================================

//     app.use(
//       "/api/chatbot",
//       chatbotRoutes
//     );


//     // ========================================================
//     // REPORTS
//     // ========================================================

//     app.use(
//       "/api/reports",
//       reportRoutes
//     );


//     // ========================================================
//     // ASSESSMENT
//     // ========================================================

//     app.use(
//       "/api/assessment",
//       require("./routes/assessment")
//     );


//     // ========================================================
//     // FHIR
//     // ========================================================

//     app.use(
//       "/api/fhir",
//       fhirRoutes
//     );


//     // ========================================================
//     // DOCTOR REGISTRATION
//     // ========================================================

//     app.use(
//       "/api/doctor",
//       doctorRegistrationRoutes
//     );


//     // ========================================================
//     // DOCTOR AUTH
//     // ========================================================

//     app.use(
//       "/api/doctor",
//       doctorAuthRoutes
//     );


//     // ========================================================
//     // DOCTOR DASHBOARD
//     // ========================================================

//     app.use(
//       "/api/doctor",
//       doctorDashboardRoutes
//     );


//     // ========================================================
//     // DOCTOR PATIENT RESEARCH
//     // ========================================================

//     app.use(
//       "/api/doctor/patient-research",
//       patientResearchRoutes
//     );


//     // ========================================================
//     // ADMIN AUTH
//     // ========================================================

//     app.use(
//       "/api/admin",
//       adminAuthRoutes
//     );


//     // ========================================================
//     // ADMIN
//     // ========================================================

//     app.use(
//       "/api/admin",
//       adminRoutes
//     );


//     // ========================================================
//     // ADMIN PATIENT RESEARCH
//     // ========================================================

//     app.use(
//       "/api/admin/patient-research",
//       adminPatientResearchRoutes
//     );


//     // ========================================================
//     // START SERVER
//     // ========================================================

//     app.listen(
//       PORT,
//       "0.0.0.0",
//       () => {

//         console.log(
//           "================================="
//         );

//         console.log(
//           "🚀 SERVER STARTED"
//         );

//         console.log(
//           "================================="
//         );

//         console.log(
//           `Local: http://localhost:${PORT}`
//         );

//         console.log(
//           `Chatbot: http://localhost:${PORT}/api/chatbot/message`
//         );

//         console.log(
//           `ML: http://localhost:${PORT}/api/chatbot/predict`
//         );

//         console.log(
//           "================================="
//         );

//       }
//     );

//   })

//   .catch(
//     (error) => {

//       console.error(
//         "❌ Failed to connect to MongoDB"
//       );

//       console.error(
//         error
//       );

//       process.exit(1);

//     }
//   );












// // require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });

// // const express = require("express");
// // const cors = require("cors");

// // const connectDB = require("../config/db");
// // const doctorAuthRoutes = require("./routes/doctorAuth");
// // const doctorDashboardRoutes = require("./routes/doctorDashboard");
// // const { verifyEmailConnection } = require("./services/emailService");
// // // ===============================
// // // Register Models BEFORE Connection
// // // ===============================

// // require("./models/User");
// // require("./models/PatientProfile");
// // require("./models/HemophiliaDetails");
// // require("./models/Assessment");
// // require("./models/FHIRResource");
// // require("./models/ScreeningSession");


// // // ===============================
// // // Route Imports
// // // ===============================

// // const authRoutes = require("./routes/auth");
// // const profileRoutes = require("./routes/profile");
// // const hemophiliaDetailsRoutes = require("./routes/hemophiliaDetails");
const exerciseRecommendationRoutes = require("./routes/exerciseRecommendations");
// // const chatbotRoutes = require("./routes/chatbot");
// // const reportRoutes = require("./routes/reports");
// // const fhirRoutes = require("./routes/fhir");
// // const patientResearchRoutes = require("./routes/patientResearch");
// // const adminAuthRoutes = require("./routes/adminAuth");
// // const adminRoutes = require("./routes/admin");
// // const otpAuthRoutes = require("./routes/otpAuth");

// // const doctorRegistrationRoutes = require("./routes/doctorRegistration");
// // const { GoogleGenAI } = require("@google/genai");
// // const adminPatientResearchRoutes = require("./routes/adminPatientResearch");

// // const app = express();

// // // =========================
// // // Middleware
// // // =========================

// // // =========================
// // // Middleware
// // // =========================

// // const allowedOrigins = [
// //   "http://localhost:5173",
// //   "http://10.72.90.1:5173",
// // ];

// // app.use(
// //   cors({
// //     origin: allowedOrigins,
// //     credentials: true,
// //   })
// // );

// // // =====================================================
// // // BODY PARSERS
// // // MUST COME BEFORE ROUTES
// // // =====================================================

// // app.use(express.json());

// // app.use(
// //   express.urlencoded({
// //     extended: true,
// //   })
// // );


// // app.use(
// //   "/api/doctor",
// //   doctorRegistrationRoutes
// // );

// // // =====================================================
// // // ROUTES THAT ARE REGISTERED BEFORE DB STARTUP
// // // =====================================================

// // app.use(
// //   "/api/doctor/patient-research",
// //   patientResearchRoutes
// // );

// // app.use(
// //   "/api/admin/patient-research",
// //   adminPatientResearchRoutes
// // );

// // app.use(
// //   "/api/admin",
// //   adminAuthRoutes
// // );

// // app.use(
// //   "/api/auth",
// //   otpAuthRoutes
// // );
// // // =========================
// // // Health Route
// // // =========================

// // app.get("/api/health", (req, res) => {
// //   res.json({ status: "ok" });
// // });

// // // =========================
// // // Gemini AI
// // // =========================

// // const API_KEY = process.env.API_KEY;

// // const ai = new GoogleGenAI({
// //   apiKey: API_KEY,
// // });

// // // =====================================================
// // // HEMOPHILIA AI CHATBOT
// // // STEP 1 → LLM CLASSIFIER
// // // STEP 2 → LLM ANSWER
// // // =====================================================

// // app.post("/ai", async (req, res) => {
// //   const { message } = req.body;

// //   if (!message || !message.trim()) {
// //     return res.status(400).json({
// //       reply: "Please enter a question.",
// //     });
// //   }

// //   const question = message.trim();

// //   console.log("\n=================================");
// //   console.log("🤖 AI CHATBOT REQUEST");
// //   console.log("Question:", question);
// //   console.log("=================================");

// //   // =====================================================
// //   // MODELS
// //   // =====================================================

// //   const models = [
// //     "gemini-3.5-flash",
// //     "gemini-3.1-flash-lite",
// //     "gemini-2.5-flash-lite",
// //     "gemini-2.5-pro",
// //     "gemini-2.0-flash",
// //   ];

// //   // =====================================================
// //   // STEP 1 — CLASSIFICATION
// //   // =====================================================

// //   const classifierPrompt = `
// // You are a strict query-classification system.

// // Your ONLY task is to determine whether the user's question
// // is relevant to the domain of:

// // - hemophilia
// // - inherited bleeding disorders
// // - bleeding symptoms
// // - clotting factors
// // - coagulation
// // - factor replacement therapy
// // - hemophilia diagnosis
// // - hemophilia screening
// // - hemophilia treatment
// // - hemophilia complications
// // - hemophilia management
// // - hemophilia care
// // - hemophilia patient monitoring
// // - this application's hemophilia assessment, screening,
// //   reports, or care-related functionality

// // You must NOT answer the user's question.

// // You must NOT explain anything.

// // You must NOT provide medical advice.

// // Return EXACTLY ONE of these two values:

// // IN_SCOPE

// // or

// // OUT_OF_SCOPE

// // Important:
// // Classify based on the actual meaning and intent of the question,
// // not merely because the question contains a medical word.

// // For example:
// // - A general question about machine learning is OUT_OF_SCOPE.
// // - A general question about reinforcement learning is OUT_OF_SCOPE.
// // - A question about how machine learning could be used specifically
// //   for hemophilia patient monitoring may be IN_SCOPE.
// // - A question about diabetes treatment is OUT_OF_SCOPE.
// // - A question about hemophilia treatment is IN_SCOPE.
// // - A question about a patient's bleeding symptoms is IN_SCOPE.

// // User question:
// // ${question}
// // `;

// //   let classification = null;
// //   let classifierModel = null;

// //   // =====================================================
// //   // TRY MODELS FOR CLASSIFICATION
// //   // =====================================================

// //   for (const model of models) {
// //     try {
// //       console.log("\n🔎 CLASSIFIER TRYING:", model);

// //       const response = await ai.models.generateContent({
// //         model,
// //         contents: classifierPrompt,
// //       });

// //       const rawText = (response.text || "").trim();

// //       console.log("🔎 CLASSIFIER RAW RESPONSE:", rawText);

// //       const normalized = rawText
// //         .toUpperCase()
// //         .replace(/[`"'.,:;]/g, "")
// //         .trim();

// //       if (normalized.includes("OUT_OF_SCOPE")) {
// //         classification = "OUT_OF_SCOPE";
// //       } else if (normalized.includes("IN_SCOPE")) {
// //         classification = "IN_SCOPE";
// //       }

// //       if (classification) {
// //         classifierModel = model;

// //         console.log(
// //           "✅ CLASSIFICATION:",
// //           classification
// //         );

// //         console.log(
// //           "✅ CLASSIFIER MODEL:",
// //           classifierModel
// //         );

// //         break;
// //       }

// //       console.log(
// //         "⚠️ Invalid classifier response from:",
// //         model
// //       );

// //     } catch (error) {
// //       console.log(
// //         "❌ CLASSIFIER FAILED:",
// //         model
// //       );

// //       console.log(error.message);
// //     }
// //   }

// //   // =====================================================
// //   // CLASSIFIER FAILED
// //   // =====================================================

// //   if (!classification) {
// //     console.log(
// //       "❌ ALL CLASSIFIER MODELS FAILED"
// //     );

// //     return res.status(500).json({
// //       reply:
// //         "I'm currently unable to determine whether your question is related to hemophilia. Please try again.",
// //     });
// //   }

// //   // =====================================================
// //   // STEP 1 RESULT — OUT OF SCOPE
// //   // =====================================================

// //   if (classification === "OUT_OF_SCOPE") {

// //     console.log(
// //       "🚫 QUESTION REJECTED AS OUT OF SCOPE"
// //     );

// //     return res.json({
// //       reply:
// //         "Sorry, I can only help with questions related to hemophilia, inherited bleeding disorders, bleeding symptoms, treatment, screening, and this application's hemophilia-related features.",
// //       classification: "OUT_OF_SCOPE",
// //       classifierModel,
// //     });
// //   }

// //   // =====================================================
// //   // STEP 2 — QUESTION IS IN SCOPE
// //   // NOW ASK ANOTHER LLM TO ANSWER
// //   // =====================================================

// //   const answerPrompt = `
// // You are a medical information assistant specialized in
// // hemophilia and inherited bleeding disorders.

// // The user's question has already been classified as being
// // related to hemophilia or an inherited bleeding disorder.

// // Answer ONLY the user's actual question.

// // Use clear, simple language suitable for patients,
// // caregivers, and healthcare users.

// // Do not answer questions unrelated to hemophilia,
// // inherited bleeding disorders, bleeding symptoms,
// // coagulation, clotting factors, hemophilia treatment,
// // screening, diagnosis, monitoring, or management.

// // Do not invent medical facts.

// // Do not diagnose the patient.

// // Do not prescribe medication or treatment.

// // If the question requires individual medical assessment,
// // clearly recommend consulting a qualified doctor,
// // hematologist, or healthcare professional.

// // Where appropriate, base explanations on established
// // medical guidance and reputable sources such as WFH,
// // WHO, CDC, and peer-reviewed hematology guidance.

// // Keep the response reasonably concise.

// // User question:
// // ${question}
// // `;

// //   // =====================================================
// //   // TRY MODELS FOR FINAL ANSWER
// //   // =====================================================

// //   for (const model of models) {
// //     try {
// //       console.log(
// //         "\n🧠 ANSWER MODEL TRYING:",
// //         model
// //       );

// //       const response = await ai.models.generateContent({
// //         model,
// //         contents: answerPrompt,
// //       });

// //       const answer = (response.text || "").trim();

// //       if (!answer) {
// //         console.log(
// //           "⚠️ Empty answer from:",
// //           model
// //         );
// //         continue;
// //       }

// //       console.log(
// //         "✅ ANSWER GENERATED BY:",
// //         model
// //       );

// //       console.log(
// //         "================================="
// //       );

// //       return res.json({
// //         reply: answer,
// //         classification: "IN_SCOPE",
// //         classifierModel,
// //         answerModel: model,
// //       });

// //     } catch (error) {
// //       console.log(
// //         "❌ ANSWER MODEL FAILED:",
// //         model
// //       );

// //       console.log(error.message);
// //     }
// //   }

// //   // =====================================================
// //   // ALL ANSWER MODELS FAILED
// //   // =====================================================

// //   return res.status(500).json({
// //     reply:
// //       "I'm currently unable to generate an answer. Please try again.",
// //     classification: "IN_SCOPE",
// //     classifierModel,
// //   });
// // });


// // // =========================
// // // Root Route
// // // =========================

// // app.get("/", (req, res) => {
// //   res.send("Backend working ✅");
// // });

// // // =========================
// // // Connect DB & Start Server
// // // =========================

// // app.use("/api/doctor", doctorAuthRoutes);
// // app.use("/api/doctor", doctorDashboardRoutes);
// // app.use(
// //   "/api/admin",
// //   adminRoutes
// // );
// // const PORT = process.env.PORT || 5000;

// // connectDB()
// //   .then(async () => {
// //     await verifyEmailConnection();

// //     // =========================
// //     // Register Routes
// //     // =========================
// //     // =========================
// //     // Register Routes
// //     // =========================

// //     app.use("/api/auth", authRoutes);
// //     app.use("/api/profile", profileRoutes);
// //     app.use(
// //       "/api/hemophilia-details",
// //       hemophiliaDetailsRoutes
// //     );
// //     app.use("/api/chatbot", chatbotRoutes);
// //     app.use("/api/reports", reportRoutes);
// //     app.use(
// //       "/api/assessment",
// //       require("./routes/assessment")
// //     );
// //     app.use("/api/fhir", fhirRoutes);

// //     // =========================
// //     // Start Server
// //     // =========================

// //     app.listen(PORT, "0.0.0.0", () => {
// //       console.log("=================================");
// //       console.log("🚀 Server Started Successfully");
// //       console.log("=================================");
// //       console.log(
// //         `Local   : http://localhost:${PORT}`
// //       );
// //       console.log("=================================");
// //     });
// //   })
// //   .catch((err) => {
// //     console.error(
// //       "❌ Failed to connect to MongoDB"
// //     );
// //     console.error(err);

// //     process.exit(1);
// //   });

// require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });

// const express = require("express");
// const cors = require("cors");

// const connectDB = require("../config/db");

// const doctorAuthRoutes = require("./routes/doctorAuth");
// const doctorDashboardRoutes = require("./routes/doctorDashboard");

// const { verifyEmailConnection } = require("./services/emailService");

// // =====================================================
// // REGISTER MODELS BEFORE CONNECTION
// // =====================================================

// require("./models/User");
// require("./models/PatientProfile");
// require("./models/HemophiliaDetails");
// require("./models/Assessment");
// require("./models/FHIRResource");
// require("./models/ScreeningSession");

// // =====================================================
// // ROUTE IMPORTS
// // =====================================================

// const authRoutes = require("./routes/auth");
// const profileRoutes = require("./routes/profile");
// const hemophiliaDetailsRoutes = require("./routes/hemophiliaDetails");
// const chatbotRoutes = require("./routes/chatbot");
// const reportRoutes = require("./routes/reports");
// const fhirRoutes = require("./routes/fhir");

// const patientResearchRoutes =
//   require("./routes/patientResearch");

// const adminAuthRoutes =
//   require("./routes/adminAuth");

// const adminRoutes =
//   require("./routes/admin");

// const otpAuthRoutes =
//   require("./routes/otpAuth");

// const doctorRegistrationRoutes =
//   require("./routes/doctorRegistration");

// const adminPatientResearchRoutes =
//   require("./routes/adminPatientResearch");

// // =====================================================
// // EXPRESS APP
// // =====================================================

// const app = express();

// // =====================================================
// // CORS
// // =====================================================

// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://10.72.90.1:5173",
// ];

// app.use(
//   cors({
//     origin: allowedOrigins,
//     credentials: true,
//   })
// );

// // =====================================================
// // BODY PARSERS
// // MUST COME BEFORE ROUTES
// // =====================================================

// app.use(express.json());

// app.use(
//   express.urlencoded({
//     extended: true,
//   })
// );

// // =====================================================
// // DOCTOR REGISTRATION
// // =====================================================

// app.use(
//   "/api/doctor",
//   doctorRegistrationRoutes
// );

// // =====================================================
// // DOCTOR PATIENT RESEARCH
// // =====================================================

// app.use(
//   "/api/doctor/patient-research",
//   patientResearchRoutes
// );

// // =====================================================
// // ADMIN PATIENT RESEARCH
// // =====================================================

// app.use(
//   "/api/admin/patient-research",
//   adminPatientResearchRoutes
// );

// // =====================================================
// // ADMIN AUTH
// // =====================================================

// app.use(
//   "/api/admin",
//   adminAuthRoutes
// );

// // =====================================================
// // OTP AUTH
// // =====================================================

// app.use(
//   "/api/auth",
//   otpAuthRoutes
// );

// // =====================================================
// // HEALTH CHECK
// // =====================================================

// app.get(
//   "/api/health",
//   (req, res) => {
//     res.json({
//       status: "ok",
//     });
//   }
// );

// // =====================================================
// // ROOT ROUTE
// // =====================================================

// app.get(
//   "/",
//   (req, res) => {
//     res.send("Backend working ✅");
//   }
// );

// // =====================================================
// // PORT
// // =====================================================

// const PORT =
//   process.env.PORT || 5000;

// // =====================================================
// // CONNECT DATABASE
// // THEN REGISTER ROUTES
// // THEN START SERVER
// // =====================================================

// connectDB()
//   .then(async () => {

//     console.log(
//       "✅ MongoDB connected successfully"
//     );

//     // =================================================
//     // VERIFY EMAIL CONNECTION
//     // =================================================

//     await verifyEmailConnection();

//     // =================================================
//     // AUTH
//     // =================================================

//     app.use(
//       "/api/auth",
//       authRoutes
//     );

//     // =================================================
//     // PROFILE
//     // =================================================

//     app.use(
//       "/api/profile",
//       profileRoutes
//     );

//     // =================================================
//     // HEMOPHILIA DETAILS
//     // =================================================

//     app.use(
//       "/api/hemophilia-details",
//       hemophiliaDetailsRoutes
//     );

//     // =================================================
//     // CHATBOT
//     //
//     // IMPORTANT:
//     // All chatbot/Gemini logic is now inside
//     // routes/chatbot.js
//     //
//     // Frontend endpoint:
//     // POST /api/chatbot/message
//     // =================================================

//     app.use(
//       "/api/chatbot",
//       chatbotRoutes
//     );

//     // =================================================
//     // REPORTS
//     // =================================================

//     app.use(
//       "/api/reports",
//       reportRoutes
//     );

//     // =================================================
//     // ASSESSMENT
//     // =================================================

//     app.use(
//       "/api/assessment",
//       require("./routes/assessment")
//     );

//     // =================================================
//     // FHIR
//     // =================================================

//     app.use(
//       "/api/fhir",
//       fhirRoutes
//     );

//     // =================================================
//     // DOCTOR AUTH
//     // =================================================

//     app.use(
//       "/api/doctor",
//       doctorAuthRoutes
//     );

//     // =================================================
//     // DOCTOR DASHBOARD
//     // =================================================

//     app.use(
//       "/api/doctor",
//       doctorDashboardRoutes
//     );

//     // =================================================
//     // ADMIN
//     // =================================================

//     app.use(
//       "/api/admin",
//       adminRoutes
//     );

//     // =================================================
//     // START SERVER
//     // =================================================

//     app.listen(
//       PORT,
//       "0.0.0.0",
//       () => {

//         console.log(
//           "================================="
//         );

//         console.log(
//           "🚀 Server Started Successfully"
//         );

//         console.log(
//           "================================="
//         );

//         console.log(
//           `Local   : http://localhost:${PORT}`
//         );

//         console.log(
//           `Chatbot : http://localhost:${PORT}/api/chatbot/message`
//         );

//         console.log(
//           "================================="
//         );
//       }
//     );

//   })
//   .catch((err) => {

//     console.error(
//       "❌ Failed to connect to MongoDB"
//     );

//     console.error(err);

//     process.exit(1);
//   });


require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });

const express = require("express");

const connectDB = require("../config/db");

const { verifyEmailConnection } =
  require("./services/emailService");


// ============================================================
// MODELS
// ============================================================

require("./models/User");
require("./models/PatientProfile");
require("./models/HemophiliaDetails");
require("./models/Assessment");
require("./models/FHIRResource");
require("./models/ScreeningSession");
require("./models/DoctorChangeRequest");
require("./models/PasswordResetOTP");
require("./models/AdminProfile");
require("./models/DoctorProfile");


// ============================================================
// ROUTES
// ============================================================

const authRoutes =
  require("./routes/auth");

const profileRoutes =
  require("./routes/profile");

const hemophiliaDetailsRoutes =
  require("./routes/hemophiliaDetails");

const chatbotRoutes =
  require("./routes/chatbot");

const reportRoutes =
  require("./routes/reports");

const fhirRoutes =
  require("./routes/fhir");

const patientResearchRoutes =
  require("./routes/patientResearch");

const adminAuthRoutes =
  require("./routes/adminAuth");

const adminRoutes =
  require("./routes/admin");

const otpAuthRoutes =
  require("./routes/otpAuth");

const doctorRegistrationRoutes =
  require("./routes/doctorRegistration");

const doctorAuthRoutes =
  require("./routes/doctorAuth");

const doctorDashboardRoutes =
  require("./routes/doctorDashboard");

const adminPatientResearchRoutes =
  require("./routes/adminPatientResearch");

  const doctorPatientRoutes =
  require("./routes/doctorPatients");

const passwordResetRoutes =
  require("./routes/passwordReset");


// ============================================================
// EXPRESS
// ============================================================

const app = express();


// ============================================================
// CORS
// ============================================================

// G2-A6: CORS is dead -- nginx puts this API on the same origin as the
// frontend, so no cross-origin request ever reaches it. Allowlist removed
// rather than left stale.


// ============================================================
// BODY PARSERS
// ============================================================

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true,
  })
);


// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      status: "ok",
    });

  }
);


// ============================================================
// ROOT
// ============================================================

app.get(
  "/",
  (req, res) => {

    res.send(
      "Hemophilia Care Backend working ✅"
    );

  }
);


// ============================================================
// PORT
// ============================================================

const PORT =
  process.env.PORT || 5000;


// ============================================================
// DATABASE
// ============================================================

connectDB()

  .then(async () => {

    console.log(
      "================================="
    );

    console.log(
      "✅ MongoDB Connected"
    );

    console.log(
      "================================="
    );


    // ========================================================
    // EMAIL
    // ========================================================

    await verifyEmailConnection();


    // ========================================================
    // AUTH
    // ========================================================

    app.use(
      "/api/auth",
      authRoutes
    );


    // ========================================================
    // OTP AUTH
    // ========================================================

    app.use(
      "/api/auth",
      otpAuthRoutes
    );


    // ========================================================
    // PASSWORD RESET
    // ========================================================

    app.use(
      "/api/password-reset",
      passwordResetRoutes
    );

    app.use(
  "/api/doctor",
  doctorPatientRoutes
);


    // ========================================================
    // PROFILE
    // ========================================================

    app.use(
      "/api/profile",
      profileRoutes
    );


    // ========================================================
    // HEMOPHILIA DETAILS
    // ========================================================

    app.use(
      "/api/hemophilia-details",
      hemophiliaDetailsRoutes
    );

    app.use(
      "/api/exercise-recommendations",
      exerciseRecommendationRoutes
    );


    // ========================================================
    // CHATBOT
    //
    // POST /api/chatbot/message
    // POST /api/chatbot/predict
    // GET  /api/chatbot/health
    // ========================================================

    app.use(
      "/api/chatbot",
      chatbotRoutes
    );


    // ========================================================
    // REPORTS
    // ========================================================

    app.use(
      "/api/reports",
      reportRoutes
    );


    // ========================================================
    // ASSESSMENT
    // ========================================================

    app.use(
      "/api/assessment",
      require("./routes/assessment")
    );


    // ========================================================
    // FHIR
    // ========================================================

    app.use(
      "/api/fhir",
      fhirRoutes
    );


    // ========================================================
    // DOCTOR REGISTRATION
    // ========================================================

    app.use(
      "/api/doctor",
      doctorRegistrationRoutes
    );


    // ========================================================
    // DOCTOR AUTH
    // ========================================================

    app.use(
      "/api/doctor",
      doctorAuthRoutes
    );


    // ========================================================
    // DOCTOR DASHBOARD
    // ========================================================

    app.use(
      "/api/doctor",
      doctorDashboardRoutes
    );


    // ========================================================
    // DOCTOR PATIENT RESEARCH
    // ========================================================

    app.use(
      "/api/doctor/patient-research",
      patientResearchRoutes
    );


    // ========================================================
    // ADMIN AUTH
    // ========================================================

    app.use(
      "/api/admin",
      adminAuthRoutes
    );


    // ========================================================
    // ADMIN
    // ========================================================

    app.use(
      "/api/admin",
      adminRoutes
    );


    // ========================================================
    // ADMIN PATIENT RESEARCH
    // ========================================================

    app.use(
      "/api/admin/patient-research",
      adminPatientResearchRoutes
    );


    // ========================================================
    // START SERVER
    // ========================================================

    app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          "================================="
        );

        console.log(
          "🚀 SERVER STARTED"
        );

        console.log(
          "================================="
        );

        console.log(
          `Local: http://localhost:${PORT}`
        );

        console.log(
          `Chatbot: http://localhost:${PORT}/api/chatbot/message`
        );

        console.log(
          `ML: http://localhost:${PORT}/api/chatbot/predict`
        );

        console.log(
          "================================="
        );

      }
    );

  })

  .catch(
    (error) => {

      console.error(
        "❌ Failed to connect to MongoDB"
      );

      console.error(
        error
      );

      process.exit(1);

    }
  );