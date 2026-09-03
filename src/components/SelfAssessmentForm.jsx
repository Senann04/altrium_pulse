import { useState } from "react";
import "../styles/feedback.css";
import { saveSelfAssessment } from "../services/reviewService";

// Five self-assessment questions, in required order.
const QUESTIONS = [
  "What did I do last year?",
  "What are my achievements?",
  "What are the challenges I faced?",
  "What did I learn?",
  "What are my future goals?",
];

// Reused by both Employee and Immediate Supervisor — no role logic here.
function SelfAssessmentForm({ reviewId, initialAnswers, submittedAt }) {
  const [answers, setAnswers] = useState(initialAnswers || Array(QUESTIONS.length).fill(""));
  const [submitted, setSubmitted] = useState(Boolean(submittedAt));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewId) {
      setError("No active review is available for this assessment.");
      return;
    }
    if (answers.some((answer) => !answer.trim())) {
      setSubmitted(false);
      setError("Please answer all five questions before submitting.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await saveSelfAssessment(reviewId, answers, { submit: true });
      setSubmitted(true);
    } catch (submissionError) {
      setError(submissionError.message || "Unable to submit this assessment.");
    } finally {
      setSubmitting(false);
    }
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
            disabled={submitted}
          />
        </div>
      ))}

      <div className="self-assessment-submit-row">
        {error && <span className="feedback-validation-error" role="alert">{error}</span>}
        <button type="submit" className="feedback-submit-button" disabled={submitted || submitting || !reviewId}>
          {submitting ? "Submitting…" : submitted ? "Assessment submitted" : "Submit assessment"}
        </button>
      </div>
    </form>
  );
}

export default SelfAssessmentForm;
