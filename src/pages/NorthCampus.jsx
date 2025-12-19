import { useState, useRef } from "react";
import "../styles/Map.css";

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 600;
const BUILDINGS = [
  {
    id: "science",
    name: "Science Block",
    x: 150,
    y: 100,
    width: 200,
    height: 120,
    color: "#8ecae6",
  },
  {
    id: "library",
    name: "Library",
    x: 650,
    y: 100,
    width: 200,
    height: 120,
    color: "#ffb703",
  },
  {
    id: "admin",
    name: "Admin Block",
    x: 150,
    y: 380,
    width: 200,
    height: 120,
    color: "#90dbb4",
  },
];

const NorthCampus = () => {
  const containerRef = useRef(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // 🔹 Zoom & pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // 🔹 Drag state
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // 🔹 Mouse down
  const handleMouseDown = (e) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  // 🔹 Mouse move
  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    setTranslate((prev) => {
      const nextX = prev.x + dx;
      const nextY = prev.y + dy;

      // Scaled map size
      const scaledWidth = MAP_WIDTH * scale;
      const scaledHeight = MAP_HEIGHT * scale;

      // Clamp limits
      const minX = Math.min(0, containerWidth - scaledWidth);
      const minY = Math.min(0, containerHeight - scaledHeight);

      return {
        x: Math.max(minX, Math.min(0, nextX)),
        y: Math.max(minY, Math.min(0, nextY)),
      };
    });

    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  // 🔹 Mouse up
  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // 🔹 Zoom with wheel
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomAmount = e.deltaY > 0 ? -0.1 : 0.1;

    setScale((prev) => {
      const next = Math.min(Math.max(prev + zoomAmount, 0.5), 3);

      // Reset position if map becomes smaller than container
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scaledWidth = MAP_WIDTH * next;
        const scaledHeight = MAP_HEIGHT * next;

        if (scaledWidth < rect.width || scaledHeight < rect.height) {
          setTranslate({ x: 0, y: 0 });
        }
      }

      return next;
    });
  };

  const focusBuilding = (building) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    const targetScale = 2; // zoom level when focusing

    // Center of the building in SVG coordinates
    const buildingCenterX = building.x + building.width / 2;
    const buildingCenterY = building.y + building.height / 2;

    // Convert SVG coords → screen coords
    const translateX = rect.width / 2 - buildingCenterX * targetScale;
    const translateY = rect.height / 2 - buildingCenterY * targetScale;

    setScale(targetScale);
    setTranslate({ x: translateX, y: translateY });
  };

  return (
    <div className="map-page">
      {/* MAP */}
      <div
        ref={containerRef}
        className="map-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="map-transform"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          }}
        >
          <svg viewBox="0 0 1000 600" className="campus-map">
            {/* Roads */}
            <rect x="0" y="280" width="1000" height="40" fill="#ccc" />
            <rect x="480" y="0" width="40" height="600" fill="#ccc" />

            {/* Buildings */}
            {BUILDINGS.map((b) => (
              <rect
                key={b.id}
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                fill={b.color}
                onClick={() => {
                  setSelectedBuilding(b);
                  focusBuilding(b);
                }}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* INFO PANEL */}
      <div className="info-panel">
        {selectedBuilding ? (
          <>
            <h2>{selectedBuilding.name}</h2>
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
