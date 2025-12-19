import { useState, useRef } from "react";

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
    pathNode: "F", // nearest path node
  },
  {
    id: "library",
    name: "Library",
    x: 650,
    y: 100,
    width: 200,
    height: 120,
    color: "#ffb703",
    pathNode: "E",
  },
  {
    id: "admin",
    name: "Admin Block",
    x: 150,
    y: 380,
    width: 200,
    height: 120,
    color: "#90dbb4",
    pathNode: "G",
  },
];

const PATH_NODES = {
  A: { x: 100, y: 300 },
  B: { x: 300, y: 300 },
  C: { x: 500, y: 300 },
  D: { x: 700, y: 300 },
  E: { x: 700, y: 160 },
  F: { x: 250, y: 160 },
  G: { x: 250, y: 420 },
};

const PATH_EDGES = {
  A: ["B"],
  B: ["A", "C", "F", "G"],
  C: ["B", "D"],
  D: ["C", "E"],
  E: ["D"],
  F: ["B"],
  G: ["B"],
};

const getPathSegments = () => {
  const segments = [];
  Object.entries(PATH_EDGES).forEach(([from, toList]) => {
    toList.forEach((to) => {
      const a = PATH_NODES[from];
      const b = PATH_NODES[to];
      if (from < to) {
        segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      }
    });
  });
  return segments;
};

const getClosestPointOnSegment = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return { x: x1, y: y1 };
  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));
  return { x: x1 + clampedT * dx, y: y1 + clampedT * dy };
};

const snapToPath = (x, y) => {
  const segments = getPathSegments();
  let closestPoint = null;
  let minDistance = Infinity;

  segments.forEach((seg) => {
    const point = getClosestPointOnSegment(
      x,
      y,
      seg.x1,
      seg.y1,
      seg.x2,
      seg.y2
    );
    const dist = Math.hypot(point.x - x, point.y - y);
    if (dist < minDistance) {
      minDistance = dist;
      closestPoint = point;
    }
  });

  return closestPoint;
};

// Find closest path node to a point
const getClosestPathNode = (x, y) => {
  let closestNode = null;
  let minDist = Infinity;

  Object.entries(PATH_NODES).forEach(([key, node]) => {
    const dist = Math.hypot(node.x - x, node.y - y);
    if (dist < minDist) {
      minDist = dist;
      closestNode = key;
    }
  });

  return closestNode;
};

// BFS pathfinding algorithm
const findPath = (startNode, endNode) => {
  if (startNode === endNode) return [startNode];

  const queue = [[startNode]];
  const visited = new Set([startNode]);

  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];

    if (node === endNode) {
      return path;
    }

    const neighbors = PATH_EDGES[node] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return null; // No path found
};

const NorthCampus = () => {
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDraggingUI, setIsDraggingUI] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [campusMode, setCampusMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [placingLocation, setPlacingLocation] = useState(false);
  const [route, setRoute] = useState(null); // Store the calculated route

  const ZOOM_STEP = 0.2;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;

  const zoomIn = () => setScale((p) => Math.min(p + ZOOM_STEP, MAX_ZOOM));
  const zoomOut = () => setScale((p) => Math.max(p - ZOOM_STEP, MIN_ZOOM));

  const filteredBuildings = BUILDINGS.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetView = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setSelectedBuilding(null);
    setRoute(null);
  };

  const calculateRoute = (building) => {
    if (!userLocation) return;

    // Find closest node to user location
    const startNode = getClosestPathNode(userLocation.x, userLocation.y);
    // Get the building's designated path node
    const endNode = building.pathNode;

    // Calculate path
    const pathNodes = findPath(startNode, endNode);

    if (pathNodes) {
      // Convert node keys to coordinates
      const pathCoordinates = [
        userLocation, // Start from user's exact location
        ...pathNodes.map((nodeKey) => PATH_NODES[nodeKey]),
      ];
      setRoute(pathCoordinates);
    } else {
      setRoute(null);
    }
  };

  const setLocationFromClick = (e) => {
    if (!campusMode || !placingLocation || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const svgX = (screenX - translate.x) / scale;
    const svgY = (screenY - translate.y) / scale;

    const snappedPoint = snapToPath(svgX, svgY);

    if (snappedPoint) {
      setUserLocation(snappedPoint);
      setPlacingLocation(false);
      setRoute(null); // Clear any existing route
    }
  };

  const handleMouseDown = (e) => {
    // Don't start dragging if clicking on UI elements
    if (
      e.target.closest(
        ".search-bar, .location-toggle, .zoom-controls, .info-panel"
      )
    ) {
      return;
    }
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

  const zoomToBuilding = (b) => {
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
  };

  const focusBuilding = (b) => {
    setSelectedBuilding(b);

    // 🚫 If navigating, do NOT zoom
    if (campusMode && userLocation) {
      calculateRoute(b);
      return;
    }

    // ✅ Only zoom when just browsing
    zoomToBuilding(b);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          cursor: isDraggingUI ? "grabbing" : "grab",
          backgroundColor: "#f5f5f5",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={setLocationFromClick}
      >
        {/* Search Bar */}
        <div
          className="search-bar"
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 10,
            backgroundColor: "white",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            width: 300,
          }}
        >
          <div
            style={{
              padding: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search buildings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 14,
              }}
            />
          </div>
          {searchQuery && (
            <div style={{ borderTop: "1px solid #eee" }}>
              {filteredBuildings.length > 0 ? (
                filteredBuildings.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      focusBuilding(b);
                      setSearchQuery("");
                    }}
                    style={{
                      padding: 10,
                      cursor: "pointer",
                      fontSize: 14,
                      borderBottom: "1px solid #eee",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "white")
                    }
                  >
                    {b.name}
                  </div>
                ))
              ) : (
                <div style={{ padding: 10, color: "#999", fontSize: 14 }}>
                  No results
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location Toggle */}
        <div
          className="location-toggle"
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            zIndex: 10,
            backgroundColor: "white",
            padding: 12,
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={campusMode}
              onChange={(e) => {
                const enabled = e.target.checked;
                setCampusMode(enabled);
                setUserLocation(null);
                setPlacingLocation(enabled);
                setRoute(null);
              }}
            />
            <span style={{ fontSize: 14 }}>I am on campus</span>
          </label>
          {placingLocation && (
            <p style={{ margin: "8px 0 0 0", fontSize: 12, color: "#666" }}>
              Click on a path to set your location
            </p>
          )}
        </div>

        {/* Zoom Controls */}
        <div
          className="zoom-controls"
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            onClick={zoomIn}
            style={{
              width: 40,
              height: 40,
              border: "none",
              backgroundColor: "white",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            +
          </button>
          <button
            onClick={zoomOut}
            style={{
              width: 40,
              height: 40,
              border: "none",
              backgroundColor: "white",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            −
          </button>
          <button
            onClick={resetView}
            style={{
              width: 40,
              height: 40,
              border: "none",
              backgroundColor: "white",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            ⟳
          </button>
        </div>

        {/* Map */}
        <div
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            transition: isDraggingUI ? "none" : "transform 0.1s ease",
            width: MAP_WIDTH,
            height: MAP_HEIGHT,
          }}
        >
          <svg
            viewBox="0 0 1000 600"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            {/* Roads */}
            <rect x="0" y="280" width="1000" height="40" fill="#ccc" />
            <rect x="480" y="0" width="40" height="600" fill="#ccc" />

            {/* Walkable paths */}
            {Object.entries(PATH_EDGES).map(([from, toList]) =>
              toList.map((to) => {
                const fromNode = PATH_NODES[from];
                const toNode = PATH_NODES[to];
                return (
                  <line
                    key={`${from}-${to}`}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="#888"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                );
              })
            )}

            {/* Route visualization */}
            {route && route.length > 1 && (
              <g>
                {route.slice(0, -1).map((point, i) => {
                  const nextPoint = route[i + 1];
                  return (
                    <line
                      key={`route-${i}`}
                      x1={point.x}
                      y1={point.y}
                      x2={nextPoint.x}
                      y2={nextPoint.y}
                      stroke="#1e90ff"
                      strokeWidth="6"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                  );
                })}
              </g>
            )}

            {/* Buildings */}
            {BUILDINGS.map((b) => (
              <g
                key={b.id}
                onClick={() => focusBuilding(b)}
                style={{
                  pointerEvents: placingLocation ? "none" : "auto",
                }}
              >
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
                  fontSize="16"
                >
                  {b.name}
                </text>
              </g>
            ))}

            {/* User location marker */}
            {campusMode && userLocation && (
              <g>
                <circle
                  cx={userLocation.x}
                  cy={userLocation.y}
                  r="12"
                  fill="#1e90ff"
                  stroke="white"
                  strokeWidth="3"
                />
                <circle
                  cx={userLocation.x}
                  cy={userLocation.y}
                  r="4"
                  fill="white"
                />
              </g>
            )}

            {/* Destination marker */}
            {route && route.length > 0 && (
              <circle
                cx={route[route.length - 1].x}
                cy={route[route.length - 1].y}
                r="10"
                fill="red"
                stroke="white"
                strokeWidth="2"
              />
            )}
          </svg>
        </div>

        {/* Zoom Info */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            backgroundColor: "white",
            padding: "8px 12px",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            fontSize: 14,
          }}
        >
          Zoom: {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Info Panel */}
      <div
        style={{
          width: 300,
          padding: 20,
          backgroundColor: "white",
          borderLeft: "1px solid #ddd",
          overflowY: "auto",
        }}
      >
        {selectedBuilding ? (
          <>
            <h2 style={{ marginTop: 0 }}>{selectedBuilding.name}</h2>
            <p>Building information will appear here.</p>
            {route && (
              <div
                style={{
                  marginTop: 20,
                  padding: 12,
                  backgroundColor: "#e3f2fd",
                  borderRadius: 8,
                  border: "1px solid #1e90ff",
                }}
              >
                <h3 style={{ margin: "0 0 8px 0", fontSize: 16 }}>
                  📍 Route Found
                </h3>
                <p style={{ margin: 0, fontSize: 14 }}>
                  Path has {route.length - 1} segments
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 0 }}>North Campus Map</h2>
            <p>Click a building to see details and get directions</p>
            <div
              style={{
                marginTop: 20,
                padding: 12,
                backgroundColor: "#f5f5f5",
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              <p>
                <strong>How to use:</strong>
              </p>
              <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                <li>Enable "I am on campus"</li>
                <li>Click on a path to set your location</li>
                <li>Click any building to get directions</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NorthCampus;
