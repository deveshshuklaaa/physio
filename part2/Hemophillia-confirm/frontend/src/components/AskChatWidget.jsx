// import React, { useState } from "react";
// import api from "../apiClient";

// const AskChatWidget = () => {
//   const [open, setOpen] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const toggle = () => {
//     setOpen((v) => !v);
//     setError("");
//   };

//   const send = async () => {
//     const question = input.trim();
//     if (!question || loading) return;

//     setInput("");
//     setError("");
//     setMessages((prev) => [...prev, { from: "user", text: question }]);

//     try {
//       setLoading(true);
//       const res = await api.post("/chatbot/ask-hemophilia", { question });
//       const answer =
//         res.data?.answer ||
//         "Sorry, I could not generate an answer. Please try again.";
//       setMessages((prev) => [...prev, { from: "bot", text: answer }]);
//     } catch (err) {
//       setError(
//         err.response?.data?.message ||
//           "Failed to get an answer from the AI service."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onKeyDown = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       send();
//     }
//   };

//   return (
//     <>
//       <button type="button" className="ask-toggle" onClick={toggle}>
//         <span className="ask-toggle-iconWrap">
//           <img
//             src="/images/ask-icon.png"
//             alt="Ask"
//             className="ask-toggle-icon"
//           />
//         </span>
//         <span className="ask-toggle-label">Ask</span>
//       </button>

//       {open && (
//         <div className="ask-panel" role="dialog" aria-label="Ask hemophilia AI">
//           <div className="ask-header">
//             <div>
//               <div className="ask-title">Ask about hemophilia</div>
//               <div className="ask-subtitle">
//                 Educational answers only (verified medical sources).
//               </div>
//             </div>
//             <button
//               type="button"
//               className="ask-close"
//               onClick={toggle}
//               aria-label="Close"
//             >
//               ×
//             </button>
//           </div>

//           <div className="ask-messages">
//             {messages.length === 0 && (
//               <div className="ask-empty">
//                 Try: “What is hemophilia A?” or “How is hemophilia treated?”
//               </div>
//             )}
//             {messages.map((m, idx) => (
//               <div
//                 key={idx}
//                 className={`ask-row ${m.from === "user" ? "user" : "bot"}`}
//               >
//                 <div className="ask-bubble">{m.text}</div>
//               </div>
//             ))}
//           </div>

//           {error && <div className="ask-error">{error}</div>}

//           <div className="ask-inputRow">
//             <textarea
//               className="ask-input"
//               rows={2}
//               placeholder="Ask a hemophilia question..."
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={onKeyDown}
//             />
//             <button
//               type="button"
//               className="ask-send"
//               onClick={send}
//               disabled={loading}
//             >
//               {loading ? "Sending..." : "Send"}
//             </button>
//           </div>

//           <div className="ask-disclaimer">
//             This is not medical advice. For diagnosis/treatment, consult a doctor
//             or hematologist.
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default AskChatWidget;

// import React, { useState } from "react";
// import api from "../apiClient";

// const AskChatWidget = () => {
//   const [open, setOpen] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const toggle = () => {
//     setOpen((v) => !v);
//     setError("");
//   };

//   const send = async () => {
//     const question = input.trim();
//     if (!question || loading) return;

//     setInput("");
//     setError("");
//     setMessages((prev) => [...prev, { from: "user", text: question }]);

//     try {
//       setLoading(true);
//       const res = await api.post("/chatbot/ask-hemophilia", { question });

//       const answer =
//         res.data?.answer ||
//         "Sorry, I could not generate an answer. Please try again.";

//       setMessages((prev) => [...prev, { from: "bot", text: answer }]);
//     } catch (err) {
//       setError(
//         err.response?.data?.message ||
//           "Failed to get an answer from the AI service."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onKeyDown = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       send();
//     }
//   };

//   return (
//     <>
//       {/* FLOAT BUTTON */}

//       <button className="ask-toggle" onClick={toggle}>
//         💬 Ask
//       </button>

//       {open && (
//         <div className="ask-panel">

//           {/* HEADER */}

//           <div className="ask-header">
//             <div>
//               <div className="ask-title">Ask about hemophilia</div>
//               <div className="ask-subtitle">
//                 Educational answers only
//               </div>
//             </div>

//             <button className="ask-close" onClick={toggle}>×</button>
//           </div>

//           {/* MESSAGES */}

//           <div className="ask-messages">

//             {messages.length === 0 && (
//               <div className="ask-empty">
//                 Try: “What is hemophilia A?” <br/>
//                 “How is hemophilia treated?”
//               </div>
//             )}

//             {messages.map((m, idx) => (
//               <div
//                 key={idx}
//                 className={`ask-row ${m.from === "user" ? "user" : "bot"}`}
//               >
//                 <div className="ask-bubble">{m.text}</div>
//               </div>
//             ))}

//           </div>

//           {error && <div className="ask-error">{error}</div>}

//           {/* INPUT */}

//           <div className="ask-inputRow">

//             <textarea
//               className="ask-input"
//               rows={2}
//               placeholder="Ask a hemophilia question..."
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={onKeyDown}
//             />

//             <button
//               className="ask-send"
//               onClick={send}
//               disabled={loading}
//             >
//               {loading ? "Sending..." : "Send"}
//             </button>

//           </div>

//           <div className="ask-disclaimer">
//             This is not medical advice. Consult a doctor or hematologist.
//           </div>

//         </div>
//       )}

// <style>{`

// /* FLOAT BUTTON */

// .ask-toggle{
// position:fixed;
// bottom:25px;
// right:25px;
// background:#3b82f6;
// color:white;
// border:none;
// padding:12px 18px;
// border-radius:30px;
// font-size:14px;
// cursor:pointer;
// box-shadow:0 10px 30px rgba(0,0,0,0.25);
// z-index:999;
// }

// /* CHAT PANEL */

// .ask-panel{
// position:fixed;
// bottom:90px;
// right:25px;
// width:340px;
// height:440px;
// background:#f8fafc;
// border-radius:16px;
// box-shadow:0 25px 70px rgba(0,0,0,0.35);
// display:flex;
// flex-direction:column;
// overflow:hidden;
// font-family:Arial, sans-serif;
// }

// /* HEADER */

// .ask-header{
// display:flex;
// justify-content:space-between;
// align-items:center;
// padding:12px 14px;
// background:#3b82f6;
// color:white;
// }

// .ask-title{
// font-size:13px;
// font-weight:600;
// }

// .ask-subtitle{
// font-size:10px;
// opacity:0.85;
// }

// .ask-close{
// background:none;
// border:none;
// font-size:18px;
// color:white;
// cursor:pointer;
// }

// /* MESSAGES */

// .ask-messages{
// flex:1;
// padding:12px;
// overflow-y:auto;
// background:#f1f5f9;
// }

// .ask-empty{
// font-size:12px;
// color:#64748b;
// line-height:1.4;
// }

// /* MESSAGE ROW */

// .ask-row{
// display:flex;
// margin-bottom:8px;
// }

// .ask-row.user{
// justify-content:flex-end;
// }

// .ask-row.bot{
// justify-content:flex-start;
// }

// /* BUBBLE */

// .ask-bubble{
// max-width:75%;
// padding:8px 12px;
// border-radius:12px;
// font-size:12px;
// line-height:1.4;
// }

// .ask-row.user .ask-bubble{
// background:#3b82f6;
// color:white;
// }

// .ask-row.bot .ask-bubble{
// background:white;
// border:1px solid #e2e8f0;
// }

// /* INPUT */

// .ask-inputRow{
// display:flex;
// gap:8px;
// padding:10px;
// border-top:1px solid #e2e8f0;
// }

// .ask-input{
// flex:1;
// resize:none;
// border-radius:8px;
// border:1px solid #cbd5e1;
// padding:6px 8px;
// font-size:12px;
// }

// .ask-send{
// background:#0ea5e9;
// color:white;
// border:none;
// padding:8px 14px;
// border-radius:20px;
// cursor:pointer;
// font-size:12px;
// }

// /* ERROR */

// .ask-error{
// color:#dc2626;
// font-size:11px;
// padding:6px 12px;
// }

// /* DISCLAIMER */

// .ask-disclaimer{
// font-size:10px;
// color:#64748b;
// padding:8px 12px;
// border-top:1px solid #e2e8f0;
// text-align:center;
// }

// `}</style>

//     </>
//   );
// };

// export default AskChatWidget;

import React, { useState } from "react";
import api from "../apiClient";

const AskChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = () => {
    setOpen((v) => !v);
    setError("");
  };

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setError("");
    setMessages((prev) => [...prev, { from: "user", text: question }]);

    try {
      setLoading(true);
      const res = await api.post("/chatbot/ask-hemophilia", { question });

      const answer =
        res.data?.answer ||
        "Sorry, I could not generate an answer. Please try again.";

      setMessages((prev) => [...prev, { from: "bot", text: answer }]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to get an answer from the AI service."
      );
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* FLOAT BUTTON */}

      <button className="ask-toggle" onClick={toggle}>
        💬 Ask
      </button>

      {open && (
        <div className="ask-panel">

          <div className="ask-header">
            <div>
              <div className="ask-title">Hemophilia AI Assistant</div>
              <div className="ask-subtitle">
                Educational answers only
              </div>
            </div>

            <button className="ask-close" onClick={toggle}>×</button>
          </div>

          <div className="ask-messages">

            {messages.length === 0 && (
              <div className="ask-empty">
                Try asking: <br/>
                “What is hemophilia A?” <br/>
                “How is hemophilia treated?”
              </div>
            )}

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`ask-row ${m.from === "user" ? "user" : "bot"}`}
              >
                <div className="ask-bubble">{m.text}</div>
              </div>
            ))}

          </div>

          {error && <div className="ask-error">{error}</div>}

          <div className="ask-inputRow">

            <textarea
              className="ask-input"
              rows={2}
              placeholder="Ask a hemophilia question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />

            <button
              className="ask-send"
              onClick={send}
              disabled={loading}
            >
              {loading ? "..." : "Send"}
            </button>

          </div>

          <div className="ask-disclaimer">
            This is not medical advice. Consult a doctor or hematologist.
          </div>

        </div>
      )}

<style>{`

/* FLOAT BUTTON */

.ask-toggle{
position:fixed;
bottom:45px;
right:40px;
background:linear-gradient(135deg,#4a7dfc,#6aa6ff);
color: black;
border:none;
align-items:center;
padding:12px 18px;
border-radius:30px;
font-size:18px;
height:50px;
width:120px;
cursor:pointer;
box-shadow:0 12px 35px rgba(0,0,0,0.3);
z-index:999;
transition:0.3s;
}

.ask-toggle:hover{
transform:scale(1.05);
}

/* GLASS CHAT PANEL */

.ask-panel{
position:fixed;
bottom:90px;
right:25px;
width:480px;
height:520px;
display:flex;
flex-direction:column;

background:rgba(255,255,255,0.18);
backdrop-filter:blur(25px);
-webkit-backdrop-filter:blur(25px);

border-radius:18px;
border:1px solid rgba(255,255,255,0.3);

box-shadow:0 40px 80px rgba(0,0,0,0.35);
overflow:hidden;
animation:popup 0.25s ease;
}

/* HEADER */

.ask-header{
display:flex;
justify-content:space-between;
align-items:center;
padding:14px 16px;

background:linear-gradient(135deg,#4a7dfc,#6aa6ff);
color:white;
}

.ask-title{
font-size:19px;
font-weight:600;
}

.ask-subtitle{
font-size:16px;
opacity:0.85;
}

.ask-close{
background:none;
border:none;
font-size:25px;
color:white;
cursor:pointer;
}

/* MESSAGE AREA */

.ask-messages{
flex:1;
overflow-y:auto;
padding:14px;
background:rgba(255,255,255,0.15);
}

/* EMPTY */

.ask-empty{
font-size:16px;
color:#2d3b55;
line-height:1.5;
}

/* ROW */

.ask-row{
display:flex;
margin-bottom:10px;
}

.ask-row.user{
justify-content:flex-end;
}

.ask-row.bot{
justify-content:flex-start;
}

/* CHAT BUBBLE */

.ask-bubble{
max-width:75%;
padding:10px 14px;
border-radius:14px;
font-size:16px;
line-height:1.4;
}

.ask-row.user .ask-bubble{
background:#4a7dfc;
color:white;
}

.ask-row.bot .ask-bubble{
background:rgba(255,255,255,0.7);
backdrop-filter:blur(10px);
}

/* INPUT AREA */

.ask-inputRow{
display:flex;
gap:8px;
padding:12px;
border-top:1px solid rgba(255,255,255,0.3);
}

.ask-input{
flex:1;
resize:none;
border-radius:10px;
border:none;
padding:8px;
font-size:18px;

background:rgba(255,255,255,0.6);
backdrop-filter:blur(10px);
}

.ask-input:focus{
outline:none;
}

/* SEND BUTTON */

.ask-send{
background:#4a7dfc;
border:none;
color:white;
height:40px;
width:90px;
padding:8px 14px;
border-radius:10px;
cursor:pointer;
}

/* ERROR */

.ask-error{
color:#b91c1c;
font-size:15px;
padding:0 12px;
}

/* DISCLAIMER */

.ask-disclaimer{
font-size:13px;
color:#334155;
padding:8px 12px;
text-align:center;
border-top:1px solid rgba(255,255,255,0.3);
}

/* POPUP ANIMATION */

@keyframes popup{
  from{
    opacity:0;
    transform:translateY(20px);
  }
  to{
    opacity:1;
    transform:translateY(0);
  }
}
/* ================= MOBILE RESPONSIVE ================= */

@media (max-width:768px){

/* FLOAT ASK BUTTON */

.ask-toggle{
bottom:20px;
right:16px;

height:40px;
width:90px;

font-size:16px;
padding:6px 10px;

border-radius:22px;
box-shadow:0 6px 20px rgba(0,0,0,0.25);
}

/* CHAT WINDOW */

.ask-panel{
right:10px;
bottom:70px;

width:82vw;
max-width:360px;

height:52vh;
max-height:420px;

border-radius:14px;
}

/* HEADER */

.ask-header{
padding:10px 12px;
}

.ask-title{
font-size:15px;
}

.ask-subtitle{
font-size:11px;
}

/* MESSAGE AREA */

.ask-messages{
padding:10px;
}

/* EMPTY TEXT */

.ask-empty{
font-size:13px;
line-height:1.4;
}

/* MESSAGE BUBBLE */

.ask-bubble{
font-size:13px;
padding:8px 10px;
border-radius:10px;
}

/* INPUT AREA */

.ask-inputRow{
padding:8px;
gap:6px;
}

/* INPUT */

.ask-input{
font-size:13px;
padding:6px 8px;
}

/* SEND BUTTON */

.ask-send{
height:34px;
width:60px;
font-size:12px;
border-radius:8px;
}

/* DISCLAIMER */

.ask-disclaimer{
font-size:10px;
padding:6px;
}

/* CLOSE BUTTON */

.ask-close{
font-size:18px;
}

}
}

`}</style>

    </>
  );
};

export default AskChatWidget;