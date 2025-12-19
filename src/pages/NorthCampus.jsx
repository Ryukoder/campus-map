import { useState } from "react";
import "../styles/Map.css";

const NorthCampus = () => {
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  return (
    <div className="map-page">
      {/* Map area */}
      <div className="map-container">
        <svg viewBox="0 0 1000 600" className="campus-map">
          {/* Roads */}
          <rect x="0" y="280" width="1000" height="40" fill="#ccc" />
          <rect x="480" y="0" width="40" height="600" fill="#ccc" />

          {/* Buildings */}
          <rect
            x="150"
            y="100"
            width="200"
            height="120"
            fill="#8ecae6"
            onClick={() => setSelectedBuilding("Science Block")}
          />

          <rect
            x="650"
            y="100"
            width="200"
            height="120"
            fill="#ffb703"
            onClick={() => setSelectedBuilding("Library")}
          />

          <rect
            x="150"
            y="380"
            width="200"
            height="120"
            fill="#90dbb4"
            onClick={() => setSelectedBuilding("Admin Block")}
          />
        </svg>
      </div>

      {/* Info panel */}
      <div className="info-panel">
        {selectedBuilding ? (
          <>
            <h2>{selectedBuilding}</h2>
            <p>Building information will appear here.</p>
          </>
        ) : (
          <p>Click a building to see details</p>
        )}
      </div>
    </div>
  );
};

export default NorthCampus;
