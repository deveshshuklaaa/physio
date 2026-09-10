// const express = require("express");
// const { GoogleGenAI } = require("@google/genai");

// const router = express.Router();

// // =====================================================
// // GEMINI CONFIGURATION
// // =====================================================

// const API_KEY = process.env.API_KEY;

// if (!API_KEY) {
//   console.warn(
//     "⚠️ API_KEY is not configured in .env"
//   );
// }

// const ai = new GoogleGenAI({
//   apiKey: API_KEY,
// });

// // =====================================================
// // MODELS
// // =====================================================

// const models = [
//   "gemini-3.5-flash",
//   "gemini-3.1-flash-lite",
//   "gemini-2.5-flash-lite",
//   "gemini-2.5-pro",
//   "gemini-2.0-flash",
// ];

// // =====================================================
// // LANGUAGE HELPER
// // =====================================================

// function getLanguageName(language) {

//   if (language === "hi") {
//     return "Hindi";
//   }

//   if (language === "mr") {
//     return "Marathi";
//   }

//   return "English";
// }

// // =====================================================
// // MAIN CHATBOT ROUTE
// //
// // POST /api/chatbot/message
// //
// // Body:
// //
// // {
// //   "message": "What is hemophilia?",
// //   "language": "en"
// // }
// //
// // =====================================================

// router.post(
//   "/message",
//   async (req, res) => {

//     try {

//       const {
//         message,
//         language = "en",
//       } = req.body;

//       // =================================================
//       // VALIDATE MESSAGE
//       // =================================================

//       if (
//         !message ||
//         typeof message !== "string" ||
//         !message.trim()
//       ) {

//         return res.status(400).json({
//           success: false,

//           reply:
//             "Please enter a question.",
//         });
//       }

//       const question =
//         message.trim();

//       // =================================================
//       // LANGUAGE
//       // =================================================

//       const selectedLanguage =
//         ["en", "hi", "mr"].includes(language)
//           ? language
//           : "en";

//       const languageName =
//         getLanguageName(
//           selectedLanguage
//         );

//       // =================================================
//       // LOG
//       // =================================================

//       console.log(
//         "\n================================="
//       );

//       console.log(
//         "🤖 HEMOPHILIA CHATBOT REQUEST"
//       );

//       console.log(
//         "Question:",
//         question
//       );

//       console.log(
//         "Language:",
//         languageName
//       );

//       console.log(
//         "================================="
//       );

//       // =================================================
//       // STEP 1
//       // CLASSIFY USER QUESTION
//       // =================================================

//       const classifierPrompt = `
// You are a strict query-classification system.

// Your ONLY task is to determine whether the user's question
// is relevant to the domain of:

// - hemophilia
// - inherited bleeding disorders
// - bleeding symptoms
// - clotting factors
// - coagulation
// - factor replacement therapy
// - hemophilia diagnosis
// - hemophilia screening
// - hemophilia treatment
// - hemophilia complications
// - hemophilia management
// - hemophilia care
// - hemophilia patient monitoring
// - this application's hemophilia assessment
// - this application's screening
// - this application's reports
// - this application's care-related functionality

// The user may ask the question in:
// - English
// - Hindi
// - Marathi

// You must understand the meaning of the question
// regardless of the language used.

// You must NOT answer the question.

// You must NOT explain anything.

// You must NOT provide medical advice.

// Return EXACTLY ONE of these values:

// IN_SCOPE

// or

// OUT_OF_SCOPE

// Important:

// Classify based on the actual meaning and intent of
// the question, not merely because the question contains
// a medical word.

// Examples:

// - A general question about machine learning
//   is OUT_OF_SCOPE.

// - A general question about reinforcement learning
//   is OUT_OF_SCOPE.

// - A question about how machine learning could be used
//   specifically for hemophilia patient monitoring
//   is IN_SCOPE.

// - A question about diabetes treatment
//   is OUT_OF_SCOPE.

// - A question about hemophilia treatment
//   is IN_SCOPE.

// - A question about hemophilia symptoms
//   is IN_SCOPE.

// - A question about bleeding after an injury in a person
//   with suspected hemophilia is IN_SCOPE.

// User question:

// ${question}
// `;

//       // =================================================
//       // CLASSIFICATION VARIABLES
//       // =================================================

//       let classification = null;

//       let classifierModel = null;

//       // =================================================
//       // TRY CLASSIFIER MODELS
//       // =================================================

//       for (
//         const model of models
//       ) {

//         try {

//           console.log(
//             "\n🔎 CLASSIFIER TRYING:",
//             model
//           );

//           const response =
//             await ai.models.generateContent({
//               model,
//               contents:
//                 classifierPrompt,
//             });

//           const rawText =
//             (
//               response.text ||
//               ""
//             ).trim();

//           console.log(
//             "🔎 CLASSIFIER RAW RESPONSE:",
//             rawText
//           );

//           const normalized =
//             rawText
//               .toUpperCase()
//               .replace(
//                 /[`"'.,:;]/g,
//                 ""
//               )
//               .trim();

//           if (
//             normalized.includes(
//               "OUT_OF_SCOPE"
//             )
//           ) {

//             classification =
//               "OUT_OF_SCOPE";

//           } else if (
//             normalized.includes(
//               "IN_SCOPE"
//             )
//           ) {

//             classification =
//               "IN_SCOPE";
//           }

//           if (classification) {

//             classifierModel =
//               model;

//             console.log(
//               "✅ CLASSIFICATION:",
//               classification
//             );

//             console.log(
//               "✅ CLASSIFIER MODEL:",
//               classifierModel
//             );

//             break;
//           }

//           console.log(
//             "⚠️ Invalid classifier response from:",
//             model
//           );

//         } catch (error) {

//           console.log(
//             "❌ CLASSIFIER FAILED:",
//             model
//           );

//           console.log(
//             error.message
//           );
//         }
//       }

//       // =================================================
//       // CLASSIFIER FAILED
//       // =================================================

//       if (!classification) {

//         console.log(
//           "❌ ALL CLASSIFIER MODELS FAILED"
//         );

//         return res.status(500).json({

//           success: false,

//           reply:
//             "I'm currently unable to determine whether your question is related to hemophilia. Please try again.",

//           classification: null,
//         });
//       }

//       // =================================================
//       // OUT OF SCOPE
//       // =================================================

//       if (
//         classification ===
//         "OUT_OF_SCOPE"
//       ) {

//         console.log(
//           "🚫 QUESTION REJECTED AS OUT OF SCOPE"
//         );

//         // -----------------------------------------------
//         // IMPORTANT:
//         // Reply in patient's selected language.
//         // -----------------------------------------------

//         let outOfScopeReply;

//         if (
//           selectedLanguage ===
//           "hi"
//         ) {

//           outOfScopeReply =
//             "क्षमा करें, मैं केवल हीमोफीलिया, वंशानुगत रक्तस्राव संबंधी विकारों, रक्तस्राव के लक्षणों, उपचार, स्क्रीनिंग और इस एप्लिकेशन की हीमोफीलिया से संबंधित सुविधाओं के बारे में सहायता कर सकता हूँ।";

//         } else if (
//           selectedLanguage ===
//           "mr"
//         ) {

//           outOfScopeReply =
//             "क्षमस्व, मी केवळ हिमोफिलिया, आनुवंशिक रक्तस्राव विकार, रक्तस्रावाची लक्षणे, उपचार, स्क्रीनिंग आणि या ॲप्लिकेशनच्या हिमोफिलियाशी संबंधित सुविधांबद्दल मदत करू शकतो.";

//         } else {

//           outOfScopeReply =
//             "Sorry, I can only help with questions related to hemophilia, inherited bleeding disorders, bleeding symptoms, treatment, screening, and this application's hemophilia-related features.";
//         }

//         return res.json({

//           success: true,

//           reply:
//             outOfScopeReply,

//           classification:
//             "OUT_OF_SCOPE",

//           classifierModel,

//           language:
//             selectedLanguage,
//         });
//       }

//       // =================================================
//       // STEP 2
//       // ANSWER IN SELECTED LANGUAGE
//       // =================================================

//       const answerPrompt = `
// You are a medical information assistant specialized in
// hemophilia and inherited bleeding disorders.

// The user's question has already been classified as being
// related to hemophilia or an inherited bleeding disorder.

// The user's selected language is:

// ${languageName}

// IMPORTANT LANGUAGE RULE:

// You MUST answer ONLY in ${languageName}.

// Do not switch to English unless the user explicitly asks
// you to answer in English.

// If the user asks in Hindi and the selected language is Hindi,
// answer in Hindi.

// If the user asks in Marathi and the selected language is Marathi,
// answer in Marathi.

// If the user asks in English and the selected language is English,
// answer in English.

// Medical terminology may be written with the English term
// in parentheses when that improves clarity.

// Answer ONLY the user's actual question.

// Use clear, simple language suitable for:
// - patients
// - caregivers
// - healthcare users

// Do not answer questions unrelated to:
// - hemophilia
// - inherited bleeding disorders
// - bleeding symptoms
// - coagulation
// - clotting factors
// - hemophilia treatment
// - hemophilia screening
// - hemophilia diagnosis
// - hemophilia monitoring
// - hemophilia management

// Do not invent medical facts.

// Do not diagnose the patient.

// Do not prescribe medication.

// Do not provide individualized treatment instructions.

// If the question requires individual medical assessment,
// clearly recommend consulting a qualified doctor,
// hematologist, or healthcare professional.

// For urgent or potentially dangerous bleeding symptoms,
// advise the user to seek urgent medical attention.

// Where appropriate, base explanations on established
// medical guidance and reputable sources such as:
// - World Federation of Hemophilia (WFH)
// - World Health Organization (WHO)
// - Centers for Disease Control and Prevention (CDC)
// - peer-reviewed hematology guidance

// Keep the response reasonably concise.

// User question:

// ${question}
// `;

//       // =================================================
//       // TRY ANSWER MODELS
//       // =================================================

//       for (
//         const model of models
//       ) {

//         try {

//           console.log(
//             "\n🧠 ANSWER MODEL TRYING:",
//             model
//           );

//           const response =
//             await ai.models.generateContent({
//               model,
//               contents:
//                 answerPrompt,
//             });

//           const answer =
//             (
//               response.text ||
//               ""
//             ).trim();

//           if (!answer) {

//             console.log(
//               "⚠️ Empty answer from:",
//               model
//             );

//             continue;
//           }

//           console.log(
//             "✅ ANSWER GENERATED BY:",
//             model
//           );

//           console.log(
//             "================================="
//           );

//           return res.json({

//             success: true,

//             reply:
//               answer,

//             classification:
//               "IN_SCOPE",

//             classifierModel,

//             answerModel:
//               model,

//             language:
//               selectedLanguage,
//           });

//         } catch (error) {

//           console.log(
//             "❌ ANSWER MODEL FAILED:",
//             model
//           );

//           console.log(
//             error.message
//           );
//         }
//       }

//       // =================================================
//       // ALL ANSWER MODELS FAILED
//       // =================================================

//       let failureReply;

//       if (
//         selectedLanguage ===
//         "hi"
//       ) {

//         failureReply =
//           "क्षमा करें, मैं अभी उत्तर तैयार नहीं कर पा रहा हूँ। कृपया कुछ देर बाद पुनः प्रयास करें।";

//       } else if (
//         selectedLanguage ===
//         "mr"
//       ) {

//         failureReply =
//           "क्षमस्व, मी सध्या उत्तर तयार करू शकत नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.";

//       } else {

//         failureReply =
//           "I'm currently unable to generate an answer. Please try again.";
//       }

//       return res.status(500).json({

//         success: false,

//         reply:
//           failureReply,

//         classification:
//           "IN_SCOPE",

//         classifierModel,

//         language:
//           selectedLanguage,
//       });

//     } catch (error) {

//       console.error(
//         "❌ CHATBOT ROUTE ERROR:",
//         error
//       );

//       return res.status(500).json({

//         success: false,

//         reply:
//           "An error occurred while processing your request. Please try again.",

//       });
//     }
//   }
// );

// // =====================================================
// // CHATBOT HEALTH CHECK
// // =====================================================

// router.get(
//   "/health",
//   (req, res) => {

//     res.json({
//       success: true,
//       message:
//         "Chatbot route is working.",
//     });
//   }
// );

// // =====================================================
// // EXPORT
// // =====================================================

// module.exports = router;


const express = require("express");
const path = require("path");
const { spawn } = require("child_process");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();


// ============================================================
// GEMINI
// ============================================================

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn(
    "⚠️ API_KEY is not configured in .env"
  );
}

const ai = new GoogleGenAI({
  apiKey: API_KEY,
});


// ============================================================
// GEMINI MODELS
// ============================================================

const models = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];


// ============================================================
// LANGUAGE
// ============================================================

function getLanguageName(language) {

  if (language === "hi") {
    return "Hindi";
  }

  if (language === "mr") {
    return "Marathi";
  }

  return "English";
}


// ============================================================
// TRANSLATED OUT-OF-SCOPE MESSAGE
// ============================================================

function getOutOfScopeMessage(language) {

  if (language === "hi") {

    return (
      "क्षमा करें, मैं केवल हीमोफीलिया, " +
      "वंशानुगत रक्तस्राव संबंधी विकारों, " +
      "रक्तस्राव के लक्षणों, उपचार, स्क्रीनिंग " +
      "और इस एप्लिकेशन की हीमोफीलिया से संबंधित " +
      "सुविधाओं के बारे में सहायता कर सकता हूँ।"
    );

  }

  if (language === "mr") {

    return (
      "क्षमस्व, मी केवळ हिमोफिलिया, " +
      "आनुवंशिक रक्तस्राव विकार, रक्तस्रावाची " +
      "लक्षणे, उपचार, स्क्रीनिंग आणि या " +
      "ॲप्लिकेशनच्या हिमोफिलियाशी संबंधित " +
      "सुविधांबद्दल मदत करू शकतो."
    );

  }

  return (
    "Sorry, I can only help with questions related " +
    "to hemophilia, inherited bleeding disorders, " +
    "bleeding symptoms, treatment, screening, and " +
    "this application's hemophilia-related features."
  );
}


// ============================================================
// TRANSLATED ML RESULT
// ============================================================

function getPredictionLabel(
  prediction,
  language
) {

  if (language === "hi") {

    return {
      0: "स्वस्थ",
      1: "हल्का",
      2: "मध्यम",
      3: "गंभीर",
    }[prediction] || "अज्ञात";

  }

  if (language === "mr") {

    return {
      0: "निरोगी",
      1: "सौम्य",
      2: "मध्यम",
      3: "गंभीर",
    }[prediction] || "अज्ञात";

  }

  return {
    0: "Healthy",
    1: "Mild",
    2: "Moderate",
    3: "Severe",
  }[prediction] || "Unknown";
}


// ============================================================
// PYTHON ML PREDICTION
// ============================================================

function runMLPrediction(
  patientFeatures
) {

  return new Promise(
    (resolve, reject) => {

      // ------------------------------------------------------
      // Python executable
      //
      // Override with PYTHON_EXECUTABLE in .env when the interpreter is
      // somewhere else (a venv, for instance). The default is "python3":
      // most Linux distributions ship no bare "python" binary at all, so a
      // "python" default fails with ENOENT rather than a useful error.
      // ------------------------------------------------------

      const pythonExecutable =
        process.env.PYTHON_EXECUTABLE ||
        "python3";

      // ------------------------------------------------------
      // predict.py location
      // ------------------------------------------------------

      const pythonScript =
        path.join(
          __dirname,
          "../../ml/predict.py"
        );

      // ------------------------------------------------------
      // Start Python
      // ------------------------------------------------------

      const pythonProcess =
        spawn(
          pythonExecutable,
          [pythonScript],
          {
            windowsHide: true,
          }
        );

      let stdout = "";

      let stderr = "";

      // ------------------------------------------------------
      // Python output
      // ------------------------------------------------------

      pythonProcess.stdout.on(
        "data",
        (data) => {

          stdout +=
            data.toString();
        }
      );

      // ------------------------------------------------------
      // Python errors/logs
      // ------------------------------------------------------

      pythonProcess.stderr.on(
        "data",
        (data) => {

          stderr +=
            data.toString();
        }
      );

      // ------------------------------------------------------
      // Send patient features
      // ------------------------------------------------------

      pythonProcess.stdin.write(
        JSON.stringify(
          patientFeatures
        )
      );

      pythonProcess.stdin.end();

      // ------------------------------------------------------
      // Process completed
      // ------------------------------------------------------

      pythonProcess.on(
        "close",
        (code) => {

          if (stderr.trim()) {

            console.log(
              "🐍 Python:",
              stderr.trim()
            );
          }

          if (code !== 0) {

            return reject(
              new Error(
                `Python prediction process exited with code ${code}. ${stderr}`
              )
            );
          }

          try {

            const result =
              JSON.parse(
                stdout.trim()
              );

            if (!result.success) {

              return reject(
                new Error(
                  result.error ||
                  "ML prediction failed."
                )
              );
            }

            resolve(result);

          } catch (error) {

            reject(
              new Error(
                "Could not parse Python ML response: " +
                stdout
              )
            );
          }
        }
      );

      // ------------------------------------------------------
      // Process error
      // ------------------------------------------------------

      pythonProcess.on(
        "error",
        (error) => {

          reject(
            new Error(
              `Unable to start Python: ${error.message}`
            )
          );
        }
      );
    }
  );
}


// ============================================================
// GEMINI CHATBOT
//
// POST /api/chatbot/message
// ============================================================

router.post(
  "/message",
  async (req, res) => {

    try {

      const {
        message,
        language = "en",
      } = req.body;


      // ======================================================
      // VALIDATE
      // ======================================================

      if (
        !message ||
        typeof message !== "string" ||
        !message.trim()
      ) {

        return res.status(400).json({

          success: false,

          reply:
            "Please enter a question.",
        });
      }


      const question =
        message.trim();


      // ======================================================
      // LANGUAGE
      // ======================================================

      const selectedLanguage =
        ["en", "hi", "mr"].includes(
          language
        )
          ? language
          : "en";


      const languageName =
        getLanguageName(
          selectedLanguage
        );


      console.log(
        "\n================================="
      );

      console.log(
        "🤖 CHATBOT REQUEST"
      );

      console.log(
        "Question:",
        question
      );

      console.log(
        "Language:",
        languageName
      );

      console.log(
        "================================="
      );


      // ======================================================
      // CLASSIFIER
      // ======================================================

      const classifierPrompt = `
You are a strict query-classification system.

Determine whether the user's question is related to:

- hemophilia
- inherited bleeding disorders
- bleeding symptoms
- clotting factors
- coagulation
- hemophilia diagnosis
- hemophilia screening
- hemophilia treatment
- hemophilia complications
- hemophilia management
- hemophilia care
- hemophilia patient monitoring
- this application's hemophilia assessment
- this application's screening
- this application's reports
- this application's care functionality

The user may write in English, Hindi, or Marathi.

Understand the meaning regardless of language.

Do NOT answer the question.

Do NOT provide medical advice.

Return EXACTLY one value:

IN_SCOPE

or

OUT_OF_SCOPE

Examples:

General machine learning question = OUT_OF_SCOPE.

Diabetes treatment question = OUT_OF_SCOPE.

Hemophilia treatment question = IN_SCOPE.

Hemophilia symptom question = IN_SCOPE.

Question about bleeding symptoms = IN_SCOPE.

User question:

${question}
`;


      let classification = null;

      let classifierModel = null;


      // ======================================================
      // TRY CLASSIFIER MODELS
      // ======================================================

      for (
        const model of models
      ) {

        try {

          const response =
            await ai.models.generateContent({
              model,
              contents:
                classifierPrompt,
            });


          const rawText =
            (
              response.text ||
              ""
            ).trim();


          const normalized =
            rawText
              .toUpperCase()
              .replace(
                /[`"'.,:;]/g,
                ""
              )
              .trim();


          if (
            normalized.includes(
              "OUT_OF_SCOPE"
            )
          ) {

            classification =
              "OUT_OF_SCOPE";

          } else if (
            normalized.includes(
              "IN_SCOPE"
            )
          ) {

            classification =
              "IN_SCOPE";
          }


          if (classification) {

            classifierModel =
              model;

            break;
          }

        } catch (error) {

          console.log(
            "❌ Classifier failed:",
            model,
            error.message
          );
        }
      }


      // ======================================================
      // CLASSIFIER FAILURE
      // ======================================================

      if (!classification) {

        return res.status(500).json({

          success: false,

          reply:
            "I'm currently unable to determine whether your question is related to hemophilia. Please try again.",
        });
      }


      // ======================================================
      // OUT OF SCOPE
      // ======================================================

      if (
        classification ===
        "OUT_OF_SCOPE"
      ) {

        return res.json({

          success: true,

          reply:
            getOutOfScopeMessage(
              selectedLanguage
            ),

          classification:
            "OUT_OF_SCOPE",

          classifierModel,

          language:
            selectedLanguage,
        });
      }


      // ======================================================
      // ANSWER PROMPT
      // ======================================================

      const answerPrompt = `
You are a medical information assistant specialized in
hemophilia and inherited bleeding disorders.

The user's question has already been classified as
IN_SCOPE.

The user's selected language is:

${languageName}

IMPORTANT:

Answer ONLY in ${languageName}.

Do not switch languages unless explicitly requested.

Medical terminology may include the English medical term
in parentheses when useful for clarity.

Use clear, simple language suitable for patients,
caregivers, and healthcare users.

Do not diagnose the patient.

Do not prescribe medication.

Do not invent medical facts.

Do not provide individualized treatment instructions.

If the question requires individual medical assessment,
recommend consulting a qualified doctor, hematologist,
or healthcare professional.

If the user describes potentially dangerous or urgent
bleeding symptoms, advise urgent medical attention.

Keep the response reasonably concise.

User question:

${question}
`;


      // ======================================================
      // GENERATE ANSWER
      // ======================================================

      for (
        const model of models
      ) {

        try {

          const response =
            await ai.models.generateContent({
              model,
              contents:
                answerPrompt,
            });


          const answer =
            (
              response.text ||
              ""
            ).trim();


          if (!answer) {
            continue;
          }


          return res.json({

            success: true,

            reply:
              answer,

            classification:
              "IN_SCOPE",

            classifierModel,

            answerModel:
              model,

            language:
              selectedLanguage,
          });

        } catch (error) {

          console.log(
            "❌ Answer model failed:",
            model,
            error.message
          );
        }
      }


      // ======================================================
      // ALL MODELS FAILED
      // ======================================================

      let failureReply;

      if (
        selectedLanguage === "hi"
      ) {

        failureReply =
          "क्षमा करें, मैं अभी उत्तर तैयार नहीं कर पा रहा हूँ। कृपया कुछ देर बाद पुनः प्रयास करें।";

      } else if (
        selectedLanguage === "mr"
      ) {

        failureReply =
          "क्षमस्व, मी सध्या उत्तर तयार करू शकत नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.";

      } else {

        failureReply =
          "I'm currently unable to generate an answer. Please try again.";
      }


      return res.status(500).json({

        success: false,

        reply:
          failureReply,

        classification:
          "IN_SCOPE",

        language:
          selectedLanguage,
      });


    } catch (error) {

      console.error(
        "❌ Chatbot error:",
        error
      );

      return res.status(500).json({

        success: false,

        reply:
          "An error occurred while processing your request. Please try again.",
      });
    }
  }
);


// ============================================================
// ML PREDICTION ROUTE
//
// POST /api/chatbot/predict
// ============================================================

router.post(
  "/predict",
  async (req, res) => {

    try {

      const patientFeatures =
        req.body;


      if (
        !patientFeatures ||
        typeof patientFeatures !== "object"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Patient features are required.",
        });
      }


      console.log(
        "\n================================="
      );

      console.log(
        "🧠 ML PREDICTION REQUEST"
      );

      console.log(
        patientFeatures
      );

      console.log(
        "================================="
      );


      // ======================================================
      // RUN RANDOM FOREST
      // ======================================================

      const result =
        await runMLPrediction(
          patientFeatures
        );


      const prediction =
        Number(
          result.prediction
        );


      const language =
        ["en", "hi", "mr"].includes(
          patientFeatures.language
        )
          ? patientFeatures.language
          : "en";


      // ======================================================
      // TRANSLATED LABEL
      // ======================================================

      const translatedLabel =
        getPredictionLabel(
          prediction,
          language
        );


      // ======================================================
      // RETURN RESULT
      // ======================================================

      return res.json({

        success: true,

        prediction,

        predictionLabel:
          result.predictionLabel,

        displayLabel:
          translatedLabel,

        predictionProbability:
          result.predictionProbability,

        probabilities:
          result.probabilities,

        features:
          result.features,

        language,
      });


    } catch (error) {

      console.error(
        "❌ ML prediction error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to generate the ML screening prediction.",

        error:
          error.message,
      });
    }
  }
);


// ============================================================
// CHATBOT HEALTH
// ============================================================

router.get(
  "/health",
  (req, res) => {

    res.json({

      success: true,

      message:
        "Chatbot and ML prediction routes are working.",
    });
  }
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;