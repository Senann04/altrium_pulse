import { useState } from "react";
import "../styles/feedback.css";

// Five self-assessment questions, in required order.
const QUESTIONS = [
  "What did I do last year?",
  "What are my achievements?",
  "What are the challenges I faced?",
  "What did I learn?",
  "What are my future goals?",
];

// Reused by both Employee and Immediate Supervisor — no role logic here.
function SelfAssessmentForm() {
  // Answers keyed by question index. Starts empty — no dummy content.
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(""));
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
    if (error) setError("");
  };

  // Temporary frontend submission handler until Supabase integration is connected.
  const handleSubmit = (e) => {
    e.preventDefault();
    if (answers.some((answer) => !answer.trim())) {
      setSubmitted(false);
      setError("Please answer all five questions before submitting.");
      return;
    }

    setError("");
    // Backend developer: replace this with a real Supabase submission using `answers`.
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <form className="self-assessment-form" onSubmit={handleSubmit}>
      <div className="feedback-title-pill">Self Assessment</div>

      {QUESTIONS.map((question, index) => (
        <div className="self-assessment-question" key={index}>
          <label htmlFor={`self-assessment-q${index}`}>
            {index + 1}. {question}
          </label>
          <textarea
            id={`self-assessment-q${index}`}
            value={answers[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder="Write a clear, specific response…"
          />
        </div>
      ))}

      <div className="self-assessment-submit-row">
        {error && <span className="feedback-validation-error" role="alert">{error}</span>}
        <button type="submit" className="feedback-submit-button">
          Submit assessment
        </button>
        {submitted && <span className="feedback-submitted-note">Submitted</span>}
      </div>
    </form>
  );
}

export default SelfAssessmentForm;
