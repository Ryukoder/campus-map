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
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDraggingUI, setIsDraggingUI] = useState(false);

  const ZOOM_STEP = 0.2;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;

  const zoomIn = () => setScale((p) => Math.min(p + ZOOM_STEP, MAX_ZOOM));
  const zoomOut = () => setScale((p) => Math.max(p - ZOOM_STEP, MIN_ZOOM));

  const resetView = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setSelectedBuilding(null);
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    setIsDraggingUI(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    setTranslate((prev) => {
      const scaledW = MAP_WIDTH * scale;
      const scaledH = MAP_HEIGHT * scale;

      const minX = Math.min(0, rect.width - scaledW);
      const minY = Math.min(0, rect.height - scaledH);

      return {
        x: Math.max(minX, Math.min(0, prev.x + dx)),
        y: Math.max(minY, Math.min(0, prev.y + dy)),
      };
    });

    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setIsDraggingUI(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -0.1 : 0.1;

    setScale((prev) => {
      const next = Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM);

      const pointX = (mouseX - translate.x) / prev;
      const pointY = (mouseY - translate.y) / prev;

      const newX = mouseX - pointX * next;
      const newY = mouseY - pointY * next;

      const scaledW = MAP_WIDTH * next;
      const scaledH = MAP_HEIGHT * next;

      const minX = Math.min(0, rect.width - scaledW);
      const minY = Math.min(0, rect.height - scaledH);

      setTranslate({
        x: Math.max(minX, Math.min(0, newX)),
        y: Math.max(minY, Math.min(0, newY)),
      });

      return next;
    });
  };

  const focusBuilding = (b) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const targetScale = 2;
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;

    setScale(targetScale);
    setTranslate({
      x: rect.width / 2 - cx * targetScale,
      y: rect.height / 2 - cy * targetScale,
    });

    setSelectedBuilding(b);
  };

  return (
    <div className="map-page">
      <div
        ref={containerRef}
        className="map-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDraggingUI ? "grabbing" : "grab" }}
      >
        <div className="zoom-controls">
          <button onClick={zoomIn}>+</button>
          <button onClick={zoomOut}>−</button>
          <button onClick={resetView}>⟳</button>
        </div>

        <div
          className="map-transform"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: isDraggingUI ? "none" : "transform 0.1s ease",
          }}
        >
          <svg viewBox="0 0 1000 600">
            <rect x="0" y="280" width="1000" height="40" fill="#ccc" />
            <rect x="480" y="0" width="40" height="600" fill="#ccc" />

            {BUILDINGS.map((b) => (
              <g key={b.id} onClick={() => focusBuilding(b)}>
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.width}
                  height={b.height}
                  fill={b.color}
                  stroke={selectedBuilding?.id === b.id ? "#000" : "none"}
                  strokeWidth="3"
                />
                <text
                  x={b.x + b.width / 2}
                  y={b.y + b.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                  fontWeight="bold"
                >
                  {b.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="zoom-info">Zoom: {Math.round(scale * 100)}%</div>
      </div>

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
