import "../styles/login.css";
import earthSvg from "../assets/earth.svg";

function GlobeAnimation() {
  return (
    <div className="globe-wrapper">

      <img src={earthSvg} alt="" className="globe-image" aria-hidden="true" />

      {/* Dotted orbit */}
      <div className="orbit-ring" aria-hidden="true" />

      {/* Single rotating marker */}
      <div className="orbit-rotator" aria-hidden="true">
        <span className="orbit-marker" />
      </div>
    </div>
  );
}

export default GlobeAnimation;