import { useState, useRef } from "react";
import "../styles/Map.css";
import { useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BUILDING_META = {
  B8: { name: "B8 - Boys Hostel" },
  B9: { name: "B9 - Boys Hostel" },
  B10: { name: "B10 - Boys Hostel" },
  B11: { name: "B11 - Boys Hostel" },
  B12: { name: "B12 - Boys Hostel" },
  B13: { name: "B13 - Boys Hostel" },
  B14: { name: "B14 - Boys Hostel" },
  B15: { name: "B15 - Boys Hostel" },
  B16: { name: "B16 - Girls Hostel" },
  B17: { name: "B17 - Boys Hostel" },
  B18: { name: "B18 - Boys Hostel" },
  B19: { name: "B19 - Boys Hostel" },
  B20: { name: "B20 - Girls Hostel" },
  B21: { name: "B21 - Girls Hostel" },
  B22: { name: "B22 - Girls Hostel" },
  B23: { name: "B23 - Boys Hostel" },
  B24: { name: "B24 - Boys Hostel" },
  B26: { name: "B26 - Boys Hostel" },

  A9: {
    name: "A9 - Academic Block",
    subLocations: [
      // Ground Floor
      { id: "room_g01", name: "Room G-01", icon: "🚪", floor: "Ground Floor" },
      { id: "room_g02", name: "Room G-02", icon: "🚪", floor: "Ground Floor" },
      { id: "lab_g1", name: "Lab G-1", icon: "🔬", floor: "Ground Floor" },

      // First Floor
      { id: "room_101", name: "Room 101", icon: "🚪", floor: "First Floor" },
      { id: "room_102", name: "Room 102", icon: "🚪", floor: "First Floor" },
      { id: "lab_1", name: "Lab 1", icon: "🔬", floor: "First Floor" },

      // Second Floor
      { id: "room_201", name: "Room 201", icon: "🚪", floor: "Second Floor" },
      {
        id: "auditorium",
        name: "Mini Auditorium",
        icon: "🎭",
        floor: "Second Floor",
      },
    ],
  },
  A10: { name: "A10 - Academic Block" },
  A11: { name: "A11 - Academic Block" },
  A13: { name: "A13 - Academic Block" },
  A14: { name: "A14 - Academic Block" },
  A17: { name: "A17 - Academic Block" },
  A18: { name: "A18 - Academic Block" },
  A19: { name: "A19 - Academic Block" },

  Oak_Mess: { name: "Oak Mess" },
  Pine_Mess: { name: "Pine Mess" },
  Tulsi_Mess: { name: "Tulsi Mess" },
  Peepal_Mess: { name: "Peepal Mess" },

  Library: {
    name: "Central Library",
    subLocations: [
      { id: "reading_room", name: "Reading Room", icon: "📖" },
      { id: "study_hall", name: "Study Hall", icon: "✏️" },
      { id: "computer_lab", name: "Computer Lab", icon: "💻" },
      { id: "reference", name: "Reference Section", icon: "📚" },
    ],
  },
  Audi: {
    name: "Auditorium",
    subLocations: [
      { id: "main", name: "Main Auditorium", icon: "🎭" },
      { id: "hall_a", name: "Hall A", icon: "🚪" },
      { id: "hall_b", name: "Hall B", icon: "🚪" },
      { id: "hall_c", name: "Hall C", icon: "🚪" },
    ],
  },
  Sports_Complex: {
    name: "Sports Complex",
    subLocations: [
      { id: "cricket", name: "Cricket Ground", icon: "🏏" },
      { id: "basketball", name: "Basketball Court", icon: "🏀" },
      { id: "gym", name: "Gym", icon: "🏋️" },
      { id: "swimming", name: "Swimming Pool", icon: "🏊" },
      { id: "badminton", name: "Badminton Court", icon: "🏸" },
    ],
  },
  Health_Centre: { name: "Health Centre" },
  Bus_Stop: { name: "Bus Stop" },
  CV_Raman_Guest_House: { name: "CV Raman Guest House" },
};

const SVG_WIDTH = 4029;
const SVG_HEIGHT = 2090;

const NorthCampus = () => {
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const DEFAULT_EVENT_DURATION_MIN = 60;
  const [user] = useAuthState(auth);
  const dragDistance = useRef(0);
  const [eventError, setEventError] = useState("");

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [scale, setScale] = useState(0.3);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDraggingUI, setIsDraggingUI] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [events, setEvents] = useState({});
  const [eventsLoaded, setEventsLoaded] = useState(false);

  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [eventEndTimeDate, setEventEndTimeDate] = useState(new Date());
  const [eventColor, setEventColor] = useState("#1e90ff");
  const [eventCategory, setEventCategory] = useState("personal");
  const [eventSubLocation, setEventSubLocation] = useState(null);
  const [selectedColorFilters, setSelectedColorFilters] = useState([]);

  const EVENT_CATEGORIES = {
    academic: { color: "#3B82F6", icon: "📚", label: "Academic" },
    social: { color: "#10B981", icon: "🎉", label: "Social" },
    sports: { color: "#F59E0B", icon: "⚽", label: "Sports" },
    meeting: { color: "#8B5CF6", icon: "💼", label: "Meeting" },
    personal: { color: "#EC4899", icon: "🎯", label: "Personal" },
    deadline: { color: "#EF4444", icon: "⏰", label: "Deadline" },
  };

  const suggestCategoryFromTitle = (title) => {
    const keywords = {
      academic: [
        "class",
        "lecture",
        "study",
        "assignment",
        "exam",
        "test",
        "lab",
        "tutorial",
        "seminar",
      ],
      social: [
        "party",
        "celebration",
        "birthday",
        "fest",
        "gathering",
        "hangout",
        "dinner",
        "lunch",
      ],
      sports: [
        "sports",
        "game",
        "practice",
        "match",
        "tournament",
        "gym",
        "workout",
        "cricket",
        "football",
      ],
      meeting: [
        "meeting",
        "discussion",
        "conference",
        "call",
        "presentation",
        "review",
      ],
      deadline: [
        "deadline",
        "submission",
        "due",
        "urgent",
        "important",
        "final",
      ],
    };

    const lowerTitle = title.toLowerCase();

    for (const [category, words] of Object.entries(keywords)) {
      if (words.some((word) => lowerTitle.includes(word))) {
        return category;
      }
    }

    return "personal"; // default
  };

  const [editingEvent, setEditingEvent] = useState(null);

  const [showMessMenu, setShowMessMenu] = useState(false);
  const [menuZoom, setMenuZoom] = useState(1);
  const [eventSearchQuery, setEventSearchQuery] = useState("");

  const ZOOM_STEP = 0.2;
  const [minZoom, setMinZoom] = useState(0.15);
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

  // Add this NEW function here (after useDebounce, before handleDeleteEvent)
  const resetEventForm = () => {
    setEventTitle("");
    setEventDate(new Date());
    setEventTime(new Date());
    setEventEndTimeDate(new Date());
    setEventColor("#1e90ff");
    setEventCategory("personal");
    setEventSubLocation(null);
    setEditingEvent(null);
    setEventError("");
  };

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

  // Auto-fit map to viewport on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();

    // Calculate scale to fit entire map in viewport
    const scaleX = container.width / SVG_WIDTH;
    const scaleY = container.height / SVG_HEIGHT;

    // Use the smaller scale to ensure everything fits
    const initialScale = Math.min(scaleX, scaleY) * 0.95; // 0.95 adds 5% padding

    setScale(initialScale);
    setMinZoom(initialScale); // Set this as the minimum zoom!

    // Center the map
    setTranslate({
      x: (container.width - SVG_WIDTH * initialScale) / 2,
      y: (container.height - SVG_HEIGHT * initialScale) / 2,
    });
  }, []);

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
                body: `${e.title} starts in 1 minute at ${new Date(
                  e.startTime
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`,
              });

              return { ...e, reminded: true };
            }

            return e;
          });

          updated[buildingId] = newEvents;
        });

        return updated;
      });
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const handleAddEvent = () => {
    setEventError("");

    if (!eventTitle || !eventDate || !eventTime || !eventEndTimeDate) {
      setEventError("⚠️ Please fill all required fields");
      return;
    }

    // Combine date and time properly
    const startDateTime = new Date(eventDate);
    startDateTime.setHours(eventTime.getHours());
    startDateTime.setMinutes(eventTime.getMinutes());

    const endDateTime = new Date(eventDate);
    endDateTime.setHours(eventEndTimeDate.getHours());
    endDateTime.setMinutes(eventEndTimeDate.getMinutes());

    const startTime = startDateTime.getTime();
    const endTime = endDateTime.getTime();

    if (endTime <= startTime) {
      setEventError("⚠️ End time must be after start time");
      return;
    }

    if (endTime <= startTime) {
      setEventError("⚠️ End time must be after start time");
      return;
    }

    // Validate sub-location for buildings that have them
    if (
      selectedBuilding &&
      BUILDING_META[selectedBuilding.id]?.subLocations &&
      !eventSubLocation
    ) {
      setEventError("⚠️ Please select a specific location (Hall/Room)");
      return;
    }

    setEvents((prev) => {
      const list = prev[selectedBuilding.id] || [];

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
                  category: eventCategory,
                  subLocation: eventSubLocation,
                  reminded: false,
                }
              : e
          ),
        };
      }

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
            category: eventCategory,
            subLocation: eventSubLocation,
            reminded: false,
          },
        ],
      };
    });

    resetEventForm();
    setShowEventModal(false);
  };

  const zoomIn = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setScale((prev) => {
      const next = Math.min(prev + ZOOM_STEP, MAX_ZOOM);

      // Zoom towards center
      const pointX = (centerX - translate.x) / prev;
      const pointY = (centerY - translate.y) / prev;
      let newX = centerX - pointX * next;
      let newY = centerY - pointY * next;

      // Calculate boundaries
      const scaledW = SVG_WIDTH * next;
      const scaledH = SVG_HEIGHT * next;
      const minX =
        rect.width > scaledW
          ? (rect.width - scaledW) / 2
          : Math.min(0, rect.width - scaledW);
      const maxX = rect.width > scaledW ? (rect.width - scaledW) / 2 : 0;
      const minY =
        rect.height > scaledH
          ? (rect.height - scaledH) / 2
          : Math.min(0, rect.height - scaledH);
      const maxY = rect.height > scaledH ? (rect.height - scaledH) / 2 : 0;

      setTranslate({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      });

      return next;
    });
  };

  const zoomOut = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setScale((prev) => {
      const next = Math.max(prev - ZOOM_STEP, minZoom);

      // Zoom towards center
      const pointX = (centerX - translate.x) / prev;
      const pointY = (centerY - translate.y) / prev;
      let newX = centerX - pointX * next;
      let newY = centerY - pointY * next;

      // Calculate boundaries
      const scaledW = SVG_WIDTH * next;
      const scaledH = SVG_HEIGHT * next;
      const minX =
        rect.width > scaledW
          ? (rect.width - scaledW) / 2
          : Math.min(0, rect.width - scaledW);
      const maxX = rect.width > scaledW ? (rect.width - scaledW) / 2 : 0;
      const minY =
        rect.height > scaledH
          ? (rect.height - scaledH) / 2
          : Math.min(0, rect.height - scaledH);
      const maxY = rect.height > scaledH ? (rect.height - scaledH) / 2 : 0;

      setTranslate({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      });

      return next;
    });
  };

  const filteredBuildings = Object.entries(BUILDING_META).filter(([, b]) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetView = () => {
    if (!containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const scaleX = container.width / SVG_WIDTH;
    const scaleY = container.height / SVG_HEIGHT;
    const initialScale = Math.min(scaleX, scaleY) * 0.95;

    setScale(initialScale);
    setTranslate({
      x: (container.width - SVG_WIDTH * initialScale) / 2,
      y: (container.height - SVG_HEIGHT * initialScale) / 2,
    });
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
    dragDistance.current = 0; // 👈 ADD THIS
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    dragDistance.current += Math.abs(dx) + Math.abs(dy);

    setTranslate((prev) => {
      const scaledW = SVG_WIDTH * scale;
      const scaledH = SVG_HEIGHT * scale;
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
      const next = Math.min(Math.max(prev + delta, minZoom), MAX_ZOOM);

      // Calculate the point in the SVG coordinate system
      const pointX = (mouseX - translate.x) / prev;
      const pointY = (mouseY - translate.y) / prev;

      // Calculate new translation to keep the point under the mouse
      let newX = mouseX - pointX * next;
      let newY = mouseY - pointY * next;

      // Calculate boundaries
      const scaledW = SVG_WIDTH * next;
      const scaledH = SVG_HEIGHT * next;

      // Allow map to be centered when smaller than viewport
      const minX =
        rect.width > scaledW
          ? (rect.width - scaledW) / 2
          : Math.min(0, rect.width - scaledW);
      const maxX = rect.width > scaledW ? (rect.width - scaledW) / 2 : 0;
      const minY =
        rect.height > scaledH
          ? (rect.height - scaledH) / 2
          : Math.min(0, rect.height - scaledH);
      const maxY = rect.height > scaledH ? (rect.height - scaledH) / 2 : 0;

      setTranslate({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      });

      return next;
    });
  };

  const zoomToBuilding = (id) => {
    const el = document.getElementById(id);
    if (!el || !containerRef.current) return;

    const bbox = el.getBBox();
    const rect = containerRef.current.getBoundingClientRect();
    const targetScale = 2;

    setScale(targetScale);
    setTranslate({
      x: rect.width / 2 - (bbox.x + bbox.width / 2) * targetScale,
      y: rect.height / 2 - (bbox.y + bbox.height / 2) * targetScale,
    });
  };

  const focusBuilding = (id) => {
    if (!BUILDING_META[id]) return;

    setSelectedBuilding({
      id,
      name: BUILDING_META[id].name,
    });

    zoomToBuilding(id);
    setShowBuildingModal(true);
    setEventSearchQuery("");
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
          backgroundColor: "white",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
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
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(20px)",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
            border: "2px solid rgba(255, 255, 255, 0.15)",
            width: "min(300px, calc(100vw - 50px))",
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
            <span style={{ fontSize: 18, opacity: 0.7, color: "white" }}>
              🔍
            </span>
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
                backgroundColor: "transparent",
                color: "white",
                fontWeight: 500,
              }}
            />
          </div>
          {searchQuery && (
            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
              {filteredBuildings.length > 0 ? (
                filteredBuildings.map(([id, b]) => (
                  <div
                    key={id}
                    onClick={() => {
                      focusBuilding(id);
                      setSearchQuery("");
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor =
                        "rgba(255, 255, 255, 0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                    style={{
                      padding: 10,
                      cursor: "pointer",
                      fontSize: 14,
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      color: "white",
                      fontWeight: 500,
                      backgroundColor: "transparent",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {b.name}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: 10,
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: 14,
                  }}
                >
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
              width: 48,
              height: 48,
              border: "2px solid rgba(255, 255, 255, 0.15)",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(10px)",
              borderRadius: 12,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              cursor: "pointer",
              fontSize: 22,
              fontWeight: "bold",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3)";
            }}
          >
            +
          </button>
          <button
            onClick={zoomOut}
            style={{
              width: 48,
              height: 48,
              border: "2px solid rgba(255, 255, 255, 0.15)",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(10px)",
              borderRadius: 12,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              cursor: "pointer",
              fontSize: 22,
              fontWeight: "bold",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3)";
            }}
          >
            −
          </button>
          <button
            onClick={resetView}
            style={{
              width: 48,
              height: 48,
              border: "2px solid rgba(255, 255, 255, 0.15)",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(10px)",
              borderRadius: 12,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              cursor: "pointer",
              fontSize: 22,
              fontWeight: "bold",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3)";
            }}
          >
            ⟲
          </button>
        </div>

        {/* Map */}
        <div
          style={{
            width: SVG_WIDTH,
            height: SVG_HEIGHT,
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <svg viewBox="0 0 4029 2090" width="100%" height="100%">
            <g id="North_Campus">
              <rect id="Background" width="4029" height="2090" fill="white" />
              <g
                id="Buildings"
                onClick={(e) => {
                  // 🚫 If user dragged, ignore click
                  if (dragDistance.current > 10) return;

                  e.stopPropagation();
                  const target = e.target;

                  let buildingId = target.id;

                  if (!buildingId && target.tagName === "tspan") {
                    buildingId = target.parentElement?.id;
                  }

                  if (!buildingId) return;

                  if (
                    target.closest("#Faculty_Area") ||
                    target.closest("#Roads") ||
                    target.closest("#Open_spaces") ||
                    target.closest("#Text_Labels")
                  )
                    return;

                  if (BUILDING_META[buildingId]) {
                    focusBuilding(buildingId);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <g id="Faculty_Area">
                  <path
                    id="faculty_area4"
                    d="M845 1293.5C824 1285 624 1166.5 642.5 1207C661 1247.5 837 1676 891.5 1695C946 1714 1097.5 1744 1166 1728C1234.5 1712 1341 1651 1434 1638.5C1527 1626 1783 1686 1946.5 1673C2110 1660 2193 1665.13 2222.5 1638.5C2252 1611.87 2245.25 1626 2248.5 1598.5C2251.75 1571 2193 1452.5 2176.5 1449C2160 1445.5 2114.5 1484.5 2081 1495C2047.5 1505.5 1994.5 1483.5 1946.5 1472.5C1898.5 1461.5 1607.5 1398 1548 1393C1488.5 1388 1108 1354.5 1108 1354.5C1108 1354.5 866 1302 845 1293.5Z"
                    fill="#FFF6D6"
                  />
                  <path
                    id="faculty_area3"
                    d="M2791.64 1071.39C2752.96 1078.06 2276.19 1139.95 2262.16 1158.52C2248.14 1177.09 2229.28 1256.13 2229.28 1256.13C2229.28 1256.13 2194.47 1354.68 2211.87 1365.16C2229.28 1375.63 2262.16 1338.02 2262.16 1338.02C2262.16 1338.02 2341.95 1308.98 2376.76 1309.93C2411.58 1310.88 2444.46 1296.12 2444.46 1296.12C2444.46 1296.12 2517.61 1241.09 2572.59 1224.23C2642.57 1202.77 2686.74 1216.31 2760 1214.7C2815.77 1213.48 2848.15 1204.18 2902.85 1214.7C2971.57 1227.92 2992.43 1287.78 3061.94 1296.12C3102.95 1301.05 3150.12 1324.06 3167.35 1287.07C3183.2 1253.05 3143.66 1214.7 3120.93 1202.8C3098.2 1190.9 3044.03 1122.88 2980.22 1096.15C2945.99 1081.81 2925.21 1076.31 2888.35 1071.39C2850.92 1066.4 2830.32 1064.73 2791.64 1071.39Z"
                    fill="#FFF6D6"
                  />
                  <path
                    id="faculty_area2"
                    d="M582 990C563 990 543.259 1004.59 539 1020C533.955 1038.26 531.18 1068.25 539 1085.5C552.174 1114.56 578.228 1113.8 607.5 1126.5C645.954 1143.18 663.955 1148.39 701 1168C744.923 1191.26 775.341 1208.08 821.5 1226.5C887.539 1252.86 919.021 1253.6 989.5 1263C1035.65 1269.16 1110.54 1289.55 1156.5 1297C1220.88 1307.43 1232.08 1311.82 1296.5 1322C1363.05 1332.52 1393.05 1325.39 1460 1333C1520.58 1339.88 1548.86 1331.8 1608.5 1344.5C1654.55 1354.3 1679.39 1363.83 1725 1375.5C1779.32 1389.4 1823.02 1398.46 1878 1409.5C1878 1409.5 1956.56 1432.22 2021.5 1434.5C2041.21 1435.19 2060.1 1438.04 2079.5 1434.5C2095.54 1431.57 2103.62 1426.41 2119 1421C2131.53 1416.6 2141.2 1418.47 2151 1409.5C2169.73 1392.36 2147.02 1369.57 2151 1344.5C2154.02 1325.45 2159.89 1315.73 2164.5 1297C2171.2 1269.78 2171.32 1253.72 2178 1226.5C2184.21 1201.18 2197 1186 2197 1168C2197 1141.83 2155.15 1141.9 2119 1132C2065.29 1117.29 2020.66 1114.63 1966 1104C1926.45 1096.31 1904.29 1091.83 1864.5 1085.5C1824.41 1079.12 1801.99 1074.34 1761.5 1071.5C1717.87 1068.44 1693.21 1073.03 1649.5 1071.5C1605.79 1069.97 1570.88 1062.4 1513.5 1055.5C1457.76 1048.79 1415.35 1046.45 1360 1037C1305.41 1027.68 1274.76 1022.6 1220.5 1011.5C1165.97 1000.35 1136.83 986.044 1081.5 980C1028.7 974.233 998.558 977.63 945.5 980C869.759 983.383 850.961 982.669 775.5 990C730.034 994.417 719.135 992.045 673.5 990C642.988 988.633 612.542 990 582 990Z"
                    fill="#FFF6D6"
                  />
                  <path
                    id="faculty_area1"
                    d="M2304.74 1568.44C2286.03 1559.14 2210.67 1443.83 2222.19 1425.7C2233.71 1407.56 2287.61 1370.33 2337.57 1360.93C2376.76 1353.56 2401.33 1359.14 2440.37 1351.06C2504.7 1337.74 2517.43 1291.33 2581.04 1275.73C2692 1248.5 2874 1247 2929.28 1264.82C3000.96 1287.92 2982.2 1330.81 3056.67 1339.63C3107.79 1345.68 3145.94 1321.11 3196.35 1331.32C3246.77 1341.52 3327.12 1397.35 3318.34 1434.53C3314.06 1452.6 3133.54 1497.23 3014.86 1492.37C2906.35 1487.93 2847.5 1410.36 2739.91 1425.7C2677.94 1434.53 2559.89 1467.43 2511.2 1467.43C2432.02 1467.43 2323.46 1577.74 2304.74 1568.44Z"
                    fill="#FFF6D6"
                  />
                </g>
                <g id="Girls_Hostel">
                  <path
                    id="B16"
                    d="M2382 956L2174.5 938.5L2166 1091L2403.5 1060L2382 956Z"
                    fill="#A682B9"
                  />
                  <path
                    id="B21"
                    d="M2784.5 731.5L2605.5 769L2644.5 881.5L2977.5 824.5L2784.5 731.5Z"
                    fill="#A682B9"
                  />
                  <path
                    id="B22"
                    d="M2955.5 863.5L2696.5 922L2746.5 1028L2984 938.5L2955.5 863.5Z"
                    fill="#A682B9"
                  />
                  <path
                    id="B20"
                    d="M2671 919.5C2602.33 932.333 2415.8 945.3 2403 950.5L2420 1056.5L2726.5 1029L2671 919.5Z"
                    fill="#A682B9"
                  />
                </g>
                <g id="Boys_Hostel">
                  <path
                    id="B8"
                    d="M1754 905.5H1628V1004.5H1810.5L1905.5 905.5L1851 834L1754 905.5Z"
                    fill="#FFAB76"
                  />
                  <path
                    id="B15"
                    d="M2333 535H2059V626L2322 642L2333 535Z"
                    fill="#FFAB76"
                  />
                  <path
                    id="B10"
                    d="M1409 619H1149.5V723.5L1399.5 718L1409 619Z"
                    fill="#FFAB76"
                  />
                  <path
                    id="B12"
                    d="M1725 576.5L1450 623L1440 745L1738.5 659.5L1725 576.5Z"
                    fill="#FFAB76"
                  />
                  <path
                    id="B26"
                    d="M746.5 614L443 720L502 826.5L779.5 720L1112.5 708V614H746.5Z"
                    fill="#FFAB76"
                  />
                  <path
                    id="B18"
                    d="M2036.5 630.5V535L1899.25 551.75L1762 568.5L1768 650L2036.5 630.5Z"
                    fill="#FFAB76"
                  />
                  <path
                    id="B14"
                    d="M2790 577H2540.5L2576 692L2800 663L2790 577Z"
                    fill="#FFAB76"
                  />
                  <path
                    id="B13"
                    d="M3039 635L2836 579L2819.5 671L3027.5 768.5L3039 635Z"
                    fill="#FFAB76"
                  />
                  <path
                    id="B23"
                    d="M2558 860.5L2274 850L2300.5 767.5L2567.5 772.5L2558 860.5Z"
                    fill="#FFAB76"
                  />
                  <path
                    id="B19"
                    d="M2231 807L1923 781.5L1946 679L2268 702.5L2231 807Z"
                    fill="#FFAB76"
                  />
                  <path
                    id="B11"
                    d="M1847.5 783L1531.5 867L1496.5 768L1833.5 687L1847.5 783Z"
                    fill="#FFAB76"
                  />
                  <path
                    id="B17"
                    d="M855.5 819.5L1101 852V941H886L855.5 819.5Z"
                    fill="#FFAB76"
                  />
                  <path
                    id="B9"
                    d="M1592.5 895.5H1344.5V986L1592.5 1008.5V895.5Z"
                    fill="#FFAB76"
                  />
                  <path
                    id="B24"
                    d="M815.5 782L559 875.5V960L865 943L815.5 782Z"
                    fill="#FFAB76"
                  />
                </g>
                <g id="Academic_Block">
                  <g id="Central_Library">
                    <path
                      id="Library"
                      d="M1605.5 352C1661.56 352 1707 397.443 1707 453.5C1707 509.557 1661.56 555 1605.5 555C1549.44 555 1504 509.557 1504 453.5C1504 397.443 1549.44 352 1605.5 352Z"
                      fill="#FFD700"
                    />
                  </g>
                  <path
                    id="A14"
                    d="M2340.5 182L1710.5 260L1732.5 393.5L2361.5 322L2340.5 182Z"
                    fill="#FFD700"
                  />
                  <g id="A9">
                    <path
                      id="A9"
                      d="M3222 244C3283.86 244 3334 294.144 3334 356C3334 417.856 3283.86 468 3222 468C3160.14 468 3110 417.856 3110 356C3110 294.144 3160.14 244 3222 244Z"
                      fill="#FFD700"
                    />
                  </g>
                  <path
                    id="A13"
                    d="M2320.06 361L1750.5 433L1764 526L2332 462L2320.06 361Z"
                    fill="#FFD700"
                  />
                  <path
                    id="A10"
                    d="M3171 486L2503 369V486L3171 583V486Z"
                    fill="#FFD700"
                  />
                  <path
                    id="A11"
                    d="M2392 312L2378 184L3083 282L3039 408.5L2392 312Z"
                    fill="#FFD700"
                  />
                  <rect
                    id="A17"
                    x="920"
                    y="419"
                    width="528"
                    height="164"
                    fill="#FFD700"
                  />
                  <rect
                    id="A18"
                    x="935"
                    y="228"
                    width="534"
                    height="149"
                    fill="#FFD700"
                  />
                  <g id="A19">
                    <path
                      id="A19"
                      d="M755 361C815.751 361 865 410.249 865 471C865 531.751 815.751 581 755 581C694.249 581 645 531.751 645 471C645 410.249 694.249 361 755 361Z"
                      fill="#FFD700"
                    />
                  </g>
                </g>
                <g id="Mess">
                  <path
                    id="Oak_Mess"
                    d="M1319 855.5C1319 904.377 1279.38 944 1230.5 944C1181.62 944 1142 904.377 1142 855.5C1142 806.623 1181.62 767 1230.5 767C1279.38 767 1319 806.623 1319 855.5Z"
                    fill="#66C2A5"
                  />
                  <path
                    id="Pine_Mess"
                    d="M2522 657C2522 701.183 2486.18 737 2442 737C2397.82 737 2362 701.183 2362 657C2362 612.817 2397.82 577 2442 577C2486.18 577 2522 612.817 2522 657Z"
                    fill="#66C2A5"
                  />
                  <path
                    id="Tulsi_Mess"
                    d="M2469 422C2469 455.689 2441.69 483 2408 483C2374.31 483 2347 455.689 2347 422C2347 388.311 2374.31 361 2408 361C2441.69 361 2469 388.311 2469 422Z"
                    fill="#66C2A5"
                  />
                  <path
                    id="Peepal_Mess"
                    d="M475.814 920.284C452.897 900.837 282.712 850.432 258.097 884.564C233.481 918.696 241.12 999.66 241.12 999.66C241.12 999.66 475.814 1071.89 475.814 1059.59C475.814 1047.29 498.732 939.731 475.814 920.284Z"
                    fill="#66C2A5"
                  />
                </g>
                <g id="Village_Square">
                  <path
                    id="Sports_Complex"
                    d="M3240 938C3220 953.5 3059 881 3051.5 866C3044 851 3073.5 651 3089.5 632.5C3105.5 614 3317 632.5 3329.5 632.5C3342 632.5 3380 828 3368.5 842.5C3357 857 3311.69 857.589 3284 881C3262.52 899.154 3260 922.5 3240 938Z"
                    fill="#D9D9D9"
                  />
                  <path
                    id="CV_Raman_Guest_House"
                    d="M3243 1099.5C3219.98 1054.72 3253.5 985 3227.5 971.5C3201.5 958 3083.5 900.5 3068 913.5C3052.5 926.5 3025.5 1058 3032.5 1069C3041.63 1083.34 3221 1283 3221 1283L3358.5 1380L3435 1313L3410.5 1206.5C3410.5 1206.5 3351.21 1196.67 3319 1177.5C3282.45 1155.75 3262.45 1137.32 3243 1099.5Z"
                    fill="#D9D9D9"
                  />
                  <path
                    id="Audi"
                    d="M3606 641C3606 641 3463.5 878.5 3461 894.5C3458.5 910.5 3479.5 985 3479.5 985C3479.5 985 3491.5 1106 3491.5 1125.5C3491.5 1145 3443 1190.5 3443 1190.5C3427.99 1243.89 3499 1321 3499 1321L3788 1085L3606 641Z"
                    fill="#D9D9D9"
                  />
                  <path
                    id="Health_Centre"
                    d="M3445 874.5L3383.5 844L3349 625L3586.5 610L3445 874.5Z"
                    fill="#D9D9D9"
                  />
                  <path
                    id="Bus_Stop"
                    d="M3728.5 550.5L3623 593.5L3670.5 706L3779 660.5L3728.5 550.5Z"
                    fill="#D9D9D9"
                  />
                </g>
              </g>
              <g id="Roads" style={{ pointerEvents: "none" }}>
                <path
                  id="roads"
                  d="M198.5 1008.5L366.5 1057.5L504.5 1101.5M504.5 1101.5L844.5 1264.5L1284 1347L1553 1360L1818.5 1426L2079 1465.5L2185.5 1415M504.5 1101.5L515.25 973.5M2185.5 1415L2283 1611M2185.5 1415C2185.5 1415 2266.18 1351.54 2328 1340C2366.39 1332.83 2389.62 1347.23 2428 1340C2496.69 1327.07 2515.5 1278.5 2583 1250.5C2650.5 1222.5 2878.5 1222.5 2928.5 1237.5C2978.5 1252.5 2999.5 1325.5 3076.5 1325.5C3153.5 1325.5 3170 1304 3206.5 1293.5M2185.5 1415C2185.5 1415 2177.7 1378.33 2177.5 1354.5C2177.19 1317.77 2186.09 1297.75 2194.5 1262C2207.98 1204.72 2218.16 1172.95 2240.5 1118.5M2283 1611L2465 1501L2770.5 1447L3051 1531.5L3378.5 1447M2283 1611L2238 1662L1948.5 1698.5L1434 1662L1165 1752.5L899.5 1732.5M3378.5 1447L3357.5 1404M3378.5 1447L3811 1089.5L3611.5 594M3357.5 1404L3206.5 1293.5M3357.5 1404L3462 1317C3462 1317 3435.64 1231.95 3421 1184.5M3206.5 1293.5C3175.17 1230.08 3005.97 1055.48 3012 1074M3012 1074L2987.5 1059.5M3012 1074L3059.5 890M2987.5 1059.5L3031.5 878M2987.5 1059.5L2803.5 1045C2803.5 1045 2460.37 1089.8 2240.5 1118.5M3031.5 878L3059.5 890M3031.5 878L3039 829M3059.5 890L3254.5 965.5M2240.5 1118.5C2204.77 1116.74 2184.73 1115.76 2149 1114M3611.5 594C3611.5 594 3464.94 872.421 3446 898M3611.5 594L3180.5 616L3072 611M3446 898C3421.59 880.426 3408.35 866.673 3378.5 863C3338.45 858.072 3311.83 879.777 3283 908C3266.44 924.212 3254.5 965.5 3254.5 965.5M3446 898C3457.35 918.411 3457.13 930.156 3462 953C3470.52 992.969 3467.5 990.634 3467.5 1031.5C3467.5 1050.5 3477.79 1082.7 3474.5 1111.5C3470.56 1145.95 3446.38 1160.87 3421 1184.5M3254.5 965.5C3254.5 965.5 3246.37 1018.32 3254.5 1050.5C3263.89 1087.68 3272.92 1107.85 3300 1135C3321.99 1157.05 3322.52 1155.9 3351 1168.5C3370.99 1177.35 3399.5 1180.55 3421 1184.5M3072 611L2839.5 550.5H2512M3072 611L3039 829M3039 829L2803.5 878L2629.5 904.025M3039 829L2789.5 707L2579 744.5M2629.5 904.025L2428 926.5L2158 919.5M2629.5 904.025L2579 744.5M2158 919.5C2158 919.5 2152.51 1038.04 2149 1114M2158 919.5C2158 919.5 2030.31 906.092 1948.5 897.5M2158 919.5L2245 871.5L2285.47 750.5M2149 1114C2039.46 1092.33 1978.04 1080.17 1868.5 1058.5M1948.5 897.5C1923.31 858.252 1884 797 1884 797M1948.5 897.5C1917.26 960.374 1899.74 995.626 1868.5 1058.5M1884 797L1921 660M1884 797L1604 878H1361L1410.5 776M1921 660L2300 673.5M1921 660H1833.5L1410.5 776M2300 673.5L2285.47 750.5M2300 673.5H2339.5L2374.5 526M2285.47 750.5L2579 744.5M2579 744.5L2512 550.5M2374.5 526L2512 550.5M2374.5 526L2177 502.5L1738.5 550.5M1738.5 550.5L1487.5 593.364M1738.5 550.5L1724 414L2406 331.5L3026.5 440.5M1434 602.5L1416.19 734M1434 602.5H1126M1434 602.5L1487.5 593.364M1410.5 776C1410.5 776 1319.38 760.458 1261 750.5M1410.5 776L1416.19 734M1261 750.5C1208.28 760.458 1126 776 1126 776V962.5M1261 750.5C1321.6 744.056 1416.19 734 1416.19 734M1261 750.5C1208.28 745.063 1178.72 742.015 1126 736.578M1126 962.5H983.5L671.5 973.5H515.25M1126 962.5C1126 962.5 1256.05 1001.47 1341.5 1016.5C1442.87 1034.33 1501.4 1031.82 1604 1040C1707.22 1048.23 1765.21 1051.28 1868.5 1058.5M515.25 973.5L526 857.5L798.5 750.5L1101 734L1126 736.578M366.5 857.5L413 705.5L736.5 593.364L1126 602.5M1126 602.5C1126 602.5 1126 684.217 1126 736.578M1487.5 593.364V403H962.5"
                  stroke="#D7ACAC"
                  strokeOpacity="0.42"
                  strokeWidth="10"
                  fill="none"
                />
              </g>
              <g id="Open_spaces" style={{ pointerEvents: "none" }}>
                <g id="open_spaces1">
                  <path
                    d="M2132 950L1964 930.5L1922 1041.5L2117.5 1076L2132 950Z"
                    fill="#D7FFD6"
                  />
                  <path
                    d="M1922 804.5L1964 878.5L2155 895.5L2220 825L1922 804.5Z"
                    fill="#D7FFD6"
                  />
                  <path
                    d="M2360 871L2347.5 898H2519.5L2535 871H2360Z"
                    fill="#D7FFD6"
                  />
                  <path
                    d="M2980 952L2804 1024.5L2980 1041.5V952Z"
                    fill="#D7FFD6"
                  />
                  <path
                    d="M830 774.5L851 804.5L1094 841.5V758.5L830 774.5Z"
                    fill="#D7FFD6"
                  />
                  <path
                    d="M3436 913C3422.03 895.253 3410.48 885.218 3388.5 880C3357.62 872.668 3334.85 883.553 3311 904.5C3290.06 922.889 3284.91 940.637 3277.5 967.5C3268.47 1000.25 3266.96 1022.2 3277.5 1054.5C3288.69 1088.81 3304.77 1106.16 3333.5 1128C3357.71 1146.4 3374.69 1166.05 3404.5 1160C3429.08 1155.01 3446 1142.43 3453.5 1118.5C3466.5 1077 3458.6 1046.6 3453.5 1001C3449.61 966.178 3457.68 940.53 3436 913Z"
                    fill="#D7FFD6"
                  />
                  <path
                    d="M1399 856.5L1422 804.5L1483.5 790L1509 856.5H1399Z"
                    fill="#D7FFD6"
                  />
                </g>
                <path
                  id="open_spaces2"
                  d="M571.255 1170.99C509.552 1105.47 229.206 1008.02 148.46 1059.44C67.7135 1110.86 50.6567 1646.15 107.039 1699.81C163.421 1753.46 854 1733.5 860.5 1732.5C867 1731.5 901.604 1736.61 787 1619.5C672.396 1502.39 632.958 1236.51 571.255 1170.99Z"
                  fill="#D7FFD6"
                  stroke="#D7ACAC"
                />
                <path
                  id="open_spaces3"
                  d="M371.5 665.5C318.182 704.336 354 833.5 354 833.5C354 833.5 321.5 880.499 204 869C86.5 857.5 165 313.5 240.5 219C316 124.5 730.5 142.5 885 219C929.271 240.921 913.305 305.011 885 345.5C840.435 409.248 757.542 277.181 688.5 313C598.829 359.52 633 540 633 540C633 540 452.5 606.5 371.5 665.5Z"
                  fill="#D7FFD6"
                />
                <path
                  id="open_spaces4"
                  d="M3200 490C3185.5 497.11 3167 515 3185.5 561C3204 607 3514.29 608.03 3670 561C3699 552.241 3733.37 525.077 3743 544C3757 571.5 3803.5 667.5 3803.5 667.5C3803.5 667.5 3697 697 3683.5 724C3670 751 3752 866.5 3761 899C3770 931.5 3793 1022.5 3820.5 1052C3848 1081.5 3918.36 993.184 3948.5 931.5C3975.31 876.616 3970.97 837.567 3969.5 776.5C3967.53 694.971 3920.5 573.5 3920.5 573.5C3920.5 573.5 3901.36 412.524 3853.5 323.5C3816.26 254.231 3797.95 201.952 3728 166C3669.71 136.041 3626.79 139.364 3561.5 145C3472.85 152.652 3397.69 153.701 3349.5 228.5C3298.86 307.098 3367.5 356.5 3335.5 410.5C3301.25 468.3 3252 464.5 3200 490Z"
                  fill="#D7FFD6"
                />
              </g>
              <g id="Text_Labels" style={{ pointerEvents: "none" }}>
                <text
                  id="B15_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2114.59" y="610.773">
                    B15
                  </tspan>
                </text>
                <text
                  id="Health Centre"
                  fill="#030303"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="40"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="3377.8" y="693.545">
                    Health{" "}
                  </tspan>
                  <tspan x="3375.52" y="741.545">
                    Centre
                  </tspan>
                </text>
                <text
                  id="B20_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2488.28" y="1015.77">
                    B20&#10;
                  </tspan>
                </text>
                <text
                  id="B16_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2209.09" y="1035.77">
                    B16&#10;
                  </tspan>
                </text>
                <text
                  id="B22_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2759.31" y="974.773">
                    B22&#10;
                  </tspan>
                </text>
                <text
                  id="B21_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2704.81" y="828.773">
                    B21&#10;
                  </tspan>
                </text>
                <text
                  id="Faculty Area"
                  fill="#272525"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2555.75" y="1375.77">
                    Faculty Area
                  </tspan>
                </text>
                <text
                  id="Faculty Area_2"
                  fill="#272525"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1163.75" y="1194.77">
                    Faculty Area
                  </tspan>
                </text>
                <text
                  id="Faculty Area_3"
                  fill="#272525"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1141.75" y="1527.77">
                    Faculty Area
                  </tspan>
                </text>
                <text
                  id="Faculty Area_4"
                  fill="#272525"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2502.75" y="1182.77">
                    Faculty Area
                  </tspan>
                </text>
                <text
                  id="Peepal Mess"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="40"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="296.598" y="950.545">
                    Peepal{" "}
                  </tspan>
                  <tspan x="310.328" y="998.545">
                    Mess
                  </tspan>
                </text>
                <text
                  id="Tulsi Mess"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="40"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2366.38" y="416.545">
                    Tulsi{" "}
                  </tspan>
                  <tspan x="2359.33" y="464.545">
                    Mess
                  </tspan>
                </text>
                <text
                  id="B26_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="727.594" y="696.773">
                    B26
                  </tspan>
                </text>
                <text
                  id="Oak Mess"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="40"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1185.61" y="845.545">
                    Oak{" "}
                  </tspan>
                  <tspan x="1172.33" y="893.545">
                    Mess
                  </tspan>
                </text>
                <text
                  id="B9_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1406.22" y="966.773">
                    B9
                  </tspan>
                </text>
                <text
                  id="A18_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1126.88" y="325.773">
                    A18
                  </tspan>
                </text>
                <text
                  id="B23_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2379.31" y="839.773">
                    B23&#10;
                  </tspan>
                </text>
                <text
                  id="B19_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2032.09" y="767.773">
                    B19&#10;
                  </tspan>
                </text>
                <text
                  id="B13_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2864.81" y="681.773">
                    B13&#10;
                  </tspan>
                </text>
                <text
                  id="B14_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2609.5" y="650.773">
                    B14&#10;
                  </tspan>
                </text>
                <text
                  id="B18_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1833.25" y="616.773">
                    B18
                  </tspan>
                </text>
                <text
                  id="B11_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1598.31" y="798.773">
                    B11
                  </tspan>
                </text>
                <text
                  id="B8_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1720.38" y="969.773">
                    B8
                  </tspan>
                </text>
                <text
                  id="B17_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="904.906" y="910.773">
                    B17
                  </tspan>
                </text>
                <text
                  id="B24_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="651.5" y="907.773">
                    B24
                  </tspan>
                </text>
                <text
                  id="B12_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1511.81" y="670.773">
                    B12
                  </tspan>
                </text>
                <text
                  id="B10_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1208.78" y="688.773">
                    B10
                  </tspan>
                </text>
                <text
                  id="A19_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="698.219" y="500.773">
                    A19&#10;
                  </tspan>
                </text>
                <text
                  id="A17_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1129.03" y="529.773">
                    A17
                  </tspan>
                </text>
                <text
                  id="A11_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2666.44" y="312.773">
                    A11
                  </tspan>
                </text>
                <text
                  id="Library"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="45"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1530.44" y="471.364">
                    Library
                  </tspan>
                </text>
                <text
                  id="A14_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1949.62" y="325.773">
                    A14
                  </tspan>
                </text>
                <text
                  id="A13_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="1964.94" y="470.773">
                    A13
                  </tspan>
                </text>
                <text
                  id="A10_2"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2759.41" y="505.773">
                    A10
                  </tspan>
                </text>
                <text
                  id="A9_2"
                  fill="#070707"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="64"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="3178.75" y="368.773">
                    A9
                  </tspan>
                </text>
                <text
                  id="Sports Complex"
                  fill="#010101"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="48"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="3138.14" y="725.455">
                    Sports{" "}
                  </tspan>
                  <tspan x="3113.32" y="783.455">
                    Complex
                  </tspan>
                </text>
                <text
                  id="CV Raman Guest House"
                  transform="translate(3127.59 992) rotate(45)"
                  fill="#060606"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="40"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="4.03516" y="38.5455">
                    CV Raman Guest{" "}
                  </tspan>
                  <tspan x="104.211" y="86.5455">
                    House
                  </tspan>
                </text>
                <text
                  id="Audi_2"
                  transform="translate(3509 965)"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="75"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="23.6279" y="72.7727">
                    Audi
                  </tspan>
                </text>
                <text
                  id="Pine Mess"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="40"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="2399.04" y="654.545">
                    Pine{" "}
                  </tspan>
                  <tspan x="2389.33" y="702.545">
                    Mess
                  </tspan>
                </text>
                <text
                  id="Bus Stop"
                  fill="black"
                  xmlSpace="preserve"
                  fontFamily="Inter"
                  fontSize="24"
                  fontStyle="italic"
                  fontWeight="500"
                  letterSpacing="0em"
                >
                  <tspan x="3675.58" y="626.227">
                    Bus{" "}
                  </tspan>
                  <tspan x="3670.23" y="655.227">
                    Stop
                  </tspan>
                </text>
              </g>
              <g id="Event_Bubbles">
                {Object.entries(events).map(([buildingId, evts]) => {
                  if (!evts || evts.length === 0) return null;

                  const el = document.getElementById(buildingId);
                  if (!el) return null;

                  const bbox = el.getBBox();
                  const centerX = bbox.x + bbox.width / 2;
                  const centerY = bbox.y + bbox.height / 2 - 20;

                  // Count events by color
                  const colorCounts = evts.reduce((acc, evt) => {
                    acc[evt.color] = (acc[evt.color] || 0) + 1;
                    return acc;
                  }, {});

                  const uniqueColors = Object.keys(colorCounts);
                  const dominantColor =
                    uniqueColors.length === 1
                      ? uniqueColors[0]
                      : Object.entries(colorCounts).sort(
                          (a, b) => b[1] - a[1]
                        )[0][0];

                  return (
                    <g key={buildingId}>
                      <g transform={`translate(${centerX}, ${centerY})`}>
                        {/* Main pin body with dynamic color */}
                        <path
                          d="M0,-35 C-12,-35 -20,-27 -20,-15 C-20,-5 0,15 0,15 C0,15 20,-5 20,-15 C20,-27 12,-35 0,-35 Z"
                          fill={dominantColor}
                          stroke="white"
                          strokeWidth="2.5"
                          filter="drop-shadow(0 3px 6px rgba(0,0,0,0.35))"
                        />

                        {/* Multi-color indicator if multiple colors */}
                        {uniqueColors.length > 1 && (
                          <>
                            {uniqueColors.slice(0, 3).map((color, idx) => (
                              <circle
                                key={color}
                                cx={idx === 0 ? -8 : idx === 1 ? 0 : 8}
                                cy="-30"
                                r="3"
                                fill={color}
                                stroke="white"
                                strokeWidth="1"
                              />
                            ))}
                          </>
                        )}

                        {/* Inner white circle */}
                        <circle cx="0" cy="-18" r="16" fill="white" />

                        {/* Event count number */}
                        <text
                          x="0"
                          y="-15"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={dominantColor}
                          fontSize="24"
                          fontWeight="700"
                          style={{ pointerEvents: "none" }}
                        >
                          {evts.length}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
        </div>

        {/* Zoom Info */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(10px)",
            padding: "10px 16px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: "white",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            zIndex: 10,
            border: "2px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          Zoom: {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Info Panel */}

      {showBuildingModal && selectedBuilding && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowBuildingModal(false);
            setSelectedColorFilters([]);
            setEventSearchQuery("");
          }}
        >
          <div
            className="modal-fullscreen"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <h1>{selectedBuilding.name}</h1>
              <button
                className="modal-close"
                onClick={() => {
                  setShowBuildingModal(false);
                  setSelectedColorFilters([]);
                  setEventSearchQuery("");
                }}
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

              {/* Mess Menu Button - Only show for mess buildings */}
              {selectedBuilding &&
                selectedBuilding.id &&
                (selectedBuilding.id === "Oak_Mess" ||
                  selectedBuilding.id === "Pine_Mess" ||
                  selectedBuilding.id === "Tulsi_Mess" ||
                  selectedBuilding.id === "Peepal_Mess") && (
                  <button
                    className="view-menu-btn"
                    onClick={() => setShowMessMenu(true)}
                  >
                    📋 View Mess Menu
                  </button>
                )}
              {/* Bus Booking Button - Only show for Bus Stop */}
              {selectedBuilding && selectedBuilding.id === "Bus_Stop" && (
                <button
                  className="bus-booking-btn"
                  onClick={() =>
                    window.open(
                      "https://oas.iitmandi.ac.in/instituteprocess/common/login.aspx",
                      "_blank"
                    )
                  }
                >
                  🚌 Book Bus Tickets
                </button>
              )}

              <div className="modal-events">
                <div className="events-header">
                  <h3>📅 Events</h3>

                  {/* Color Filter Pills */}
                  {(events[selectedBuilding.id] || []).length > 0 &&
                    (() => {
                      const uniqueCategories = [
                        ...new Set(
                          (events[selectedBuilding.id] || []).map(
                            (e) => e.category || "personal"
                          )
                        ),
                      ];

                      return (
                        uniqueCategories.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                              marginBottom: "12px",
                            }}
                          >
                            {uniqueCategories.map((catKey) => {
                              const cat = EVENT_CATEGORIES[catKey];
                              if (!cat) return null;

                              const count = (
                                events[selectedBuilding.id] || []
                              ).filter(
                                (e) => (e.category || "personal") === catKey
                              ).length;

                              const isSelected =
                                selectedColorFilters.includes(catKey);

                              return (
                                <button
                                  key={catKey}
                                  onClick={() => {
                                    setSelectedColorFilters((prev) =>
                                      prev.includes(catKey)
                                        ? prev.filter((c) => c !== catKey)
                                        : [...prev, catKey]
                                    );
                                  }}
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: "20px",
                                    border: `2px solid ${cat.color}`,
                                    background: isSelected
                                      ? cat.color
                                      : "rgba(255,255,255,0.8)",
                                    color: isSelected ? "white" : "#1a1a1a",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <span>{cat.icon}</span>
                                  <span>{cat.label}</span>
                                  <span
                                    style={{
                                      opacity: 0.7,
                                      fontSize: "11px",
                                      marginLeft: "2px",
                                    }}
                                  >
                                    ({count})
                                  </span>
                                </button>
                              );
                            })}

                            {selectedColorFilters.length > 0 && (
                              <button
                                onClick={() => setSelectedColorFilters([])}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "20px",
                                  border: "2px solid #6b7280",
                                  background: "rgba(255,255,255,0.8)",
                                  color: "#6b7280",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                              >
                                Clear filters
                              </button>
                            )}
                          </div>
                        )
                      );
                    })()}

                  {/* Sub-Location Info Pills */}
                  {selectedBuilding &&
                    BUILDING_META[selectedBuilding.id]?.subLocations &&
                    (events[selectedBuilding.id] || []).some(
                      (e) => e.subLocation
                    ) && (
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                          marginBottom: "12px",
                          padding: "12px",
                          background: "rgba(59, 130, 246, 0.05)",
                          borderRadius: "12px",
                          border: "1px solid rgba(59, 130, 246, 0.1)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            fontWeight: "600",
                            alignSelf: "center",
                            marginRight: "4px",
                          }}
                        >
                          📍 Locations:
                        </span>

                        {BUILDING_META[selectedBuilding.id].subLocations.map(
                          (subLoc) => {
                            const count = (
                              events[selectedBuilding.id] || []
                            ).filter((e) => e.subLocation === subLoc.id).length;

                            if (count === 0) return null;

                            return (
                              <span
                                key={subLoc.id}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "14px",
                                  background: "rgba(59, 130, 246, 0.15)",
                                  border: "1px solid rgba(59, 130, 246, 0.25)",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  color: "#2563eb",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {subLoc.icon} {subLoc.name}{" "}
                                <span
                                  style={{
                                    background: "rgba(59, 130, 246, 0.2)",
                                    padding: "1px 5px",
                                    borderRadius: "8px",
                                    fontSize: "10px",
                                    marginLeft: "2px",
                                  }}
                                >
                                  {count}
                                </span>
                              </span>
                            );
                          }
                        )}
                      </div>
                    )}

                  {(events[selectedBuilding.id] || []).length > 0 && (
                    <div className="event-search-bar">
                      <span className="event-search-icon">🔍</span>
                      <input
                        type="text"
                        placeholder="Search events..."
                        value={eventSearchQuery}
                        onChange={(e) => setEventSearchQuery(e.target.value)}
                        className="event-search-input"
                      />
                      {eventSearchQuery && (
                        <button
                          className="clear-search-btn"
                          onClick={() => setEventSearchQuery("")}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {(events[selectedBuilding.id] || []).length === 0 ? (
                  <p className="empty-events">No events added yet.</p>
                ) : (
                  (() => {
                    // Filter events based on search query AND color filters
                    let filteredEvents = events[selectedBuilding.id] || [];

                    // Apply search filter
                    if (eventSearchQuery) {
                      filteredEvents = filteredEvents.filter((evt) =>
                        evt.title
                          .toLowerCase()
                          .includes(eventSearchQuery.toLowerCase())
                      );
                    }

                    // Apply color category filter
                    if (selectedColorFilters.length > 0) {
                      filteredEvents = filteredEvents.filter((evt) =>
                        selectedColorFilters.includes(
                          evt.category || "personal"
                        )
                      );
                    }

                    return filteredEvents.length === 0 ? (
                      <p className="empty-events">
                        No events found matching "{eventSearchQuery}"
                      </p>
                    ) : (
                      filteredEvents.map((evt) => (
                        <div
                          key={evt.id}
                          className="event-item"
                          style={{ borderLeft: `6px solid ${evt.color}` }}
                        >
                          <div className="event-row">
                            <div>
                              <strong>{evt.title}</strong>
                              <div className="event-meta">
                                {/* Show sub-location if exists */}
                                {evt.subLocation &&
                                  BUILDING_META[selectedBuilding.id]
                                    ?.subLocations && (
                                    <div style={{ marginBottom: "4px" }}>
                                      {
                                        BUILDING_META[
                                          selectedBuilding.id
                                        ].subLocations.find(
                                          (loc) => loc.id === evt.subLocation
                                        )?.icon
                                      }{" "}
                                      <strong>
                                        {
                                          BUILDING_META[
                                            selectedBuilding.id
                                          ].subLocations.find(
                                            (loc) => loc.id === evt.subLocation
                                          )?.name
                                        }
                                      </strong>
                                    </div>
                                  )}
                                {new Date(evt.startTime).toLocaleDateString()} •{" "}
                                {new Date(evt.startTime).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                                {" - "}
                                {new Date(evt.endTime).toLocaleTimeString([], {
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
                                  const startDate = new Date(evt.startTime);
                                  const endDate = new Date(evt.endTime);
                                  setEventDate(startDate);
                                  setEventTime(startDate);
                                  setEventEndTimeDate(endDate);
                                  setEventColor(evt.color);
                                  setEventCategory(evt.category || "personal");
                                  setEventSubLocation(evt.subLocation || null);
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
                    );
                  })()
                )}
              </div>

              <button
                className="add-event-btn"
                onClick={() => {
                  resetEventForm(); // This clears all fields
                  setShowEventModal(true);
                }}
              >
                ➕ Add Event
              </button>

              {showEventModal && (
                <div
                  className="event-modal-overlay"
                  onClick={() => {
                    resetEventForm();
                    setShowEventModal(false);
                  }}
                >
                  <div
                    className="event-modal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2>
                      {editingEvent ? "✏️ Edit Event" : "➕ Add New Event"}
                    </h2>

                    <div className="input-group">
                      <label className="input-label">Event Title</label>
                      <input
                        type="text"
                        placeholder="e.g., Team Meeting, Class Lecture..."
                        value={eventTitle}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setEventTitle(newTitle);

                          // Auto-suggest category if not editing
                          if (!editingEvent && newTitle.length > 3) {
                            const suggested =
                              suggestCategoryFromTitle(newTitle);
                            setEventCategory(suggested);
                            setEventColor(EVENT_CATEGORIES[suggested].color);
                          }
                        }}
                      />
                      {!editingEvent && eventTitle.length > 3 && (
                        <div
                          style={{
                            marginTop: "6px",
                            padding: "8px 12px",
                            background: "rgba(59, 130, 246, 0.1)",
                            borderRadius: "8px",
                            fontSize: "13px",
                            color: "#3B82F6",
                            fontWeight: "500",
                          }}
                        >
                          💡 Suggested: {EVENT_CATEGORIES[eventCategory].icon}{" "}
                          {EVENT_CATEGORIES[eventCategory].label}
                        </div>
                      )}
                    </div>

                    <div className="input-group">
                      <label className="input-label">📅 Event Date</label>
                      <DatePicker
                        selected={eventDate}
                        onChange={(date) => setEventDate(date)}
                        dateFormat="MMMM d, yyyy"
                        minDate={new Date()}
                        className="custom-datepicker"
                        calendarClassName="custom-calendar"
                        wrapperClassName="datepicker-wrapper"
                      />
                    </div>

                    <div className="time-row">
                      <div className="input-group">
                        <label className="input-label">🕐 Start Time</label>
                        <DatePicker
                          selected={eventTime}
                          onChange={(time) => setEventTime(time)}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={15}
                          timeCaption="Time"
                          dateFormat="h:mm aa"
                          className="custom-timepicker"
                          calendarClassName="custom-calendar"
                          wrapperClassName="datepicker-wrapper"
                        />
                      </div>

                      <div className="input-group">
                        <label className="input-label">🕐 End Time</label>
                        <DatePicker
                          selected={eventEndTimeDate}
                          onChange={(time) => setEventEndTimeDate(time)}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={15}
                          timeCaption="Time"
                          dateFormat="h:mm aa"
                          className="custom-timepicker"
                          calendarClassName="custom-calendar"
                          wrapperClassName="datepicker-wrapper"
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">🏷️ Event Category</label>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "10px",
                          marginTop: "8px",
                        }}
                      >
                        {Object.entries(EVENT_CATEGORIES).map(([key, cat]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setEventCategory(key);
                              setEventColor(cat.color);
                            }}
                            style={{
                              padding: "12px 8px",
                              borderRadius: "12px",
                              border:
                                eventCategory === key
                                  ? `3px solid ${cat.color}`
                                  : "2px solid rgba(0,0,0,0.1)",
                              background:
                                eventCategory === key
                                  ? `${cat.color}15`
                                  : "rgba(255,255,255,0.7)",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "4px",
                              transform:
                                eventCategory === key
                                  ? "scale(1.05)"
                                  : "scale(1)",
                            }}
                          >
                            <span style={{ fontSize: "24px" }}>{cat.icon}</span>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color:
                                  eventCategory === key ? cat.color : "#6b7280",
                              }}
                            >
                              {cat.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sub-Location Dropdown - DARK GLASSMORPHISM EDITION */}
                    {selectedBuilding &&
                      BUILDING_META[selectedBuilding.id]?.subLocations && (
                        <div className="input-group">
                          <label className="input-label">
                            📍 SPECIFIC LOCATION
                          </label>

                          {/* Custom Dropdown Container */}
                          <div style={{ position: "relative" }}>
                            <select
                              value={eventSubLocation || ""}
                              onChange={(e) =>
                                setEventSubLocation(e.target.value || null)
                              }
                              style={{
                                width: "100%",
                                padding: "18px 20px",
                                paddingRight: "50px",
                                borderRadius: "16px",
                                border: "2px solid rgba(255, 255, 255, 0.1)",
                                fontSize: "15px",
                                fontFamily: "inherit",
                                transition:
                                  "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                background:
                                  "linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(30, 30, 30, 0.6) 100%)",
                                backdropFilter: "blur(20px)",
                                cursor: "pointer",
                                color: "white",
                                fontWeight: "600",
                                appearance: "none",
                                boxShadow:
                                  "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                                letterSpacing: "0.3px",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background =
                                  "linear-gradient(135deg, rgba(20, 20, 20, 0.7) 0%, rgba(40, 40, 40, 0.7) 100%)";
                                e.target.style.borderColor =
                                  "rgba(255, 255, 255, 0.2)";
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow =
                                  "0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)";
                              }}
                              onMouseLeave={(e) => {
                                if (document.activeElement !== e.target) {
                                  e.target.style.background =
                                    "linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(30, 30, 30, 0.6) 100%)";
                                  e.target.style.borderColor =
                                    "rgba(255, 255, 255, 0.1)";
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow =
                                    "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
                                }
                              }}
                              onFocus={(e) => {
                                e.target.style.outline = "none";
                                e.target.style.borderColor =
                                  "rgba(59, 130, 246, 0.6)";
                                e.target.style.background =
                                  "linear-gradient(135deg, rgba(20, 20, 40, 0.8) 0%, rgba(30, 40, 60, 0.8) 100%)";
                                e.target.style.boxShadow =
                                  "0 0 0 4px rgba(59, 130, 246, 0.2), 0 12px 40px rgba(0, 0, 0, 0.5)";
                                e.target.style.transform = "translateY(-2px)";
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor =
                                  "rgba(255, 255, 255, 0.1)";
                                e.target.style.background =
                                  "linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(30, 30, 30, 0.6) 100%)";
                                e.target.style.boxShadow =
                                  "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
                                e.target.style.transform = "translateY(0)";
                              }}
                            >
                              <option
                                value=""
                                style={{
                                  background: "#1a1a1a",
                                  color: "#9ca3af",
                                  padding: "12px",
                                }}
                              >
                                ⚡ Select a location...
                              </option>

                              {(() => {
                                const locations =
                                  BUILDING_META[selectedBuilding.id]
                                    .subLocations;
                                const hasFloors = locations.some(
                                  (loc) => loc.floor
                                );

                                if (!hasFloors) {
                                  return locations.map((subLoc) => (
                                    <option
                                      key={subLoc.id}
                                      value={subLoc.id}
                                      style={{
                                        background: "#1a1a1a",
                                        color: "white",
                                        padding: "12px",
                                        fontWeight: "500",
                                      }}
                                    >
                                      {subLoc.icon} {subLoc.name}
                                    </option>
                                  ));
                                }

                                const grouped = locations.reduce((acc, loc) => {
                                  const floor = loc.floor || "Other";
                                  if (!acc[floor]) acc[floor] = [];
                                  acc[floor].push(loc);
                                  return acc;
                                }, {});

                                return Object.entries(grouped).map(
                                  ([floor, locs]) => (
                                    <optgroup
                                      key={floor}
                                      label={floor}
                                      style={{
                                        background: "#0a0a0a",
                                        color: "#3b82f6",
                                        fontWeight: "700",
                                        fontSize: "13px",
                                        padding: "8px",
                                        letterSpacing: "1px",
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      {locs.map((subLoc) => (
                                        <option
                                          key={subLoc.id}
                                          value={subLoc.id}
                                          style={{
                                            background: "#1a1a1a",
                                            color: "white",
                                            padding: "12px 12px 12px 24px",
                                            fontWeight: "500",
                                          }}
                                        >
                                          {subLoc.icon} {subLoc.name}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )
                                );
                              })()}
                            </select>

                            {/* Custom Chevron Icon */}
                            <div
                              style={{
                                position: "absolute",
                                right: "18px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                pointerEvents: "none",
                                background: "rgba(255, 255, 255, 0.1)",
                                borderRadius: "8px",
                                padding: "6px 8px",
                                backdropFilter: "blur(10px)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                              }}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </div>
                          </div>

                          {/* Selected Location Preview - DARK CARD */}
                          {eventSubLocation && (
                            <div
                              style={{
                                marginTop: "14px",
                                padding: "16px 18px",
                                background:
                                  "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)",
                                borderRadius: "14px",
                                border: "2px solid rgba(16, 185, 129, 0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                boxShadow:
                                  "0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                                backdropFilter: "blur(10px)",
                                animation: "slideIn 0.3s ease-out",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    background:
                                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                    borderRadius: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "20px",
                                    boxShadow:
                                      "0 4px 12px rgba(16, 185, 129, 0.4)",
                                  }}
                                >
                                  {
                                    BUILDING_META[
                                      selectedBuilding.id
                                    ].subLocations.find(
                                      (loc) => loc.id === eventSubLocation
                                    )?.icon
                                  }
                                </div>

                                <div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "rgba(255, 255, 255, 0.6)",
                                      fontWeight: "700",
                                      textTransform: "uppercase",
                                      letterSpacing: "1px",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    Selected Location
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "15px",
                                      fontWeight: "700",
                                      color: "#10b981",
                                      letterSpacing: "0.3px",
                                    }}
                                  >
                                    {
                                      BUILDING_META[
                                        selectedBuilding.id
                                      ].subLocations.find(
                                        (loc) => loc.id === eventSubLocation
                                      )?.name
                                    }
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setEventSubLocation(null)}
                                style={{
                                  background: "rgba(239, 68, 68, 0.2)",
                                  border: "2px solid rgba(239, 68, 68, 0.3)",
                                  padding: "8px 14px",
                                  borderRadius: "10px",
                                  color: "#ef4444",
                                  fontSize: "13px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  backdropFilter: "blur(10px)",
                                  letterSpacing: "0.3px",
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background =
                                    "rgba(239, 68, 68, 0.3)";
                                  e.target.style.transform = "scale(1.05)";
                                  e.target.style.boxShadow =
                                    "0 4px 12px rgba(239, 68, 68, 0.3)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background =
                                    "rgba(239, 68, 68, 0.2)";
                                  e.target.style.transform = "scale(1)";
                                  e.target.style.boxShadow = "none";
                                }}
                              >
                                ✕ Clear
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    <div className="color-picker">
                      <label>Custom Color (Optional)</label>
                      <input
                        type="color"
                        value={eventColor}
                        onChange={(e) => setEventColor(e.target.value)}
                      />
                    </div>

                    {eventError && (
                      <div
                        style={{
                          padding: "12px 16px",
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          border: "2px solid rgba(239, 68, 68, 0.3)",
                          borderRadius: "12px",
                          color: "#dc2626",
                          fontSize: "14px",
                          fontWeight: "600",
                          marginBottom: "20px",
                        }}
                      >
                        {eventError}
                      </div>
                    )}

                    <div className="event-modal-actions">
                      <button
                        className="cancel-btn"
                        onClick={() => {
                          resetEventForm();
                          setShowEventModal(false);
                        }}
                      >
                        Cancel
                      </button>

                      <button className="save-btn" onClick={handleAddEvent}>
                        {editingEvent ? "💾 Update Event" : "💾 Save Event"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
      {/* Mess Menu Modal */}
      {showMessMenu && (
        <div
          className="menu-modal-overlay"
          onClick={() => {
            setShowMessMenu(false);
            setMenuZoom(1);
          }}
        >
          <div
            className="menu-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="menu-modal-header">
              <h2>📋 Weekly Mess Menu</h2>
              <div className="menu-zoom-controls">
                <button
                  onClick={() => setMenuZoom((prev) => Math.min(prev + 0.2, 2))}
                  className="menu-zoom-btn"
                >
                  🔍+
                </button>
                <span className="menu-zoom-level">
                  {Math.round(menuZoom * 100)}%
                </span>
                <button
                  onClick={() =>
                    setMenuZoom((prev) => Math.max(prev - 0.2, 0.5))
                  }
                  className="menu-zoom-btn"
                >
                  🔍−
                </button>
                <button
                  onClick={() => setMenuZoom(1)}
                  className="menu-reset-btn"
                >
                  Reset
                </button>
              </div>
              <button
                className="menu-close-btn"
                onClick={() => {
                  setShowMessMenu(false);
                  setMenuZoom(1);
                }}
              >
                ✕
              </button>
            </div>

            <div className="menu-content-wrapper">
              <div
                className="menu-content"
                style={{ transform: `scale(${menuZoom})` }}
              >
                <div className="menu-table">
                  <div className="menu-row menu-header-row">
                    <div className="menu-cell">Meal</div>
                    <div className="menu-cell">Monday</div>
                    <div className="menu-cell">Tuesday</div>
                    <div className="menu-cell">Wednesday</div>
                    <div className="menu-cell">Thursday</div>
                    <div className="menu-cell">Friday</div>
                    <div className="menu-cell">Saturday</div>
                    <div className="menu-cell">Sunday</div>
                  </div>

                  {/* Breakfast Row */}
                  <div className="menu-row">
                    <div className="menu-cell meal-type">🍳 Breakfast</div>
                    <div className="menu-cell">
                      <div>Aloo onion paratha</div>
                      <div>Chutney</div>
                      <div>Curd</div>
                    </div>
                    <div className="menu-cell">
                      <div>Poori Chana</div>
                      <div>Halwa</div>
                    </div>
                    <div className="menu-cell">
                      <div>Mix Paratha</div>
                      <div>Dhaniya Chutney</div>
                      <div>Chutney</div>
                    </div>
                    <div className="menu-cell">
                      <div>Idli</div>
                      <div>Sambhar & chutney</div>
                      <div>Coconut Chutney</div>
                    </div>
                    <div className="menu-cell">
                      <div>Uttapam</div>
                      <div>Sambhar</div>
                    </div>
                    <div className="menu-cell">
                      <div>Methi/Palak paratha</div>
                      <div>Aloo Tamatar Sabji</div>
                    </div>
                    <div className="menu-cell">
                      <div>Masala Onion Dosa</div>
                      <div>Sambhar</div>
                    </div>
                  </div>

                  {/* Lunch Row */}
                  <div className="menu-row">
                    <div className="menu-cell meal-type">🍛 Lunch</div>
                    <div className="menu-cell">
                      <div>Rajma</div>
                      <div>Cabbage-Matar</div>
                      <div>Jeera Rice</div>
                      <div>Roti</div>
                    </div>
                    <div className="menu-cell">
                      <div>Mix Dal</div>
                      <div>Veg Kofta</div>
                      <div>Masala Papad</div>
                      <div>Roti</div>
                    </div>
                    <div className="menu-cell">
                      <div>Kadhi Pakora</div>
                      <div>Aloo Zeera</div>
                      <div>Poori</div>
                      <div>Roti</div>
                    </div>
                    <div className="menu-cell">
                      <div>Sitafal</div>
                      <div>White Chole</div>
                      <div>Rice</div>
                      <div>Massala Chaach</div>
                    </div>
                    <div className="menu-cell">
                      <div>Aloo Gazar Gobhi Dry</div>
                      <div>Moong Masoor Dal</div>
                      <div>Green Chutney</div>
                      <div>Roti</div>
                    </div>
                    <div className="menu-cell">
                      <div>Paneer Bhurji</div>
                      <div>Chana Dal</div>
                      <div>Roti</div>
                    </div>
                    <div className="menu-cell">
                      <div>Bhature</div>
                      <div>Chole</div>
                      <div>Fried Masala Chilli</div>
                      <div>Khichdi</div>
                    </div>
                  </div>

                  {/* Dinner Row */}
                  <div className="menu-row">
                    <div className="menu-cell meal-type">🌙 Dinner</div>
                    <div className="menu-cell">
                      <div>Sarson Ka Saag</div>
                      <div>Dal Tadka</div>
                      <div>Rice Kheer</div>
                      <div>Roti</div>
                    </div>
                    <div className="menu-cell">
                      <div>Lauki Chana</div>
                      <div>Dal Makhni</div>
                      <div>Motichur Laddu</div>
                      <div>Roti</div>
                    </div>
                    <div className="menu-cell">
                      <div>Paneer Do Pyaza</div>
                      <div>Dal Fry</div>
                      <div>Sooji Ka Halwa</div>
                      <div>Roti</div>
                    </div>
                    <div className="menu-cell">
                      <div>Mix Veg</div>
                      <div>Black Masoor dal</div>
                      <div>Gulab Jamun</div>
                      <div>Roti</div>
                    </div>
                    <div className="menu-cell">
                      <div>Palak Paneer</div>
                      <div>Roongi Dal</div>
                      <div>Balushaai</div>
                      <div>Roti</div>
                    </div>
                    <div className="menu-cell">
                      <div>Aloo Matar</div>
                      <div>Arher Dal</div>
                      <div>Garam Sewayi</div>
                      <div>Roti</div>
                    </div>
                    <div className="menu-cell">
                      <div>Paneer Biryani</div>
                      <div>Aloo soyabean</div>
                      <div>Veg Raita</div>
                      <div>Ice-Cream</div>
                    </div>
                  </div>

                  {/* Common Items Row */}
                  <div className="menu-row common-items-row">
                    <div className="menu-cell meal-type">☕ Daily</div>
                    <div
                      className="menu-cell common-items"
                      style={{ gridColumn: "2 / -1" }}
                    >
                      <div>
                        <strong>All Meals:</strong> Bread (4 slices), Butter &
                        Jam, Coffee/Tea/Bournvita, Sprouts
                      </div>
                      <div>
                        <strong>Lunch & Dinner:</strong> Green Salad (Beetroot,
                        Onion, Carrot, Tomato, Cucumber), Lemon, Pickle
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NorthCampus;
