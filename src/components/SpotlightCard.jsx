import { useRef } from "react";
import "../styles/spotlightcard.css";

// Adapted from React Bits' SpotlightCard interaction for the Altrium design system.
function SpotlightCard({ children, className = "", spotlightColor = "rgba(248, 181, 13, 0.16)" }) {
  const cardRef = useRef(null);

  const handlePointerMove = (event) => {
    const card = cardRef.current;
    if (!card) return;

    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
    card.style.setProperty("--spotlight-color", spotlightColor);
  };

  return (
    <div ref={cardRef} onPointerMove={handlePointerMove} className={`spotlight-card ${className}`}>
      {children}
    </div>
  );
}

export default SpotlightCard;
