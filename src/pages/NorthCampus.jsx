import { useState, useRef } from "react";
import "../styles/Map.css";
import { useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

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
  const DEFAULT_EVENT_DURATION_MIN = 60;
  const [user] = useAuthState(auth);

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDraggingUI, setIsDraggingUI] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [hoveredBuilding, setHoveredBuilding] = useState(null);
  const [events, setEvents] = useState({});
  const [eventsLoaded, setEventsLoaded] = useState(false);

  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventColor, setEventColor] = useState("#1e90ff");
  const [editingEvent, setEditingEvent] = useState(null);

  const ZOOM_STEP = 0.2;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;

  // Add this utility
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
  };

  // Then use it
  const debouncedEvents = useDebounce(events, 1000);

  useEffect(() => {
    if (!user || !eventsLoaded) return;

    const saveEvents = async () => {
      await setDoc(
        doc(db, "users", user.uid),
        { events: debouncedEvents },
        { merge: true }
      );
    };

    saveEvents();
  }, [debouncedEvents, user, eventsLoaded]);

  const handleDeleteEvent = (buildingId, eventId) => {
    setEvents((prev) => {
      const updatedEvents = (prev[buildingId] || []).filter(
        (e) => e.id !== eventId
      );

      if (updatedEvents.length === 0) {
        const { [buildingId]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [buildingId]: updatedEvents,
      };
    });
  };

  // Replace your existing useEffect hooks with these corrected versions:

  // 1. LOAD events when user logs in (ONE TIME ONLY)
  useEffect(() => {
    if (!user) return;

    const loadEvents = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists() && snap.data().events) {
        setEvents(snap.data().events);
      }
      setEventsLoaded(true); // Mark as loaded
    };

    loadEvents();
  }, [user]);

  // 2. SAVE events whenever they change (but only after initial load)
  useEffect(() => {
    if (!user || !eventsLoaded) return; // Don't save until we've loaded first!

    const saveEvents = async () => {
      await setDoc(doc(db, "users", user.uid), { events }, { merge: true });
    };

    saveEvents();
  }, [events, user, eventsLoaded]);

  // 5. Request notification permission (keep this as is)
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setEvents((prev) => {
        const updated = {};

        Object.entries(prev).forEach(([buildingId, evts]) => {
          const activeEvents = evts.filter((e) => e.endTime > now);

          if (activeEvents.length > 0) {
            updated[buildingId] = activeEvents;
          }
        });

        return updated;
      });
    }, 30 * 1000); // check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setEvents((prev) => {
        const updated = {};

        Object.entries(prev).forEach(([buildingId, evts]) => {
          const newEvents = evts.map((e) => {
            const reminderTime = e.startTime - 1 * 60 * 1000;

            if (
              !e.reminded &&
              now >= reminderTime &&
              now < e.startTime &&
              Notification.permission === "granted"
            ) {
              new Notification("⏰ Upcoming Event", {
                body: `${e.title} starts in 1 minutes`,
              });

              return { ...e, reminded: true };
            }

            return e;
          });

          updated[buildingId] = newEvents;
        });

        return updated;
      });
    }, 30 * 1000); // check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const getBuildingFill = (buildingId, defaultColor, events) => {
    const buildingEvents = events[buildingId] || [];

    if (buildingEvents.length === 0) {
      return defaultColor;
    }

    if (buildingEvents.length === 1) {
      return buildingEvents[0].color;
    }

    return `url(#grad-${buildingId})`;
  };

  const handleAddEvent = () => {
    if (!eventTitle || !eventDate || !eventTime) {
      alert("Please fill all fields");
      return;
    }

    const startTime = new Date(`${eventDate}T${eventTime}`).getTime();
    const endTime = startTime + DEFAULT_EVENT_DURATION_MIN * 60 * 1000;

    setEvents((prev) => {
      const list = prev[selectedBuilding.id] || [];

      // ✏️ EDIT MODE
      if (editingEvent) {
        return {
          ...prev,
          [selectedBuilding.id]: list.map((e) =>
            e.id === editingEvent.id
              ? {
                  ...e,
                  title: eventTitle,
                  startTime,
                  endTime,
                  color: eventColor,
                  reminded: false,
                }
              : e
          ),
        };
      }

      // ➕ ADD MODE
      return {
        ...prev,
        [selectedBuilding.id]: [
          ...list,
          {
            id: Date.now().toString(),
            title: eventTitle,
            startTime,
            endTime,
            color: eventColor,
            reminded: false,
          },
        ],
      };
    });

    setEditingEvent(null);
    setShowEventModal(false);
  };

  const zoomIn = () => setScale((p) => Math.min(p + ZOOM_STEP, MAX_ZOOM));
  const zoomOut = () => setScale((p) => Math.max(p - ZOOM_STEP, MIN_ZOOM));

  const filteredBuildings = BUILDINGS.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetView = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setSelectedBuilding(null);
  };

  const handleMouseDown = (e) => {
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
    setShowBuildingModal(true);
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
      >
        {/* Search Bar */}
        <div
          className="search-bar"
          style={{
            position: "absolute",
            top: 20,
            right: 25,
            left: "auto",
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

            <defs>
              {Object.entries(events).map(([buildingId, evts]) => {
                if (evts.length <= 1) return null;

                const step = 100 / evts.length;

                return (
                  <linearGradient
                    key={buildingId}
                    id={`grad-${buildingId}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    {evts.map((e, i) => (
                      <stop
                        key={i}
                        offset={`${i * step}%`}
                        stopColor={e.color}
                      />
                    ))}
                    <stop
                      offset="100%"
                      stopColor={evts[evts.length - 1].color}
                    />
                  </linearGradient>
                );
              })}
            </defs>

            <defs>
              {Object.entries(events).map(([buildingId, evts]) => {
                if (evts.length <= 1) return null;

                const step = 100 / evts.length;

                return (
                  <linearGradient
                    key={buildingId}
                    id={`grad-${buildingId}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    {evts.map((e, index) => (
                      <stop
                        key={index}
                        offset={`${index * step}%`}
                        stopColor={e.color}
                      />
                    ))}
                    <stop
                      offset="100%"
                      stopColor={evts[evts.length - 1].color}
                    />
                  </linearGradient>
                );
              })}
            </defs>

            {/* Buildings */}
            {BUILDINGS.map((b) => (
              <g
                key={b.id}
                onClick={() => focusBuilding(b)}
                onMouseEnter={() => setHoveredBuilding(b)}
                onMouseLeave={() => setHoveredBuilding(null)}
              >
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.width}
                  height={b.height}
                  fill={getBuildingFill(b.id, b.color, events)}
                  stroke={events[b.id]?.length ? "#333" : "none"}
                  strokeWidth="2"
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

            {hoveredBuilding && (
              <g>
                <rect
                  x={hoveredBuilding.x}
                  y={hoveredBuilding.y - 32}
                  rx="6"
                  ry="6"
                  width="160"
                  height="28"
                  fill="#333"
                  opacity="0.9"
                />
                <text
                  x={hoveredBuilding.x + 8}
                  y={hoveredBuilding.y - 12}
                  fill="white"
                  fontSize="12"
                >
                  {events[hoveredBuilding.id]?.length
                    ? `${events[hoveredBuilding.id].length} upcoming events`
                    : "No upcoming events"}
                </text>
              </g>
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

      {showBuildingModal && selectedBuilding && (
        <div
          className="modal-overlay"
          onClick={() => setShowBuildingModal(false)}
        >
          <div
            className="modal-fullscreen"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <h1>{selectedBuilding.name}</h1>
              <button
                className="modal-close"
                onClick={() => setShowBuildingModal(false)}
              >
                ✕
              </button>
            </header>

            <section className="modal-hero">
              <img
                src="https://via.placeholder.com/800x400?text=Building+Image"
                alt={selectedBuilding.name}
              />
            </section>

            <section className="modal-content">
              <p className="modal-description">
                This is the {selectedBuilding.name}. Detailed information about
                this building will appear here.
              </p>

              <div className="modal-events">
                <h3>📅 Events</h3>

                {(events[selectedBuilding.id] || []).length === 0 ? (
                  <p className="empty-events">No events added yet.</p>
                ) : (
                  events[selectedBuilding.id].map((evt) => (
                    <div
                      key={evt.id}
                      className="event-item"
                      style={{ borderLeft: `6px solid ${evt.color}` }}
                    >
                      <div className="event-row">
                        <div>
                          <strong>{evt.title}</strong>
                          <div className="event-meta">
                            {new Date(evt.startTime).toLocaleDateString()} •{" "}
                            {new Date(evt.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        <div className="event-actions">
                          <button
                            className="edit-event-btn"
                            onClick={() => {
                              setEditingEvent(evt);
                              setEventTitle(evt.title);
                              setEventDate(
                                new Date(evt.startTime)
                                  .toISOString()
                                  .split("T")[0]
                              );
                              setEventTime(
                                new Date(evt.startTime)
                                  .toTimeString()
                                  .slice(0, 5)
                              );
                              setEventColor(evt.color);
                              setShowEventModal(true);
                            }}
                          >
                            ✏️
                          </button>

                          <button
                            className="delete-event-btn"
                            onClick={() =>
                              handleDeleteEvent(selectedBuilding.id, evt.id)
                            }
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                className="add-event-btn"
                onClick={() => {
                  setEditingEvent(null); // add mode
                  setShowEventModal(true);
                }}
              >
                ➕ Add Event
              </button>

              {showEventModal && (
                <div
                  className="event-modal-overlay"
                  onClick={() => setShowEventModal(false)}
                >
                  <div
                    className="event-modal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2>Add Event</h2>

                    <input
                      type="text"
                      placeholder="Event title"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                    />

                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />

                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                    />

                    <label className="color-picker">
                      Event color
                      <input
                        type="color"
                        value={eventColor}
                        onChange={(e) => setEventColor(e.target.value)}
                      />
                    </label>

                    <div className="event-modal-actions">
                      <button
                        className="cancel-btn"
                        onClick={() => setShowEventModal(false)}
                      >
                        Cancel
                      </button>

                      <button className="save-btn" onClick={handleAddEvent}>
                        {editingEvent ? "Update Event" : "Save Event"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default NorthCampus;
