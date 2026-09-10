import React, { useState } from "react";

const FAQ_DATA = [
  {
    question: "What is hemophilia?",
    answer:
      "Hemophilia is a bleeding disorder where the blood does not clot properly because certain clotting factors are missing or low.",
  },
  {
    question: "What causes hemophilia?",
    answer:
      "Hemophilia is usually inherited and caused by a change in a gene that controls clotting factors. It can rarely occur without a family history due to a new mutation.",
  },
  {
    question: "Is there a cure for hemophilia?",
    answer:
      "There is currently no widely available cure, but modern factor replacement therapy and other treatments allow many people with hemophilia to lead active lives. Gene therapy is being studied in clinical trials.",
  },
  {
    question: "How is hemophilia treated?",
    answer:
      "Treatment usually involves replacing the missing clotting factor through injections, and following a care plan designed by a hematologist.",
  },
];

const InfoChatbotScreen = () => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);

  const handleAsk = () => {
    if (!input.trim()) return;
    const lower = input.toLowerCase();
    const match =
      FAQ_DATA.find((item) =>
        item.question.toLowerCase().includes("hemophilia")
      ) || FAQ_DATA[0];

    setHistory((prev) => [
      ...prev,
      { from: "user", text: input },
      { from: "bot", text: match.answer },
    ]);
    setInput("");
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Learn about Hemophilia</h2>
        <p className="card-subtitle">
          Ask a simple question to see basic, predefined information about
          hemophilia.
        </p>
      </div>
      <div
        style={{
          borderRadius: "8px",
          border: "1px solid #d0d7de",
          padding: "0.75rem",
          marginBottom: "0.75rem",
          maxHeight: "220px",
          overflowY: "auto",
          background: "#fafbfc",
          fontSize: "0.9rem",
        }}
      >
        {history.length === 0 && (
          <p style={{ color: "#555" }}>
            Example questions: &quot;What is hemophilia?&quot;, &quot;How is it
            treated?&quot;
          </p>
        )}
        {history.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "0.4rem",
              textAlign: msg.from === "user" ? "right" : "left",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "0.35rem 0.6rem",
                borderRadius: "12px",
                backgroundColor:
                  msg.from === "user" ? "var(--blue)" : "var(--blue-light)",
                color: msg.from === "user" ? "white" : "black",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>Ask a question</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAsk();
              }
            }}
          />
        </div>
      </div>
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAsk}
        >
          Ask
        </button>
      </div>
      <p className="disclaimer">
        This simple chatbot uses predefined answers and is for education only. It
        does not replace medical advice.
      </p>
    </div>
  );
};

export default InfoChatbotScreen;

