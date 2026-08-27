function GlobeAnimation() {
  return (
    <div className="globe-wrapper" aria-hidden="true">
      <svg className="globe-image" viewBox="0 0 300 300" role="presentation">
        <defs>
          <radialGradient id="globe-gold" cx="36%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#ffd86b" />
            <stop offset="58%" stopColor="#f8b50d" />
            <stop offset="100%" stopColor="#6f4900" />
          </radialGradient>
        </defs>
        <circle cx="150" cy="150" r="116" fill="url(#globe-gold)" />
        <g fill="none" stroke="#111111" strokeWidth="3" opacity="0.62">
          <ellipse cx="150" cy="150" rx="112" ry="44" />
          <ellipse cx="150" cy="150" rx="112" ry="82" />
          <ellipse cx="150" cy="150" rx="50" ry="112" />
          <ellipse cx="150" cy="150" rx="86" ry="112" />
          <path d="M38 150h224M150 38v224" />
        </g>
      </svg>
      <div className="orbit-ring" />
      <div className="orbit-rotator">
        <span className="orbit-marker" />
      </div>
    </div>
  );
}

export default GlobeAnimation;
