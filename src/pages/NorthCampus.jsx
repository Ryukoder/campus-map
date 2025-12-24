import { useState, useRef } from "react";
import "../styles/Map.css";
import { useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

const MAP_WIDTH = 4029;
const MAP_HEIGHT = 2090;

const BUILDING_META = {
  Faculty_Area: {
    faculty_area4: {
      name: "Faculty Area 4",
      pathNode: "faculty_area4",
    },
    faculty_area3: {
      name: "Faculty Area 3",
      pathNode: "faculty_area3",
    },
    faculty_area2: {
      name: "Faculty Area 2",
      pathNode: "faculty_area2",
    },
    faculty_area1: {
      name: "Faculty Area 1",
      pathNode: "faculty_area1",
    },
  },

  Girls_Hostel: {
    B16: {
      name: "Girls Hostel B16",
      pathNode: "B16",
    },
    B21: {
      name: "Girls Hostel B21",
      pathNode: "B21",
    },
    B22: {
      name: "Girls Hostel B22",
      pathNode: "B22",
    },
    B20: {
      name: "Girls Hostel B20",
      pathNode: "B20",
    },
  },

  Boys_Hostel: {
    B8: {
      name: "Boys Hostel B8",
      pathNode: "B8",
    },
    B15: {
      name: "Boys Hostel B15",
      pathNode: "B15",
    },
    B10: {
      name: "Boys Hostel B10",
      pathNode: "B10",
    },
    B12: {
      name: "Boys Hostel B12",
      pathNode: "B12",
    },
    B26: {
      name: "Boys Hostel B26",
      pathNode: "B26",
    },
    B18: {
      name: "Boys Hostel B18",
      pathNode: "B18",
    },
    B14: {
      name: "Boys Hostel B14",
      pathNode: "B14",
    },
    B13: {
      name: "Boys Hostel B13",
      pathNode: "B13",
    },
    B23: {
      name: "Boys Hostel B23",
      pathNode: "B23",
    },
    B19: {
      name: "Boys Hostel B19",
      pathNode: "B19",
    },
    B11: {
      name: "Boys Hostel B11",
      pathNode: "B11",
    },
    B17: {
      name: "Boys Hostel B17",
      pathNode: "B17",
    },
    B9: {
      name: "Boys Hostel B9",
      pathNode: "B9",
    },
    B24: {
      name: "Boys Hostel B24",
      pathNode: "B24",
    },
  },

  Academic_Block: {
    Central_Library: {
      name: "Central Library",
      pathNode: "Central_Library",
    },
    A14: {
      name: "Academic Block A14",
      pathNode: "A14",
    },
    A9: {
      name: "Academic Block A9",
      pathNode: "A9",
    },
    A13: {
      name: "Academic Block A13",
      pathNode: "A13",
    },
    A10: {
      name: "Academic Block A10",
      pathNode: "A10",
    },
    A11: {
      name: "Academic Block A11",
      pathNode: "A11",
    },
    A17: {
      name: "Academic Block A17",
      pathNode: "A17",
    },
    A18: {
      name: "Academic Block A18",
      pathNode: "A18",
    },
  },

  Mess: {
    Oak_Mess: {
      name: "Oak Mess",
      pathNode: "Oak_Mess",
    },
    Pine_Mess: {
      name: "Pine Mess",
      pathNode: "Pine_Mess",
    },
    Tulsi_Mess: {
      name: "Tulsi Mess",
      pathNode: "Tulsi_Mess",
    },
    Peepal_Mess: {
      name: "Peepal Mess",
      pathNode: "Peepal_Mess",
    },
    A19: {
      name: "Alder Mess (A19)",
      pathNode: "A19",
    },
  },

  Village_Square: {
    Sports_Complex: {
      name: "Sports Complex",
      pathNode: "Sports_Complex",
    },
    CV_Raman_Guest_House: {
      name: "CV Raman Guest House",
      pathNode: "CV_Raman_Guest_House",
    },
    Audi: {
      name: "Auditorium (Audi)",
      pathNode: "Audi",
    },
    Health_Centre: {
      name: "Health Centre",
      pathNode: "Health_Centre",
    },
  },

  
};

const PATH_NODES = {
  // Faculty Area
  faculty_area4: { x: 1158, y: 1491 },
  faculty_area3: { x: 2643, y: 1334 },
  faculty_area2: { x: 1331, y: 1305 },
  faculty_area1: { x: 2732, y: 1513 },

  // Girls Hostel
  B16: { x: 2245, y: 1117 },
  B21: { x: 2711, y: 903 },
  B22: { x: 2815, y: 1048 },
  B20: { x: 2521, y: 1112 },

  // Boys Hostel
  B8: { x: 1731, y: 1025 },
  B15: { x: 2181, y: 690 },
  B10: { x: 1233, y: 785 },
  B12: { x: 1552, y: 760 },
  B26: { x: 738, y: 819 },
  B18: { x: 1872, y: 692 },
  B14: { x: 2627, y: 719 },
  B13: { x: 2899, y: 779 },
  B23: { x: 2408, y: 916 },
  B19: { x: 2059, y: 869 },
  B11: { x: 1649, y: 871 },
  B17: { x: 962, y: 988 },
  B9: { x: 1428, y: 1045 },
  B24: { x: 664, y: 998 },

  // Academic Block
  Central_Library: { x: 1592, y: 513 },
  A14: { x: 2031, y: 386 },
  A9: { x: 3182, y: 460 },
  A13: { x: 2005, y: 525 },
  A10: { x: 2796, y: 564 },
  A11: { x: 2694, y: 381 },
  A17: { x: 1144, y: 605 },
  A18: { x: 1158, y: 398 },

  // Mess
  Oak_Mess: { x: 1190, y: 959 },
  Pine_Mess: { x: 2402, y: 761 },
  Tulsi_Mess: { x: 2368, y: 526 },
  Peepal_Mess: { x: 319, y: 1080 },
  A19: { x: 713, y: 529 },

  // Village Square
  Sports_Complex: { x: 3175, y: 890 },
  CV_Raman_Guest_House: { x: 3196, y: 1226 },
  Audi: { x: 3555, y: 1145 },
  Health_Centre: { x: 3412, y: 835 },
};
  

const PATH_EDGES = {
  // --- Faculty Cluster (Bottom of Map) ---
  // Connected to each other and the main road
  faculty_area1: ["faculty_area3"],
  faculty_area2: ["faculty_area4"],
  faculty_area3: ["faculty_area1"],
  faculty_area4: ["faculty_area2", "Oak_Mess"],

  // --- Girls Hostels (Middle Right) ---
  // Connected to Open Spaces 4 and 1
  B16: ["B20"],
  B20: ["B16", "B22"],
  B21: ["B22"],
  B22: ["B20", "B21"],

  // --- Boys Hostels (Middle/Top Center) ---
  // Cluster around Open Space 2 and 3
  B8: ["B12", "B9"],
  B9: ["B8", "B10"],
  B10: ["B9", "B12", "A17"], // Gateway to Academic West
  B11: ["B12", "B18"],
  B12: ["B8", "B10", "B11"],

  B15: ["B18", "A14"],
  B18: ["B15", "B11", "B19"],
  B19: ["B18", "B23", "A13"],
  B23: ["B19", "Pine_Mess"],

  // Western Hostels (Far Left)
  B26: ["B24", "A19"],
  B24: ["B26", "B17"],
  B17: ["B24", "Oak_Mess"],

  // Eastern Hostels (Far Right)
  B13: ["B14", "Pine_Mess"],
  B14: ["B13", "B21"],

  // --- Academic Blocks (Top of Map) ---
  // Connected via a "Library Hub" and "A13 Hub"
  Central_Library: ["A13", "A18", "A17"],

  A13: ["Central_Library", "A14", "B19"],
  A14: ["A13", "B15"],

  A17: ["Central_Library", "B10", "A18"],
  A18: ["A17", "Central_Library"],

  A19: ["B26", "A17"], // Far West connection

  A9: ["A10", "Tulsi_Mess"], // Far East Academic
  A10: ["A9", "A11"],
  A11: ["A10", "Tulsi_Mess"],

  // --- Mess Areas (Food Hubs) ---
  Oak_Mess: ["faculty_area4", "B17", "Peepal_Mess"],
  Peepal_Mess: ["Oak_Mess"],
  Pine_Mess: ["B13", "B23"],
  Tulsi_Mess: ["A9", "A11"],

  // --- Village Square (Far East) ---
  Sports_Complex: ["Health_Centre"],
  Health_Centre: ["Sports_Complex", "Audi"],
  Audi: ["Health_Centre", "CV_Raman_Guest_House"],
  CV_Raman_Guest_House: ["Audi"],
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
      seg.y2,
    );
    const dist = Math.hypot(point.x - x, point.y - y);
    if (dist < minDistance) {
      minDistance = dist;
      closestPoint = point;
    }
  });

  return closestPoint;
};

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

  return null;
};

const NorthCampus = () => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const DEFAULT_EVENT_DURATION_MIN = 60;
  const [user] = useAuthState(auth);

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isAutoZoomed, setIsAutoZoomed] = useState(false);
  const [isDraggingUI, setIsDraggingUI] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [campusMode, setCampusMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [placingLocation, setPlacingLocation] = useState(false);
  const [route, setRoute] = useState(null);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [hoveredBuilding, setHoveredBuilding] = useState(null);
  const [events, setEvents] = useState({});
  const [eventsLoaded, setEventsLoaded] = useState(false);

  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventColor, setEventColor] = useState("#1e90ff");
  const [editingEvent, setEditingEvent] = useState(null);

  const ZOOM_STEP = 0.2;

  const getMinZoom = () => {
    if (!containerRef.current) return 0.2;

    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / MAP_WIDTH;
    const scaleY = rect.height / MAP_HEIGHT;

    return Math.min(scaleX, scaleY);
  };

  const getMaxZoom = () => {
    return getMinZoom() * 5;
  };

  const clampTranslate = (x, y, scale) => {
    if (!containerRef.current) return { x, y };

    const rect = containerRef.current.getBoundingClientRect();
    const scaledW = MAP_WIDTH * scale;
    const scaledH = MAP_HEIGHT * scale;

    const minX = rect.width - scaledW;
    const minY = rect.height - scaledH;
    const maxX = 0;
    const maxY = 0;

    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y)),
    };
  };

  const handleDeleteEvent = (buildingId, eventId) => {
    setEvents((prev) => {
      const updatedEvents = (prev[buildingId] || []).filter(
        (e) => e.id !== eventId,
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

  const getBuildingFill = (buildingId, defaultColor, events) => {
    const buildingEvents = events[buildingId] || [];

    if (buildingEvents.length === 0) {
      return defaultColor;
    }

    if (buildingEvents.length === 1) {
      return buildingEvents[0].color;
    }

    // Multiple events → gradient
    const colors = buildingEvents.map((e) => e.color);
    const step = 100 / colors.length;

    const gradientStops = colors
      .map((color, index) => `${color} ${index * step}% ${(index + 1) * step}%`)
      .join(", ");

    return `url(#grad-${buildingId})`;
  };

  const handleAddEvent = () => {
    if (!eventTitle || !eventDate || !eventTime) {
      alert("Please fill all fields");
      return;
    }

    const startTimestamp = new Date(`${eventDate}T${eventTime}`).getTime();

    const endTimestamp =
      startTimestamp + DEFAULT_EVENT_DURATION_MIN * 60 * 1000;

    const newEvent = {
      id: Date.now().toString(),
      title: eventTitle,
      buildingId: selectedBuilding.id,
      startTime: startTimestamp,
      endTime: endTimestamp,
      color: eventColor,
      reminded: false,
    };

    setEvents((prev) => ({
      ...prev,
      [selectedBuilding.id]: [...(prev[selectedBuilding.id] || []), newEvent],
    }));

    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventColor("#1e90ff");
  };

  const zoomIn = () => {
    console.log("zoomIn called", scale);
    if (!containerRef.current) return;
    setIsAutoZoomed(false);
    
    const maxZoom = getMaxZoom();
    const newScale = Math.min(scale + ZOOM_STEP, maxZoom);
    const clamped = clampTranslate(translate.x, translate.y, newScale);
    
    console.log("New scale:", newScale);
    setScale(newScale);
    setTranslate(clamped);
  };

  const zoomOut = () => {
    console.log("zoomOut called", scale);
    if (!containerRef.current) return;
    setIsAutoZoomed(false);
    
    const minZoom = getMinZoom();
    const newScale = Math.max(scale - ZOOM_STEP, minZoom);
    const clamped = clampTranslate(translate.x, translate.y, newScale);
    
    console.log("New scale:", newScale);
    setScale(newScale);
    setTranslate(clamped);
  };

  const filteredBuildings = Object.values(BUILDING_META)
    .flatMap((group) =>
      Object.entries(group).map(([id, meta]) => ({
        id,
        ...meta,
      })),
    )
    .filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const resetView = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const minZoom = getMinZoom();

    const scaledW = MAP_WIDTH * minZoom;
    const scaledH = MAP_HEIGHT * minZoom;

    const centerX = (rect.width - scaledW) / 2;
    const centerY = (rect.height - scaledH) / 2;

    setScale(minZoom);
    setTranslate({
      x: centerX,
      y: centerY,
    });
  };


  const closeBuildingModal = () => {
    setShowBuildingModal(false);
    setIsAutoZoomed(false);
    resetView();
  };

  // Step 11A — calculateRoute (KEEP ONLY ONCE)
  const calculateRoute = (building) => {
    if (!userLocation) return;

    const startNode = getClosestPathNode(userLocation.x, userLocation.y);

    const endNode = building.pathNode;

    const pathNodes = findPath(startNode, endNode);

    if (pathNodes) {
      const pathCoordinates = [
        userLocation,
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
      setRoute(null);
    }
  };

  const handleMouseDown = (e) => {
    if (
      e.target.closest(
        ".search-bar, .location-toggle, .zoom-controls, .info-panel",
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
      const minX = rect.width - scaledW;
      const minY = rect.height - scaledH;
      const maxX = 0;
      const maxY = 0;

      return {
        x: Math.min(maxX, Math.max(minX, prev.x + dx)),
        y: Math.min(maxY, Math.max(minY, prev.y + dy)),
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
    setIsAutoZoomed(false);
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;

    setScale((prevScale) => {
      const min = getMinZoom();
      const max = getMaxZoom();
      const nextScale = Math.min(Math.max(prevScale + delta, min), max);

      setTranslate((prevTranslate) => {
        const pointX = (mouseX - prevTranslate.x) / prevScale;
        const pointY = (mouseY - prevTranslate.y) / prevScale;

        const newX = mouseX - pointX * nextScale;
        const newY = mouseY - pointY * nextScale;

        return clampTranslate(newX, newY, nextScale);
      });

      return nextScale;
    });
  };

  const zoomToBuilding = (bbox) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const targetScale = 2;

    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;

    setScale(targetScale);
    setTranslate(
      clampTranslate(
        rect.width / 2 - cx * targetScale,
        rect.height / 2 - cy * targetScale,
        targetScale,
      ),
    );
  };

  // Step 11B — focusBuilding (KEEP ONLY ONCE)
  const focusBuilding = (b) => {
    setSelectedBuilding(b);

    if (campusMode && userLocation) {
      calculateRoute(b);
      return;
    }

    setIsAutoZoomed(true); // 🔹 MARK AUTO ZOOM
    setShowBuildingModal(true);
    zoomToBuilding(b);
  };

  // 1. LOAD events when user logs in (ONE TIME ONLY)
  useEffect(() => {
    if (!user) return;

    const loadEvents = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists() && snap.data().events) {
        setEvents(snap.data().events);
      }
      setEventsLoaded(true);
    };

    loadEvents();
  }, [user]);

  // 2. SAVE events whenever they change (but only after initial load)
  useEffect(() => {
    if (!user || !eventsLoaded) return;

    const saveEvents = async () => {
      await setDoc(doc(db, "users", user.uid), { events }, { merge: true });
    };

    saveEvents();
  }, [events, user, eventsLoaded]);

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
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // Step 5.1 — SVG binding useEffect
  useEffect(() => {
    if (!svgRef.current) return;

    Object.values(BUILDING_META).forEach((group) => {
      Object.entries(group).forEach(([id, meta]) => {
        const el = svgRef.current.getElementById(id);
        if (!el) return;

        const bbox = el.getBBox();

        if (selectedBuilding?.id === id) {
          el.style.stroke = "#1e90ff";
          el.style.strokeWidth = "4";
        } else {
          el.style.stroke = "";
          el.style.strokeWidth = "";
        }

        el.onclick = () => {
          focusBuilding({ id, ...meta, ...bbox });
        };

        el.onmouseenter = () => {
          el.style.filter = "drop-shadow(0 0 6px rgba(0,140,255,0.8))";
          el.style.strokeWidth = "3";
          setHoveredBuilding({ id, ...meta, ...bbox });
        };

        el.onmouseleave = () => {
          el.style.filter = "none";
          el.style.strokeWidth = "1";
          setHoveredBuilding(null);
        };

        el.style.cursor = placingLocation ? "default" : "pointer";
      });
    });
  }, [placingLocation, selectedBuilding]);

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
          backgroundColor: "#ffffff",
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

        {/* Location Toggle */}
        <div
          className="location-toggle"
          style={{
            position: "absolute",
            bottom: 20,
            top: "auto",
            right: 80,
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
            ref={svgRef}
            viewBox="0 0 4029 2090"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            <g id="North Campus">
              <rect id="Background" width="4029" height="2090" fill="white" />

              <g id="Buildings">
                <g id="Faculty_Area">
                  <path
                    id="faculty_area4"
                    d="M424 1231.5L170.5 1159H120V1207L152.5 1253L170.5 1345L392 1401.5L599 1429L627 1487.5L682 1601L792.5 1759L1097 1824L1262.5 1777L1374.5 1702.5L1642 1759L1968.5 1777L2136.5 1759L2196 1719L2164.5 1682.5V1631L2136.5 1609.5L2111.5 1576.5L2043.5 1609.5L1894 1601L1731.5 1558L1406.5 1487.5H1223L1017 1429L751.5 1401.5L599 1297.5L424 1231.5Z"
                    fill="#F7FB1E"
                    stroke="black"
                  />
                  <path
                    id="faculty_area3"
                    d="M2369 1259L2195 1267.5L2186 1299.5L2163.5 1343.5L2158.5 1383L2156 1440L2140 1470.5L2149.5 1491.5L2265.5 1431.5H2306.5L2409 1420L2505.5 1350L2600 1330L2720 1311.5H2778.5L2825.5 1314L2865.5 1319.5L2886.5 1325L2905.5 1337L2969 1373L3016.5 1405.5L3147 1396L3136.5 1373L3125 1350L3105.5 1320L3085 1299.5L2977 1213.5L2969 1216.5L2894.5 1183.5L2873.5 1178.5L2806.5 1187.5H2758.5L2710 1178.5L2704 1187.5L2635 1195.5L2573 1216.5L2527 1227H2480.5L2443 1243L2380.5 1250.5L2369 1259Z"
                    fill="#F7FB1E"
                    stroke="black"
                  />
                  <path
                    id="faculty_area2"
                    d="M518.5 1155L489.5 1189.5V1213.5H518.5L671.5 1266.5L789.5 1352.5L1047 1374.5L1234 1407L1424 1422.5L1539 1436.5L1667.5 1474L1837.5 1513.5H1880L1978 1525.5L2039.5 1513.5L2079 1496.5L2123.5 1474L2141 1448.5V1407L2151 1340.5L2173.5 1294V1253L2065.5 1237.5H2039.5L1796 1189.5H1719L1693.5 1175.5H1609.5L1462 1163.5L1316 1155L1251 1131L1180.5 1115.5L1124 1095L1079.5 1085H1021L908 1105.5L699 1115.5L587.5 1131L518.5 1155Z"
                    fill="#F7FB1E"
                    stroke="black"
                  />
                  <g id="faculty_area1">
                    <path
                      d="M2220.5 1638.5L2188 1546.5L2177.25 1540.75L2166.5 1521.5L2257 1475.5L2400.5 1464L2511.5 1397L2653.5 1360.5L2776 1351L2912 1370.5L3036.5 1449L3172.5 1429.5L3299 1531L3261 1560H3193.5L3105.5 1571.5L3006 1617.5L2912 1560L2795 1506.5L2663 1521.5L2444.5 1571.5L2257 1675L2220.5 1638.5Z"
                      fill="#F7FB1E"
                    />
                    <path
                      d="M2188 1560L2177.25 1540.75M2177.25 1540.75L2166.5 1521.5L2257 1475.5L2400.5 1464L2511.5 1397L2653.5 1360.5L2776 1351L2912 1370.5L3036.5 1449L3172.5 1429.5L3299 1531L3261 1560H3193.5L3105.5 1571.5L3006 1617.5L2912 1560L2795 1506.5L2663 1521.5L2444.5 1571.5L2257 1675L2220.5 1638.5L2188 1546.5L2177.25 1540.75Z"
                      fill="none"
                      stroke="black"
                    />
                  </g>
                </g>

                <g id="Girls_Hostel">
                  <path
                    id="B16"
                    d="M2257.5 1115.5L2128.5 1070.5V1164H2257.5H2363.5L2341 1093L2257.5 1115.5Z"
                    fill="#F119D1"
                    stroke="black"
                  />
                  <path
                    id="B21"
                    d="M2804.5 855L2595.5 900V951.5L2721 935.5L2827 951.5V900L2804.5 855Z"
                    fill="#F119D1"
                    stroke="black"
                  />
                  <path
                    id="B22"
                    d="M2901 977L2701.5 1032V1119L2930 1032L2901 977Z"
                    fill="#F119D1"
                    stroke="black"
                  />
                  <path
                    id="B20"
                    d="M2618 1054.5C2549.33 1067.33 2408.8 1094.3 2396 1099.5V1170.5L2647 1144.5L2618 1054.5Z"
                    fill="#F119D1"
                    stroke="black"
                  />
                </g>

                <g id="Boys_Hostel">
                  <path
                    id="B8"
                    d="M1723 1009.5H1601V1106L1771.5 1080L1861.5 993.5L1807 945L1723 1009.5Z"
                    fill="#302CFF"
                    stroke="black"
                  />
                  <path
                    id="B15"
                    d="M2293 678L2070.5 652V729.5H2190H2293V678Z"
                    fill="#302CFF"
                    stroke="black"
                  />
                  <path
                    id="B10"
                    d="M1369 736H1098.5V835.5L1369 816.5V736Z"
                    fill="#302CFF"
                    stroke="black"
                  />
                  <path
                    id="B12"
                    d="M1678 707L1427 732.5V813L1678 784V707Z"
                    fill="#302CFF"
                    stroke="black"
                  />
                  <path
                    id="B26"
                    d="M709 716.5L403.5 822.5L464.5 922.5L751 806.5H1073L1060 716.5H709Z"
                    fill="#302CFF"
                    stroke="black"
                  />
                  <path
                    id="B18"
                    d="M1996.5 639L1749 668V745.5H1996.5V639Z"
                    fill="#302CFF"
                    stroke="black"
                  />
                  <path
                    id="B14"
                    d="M2730.5 681H2515L2508.5 742L2634 726L2746.5 758.5L2730.5 681Z"
                    fill="#302CFF"
                    stroke="black"
                  />
                  <path
                    id="B13"
                    d="M3010.5 819.5L2837 694L2788.5 771L2991.5 864.5L3010.5 819.5Z"
                    fill="#302CFF"
                    stroke="black"
                  />
                  <path
                    id="B23"
                    d="M2405.5 938.5L2283 964.5L2289.5 868L2534 884L2518 964.5L2405.5 938.5Z"
                    fill="#302CFF"
                    stroke="black"
                  />
                  <path
                    id="B19"
                    d="M2051.5 874L1935.5 942L1890.5 874L2051.5 797L2228.5 848.5L2190 925.5L2051.5 874Z"
                    fill="#302CFF"
                    stroke="black"
                  />
                  <path
                    id="B11"
                    d="M1794 855L1530 961L1504 887L1658.5 839L1765 781L1794 855Z"
                    fill="#302CFF"
                    stroke="black"
                  />
                  <path
                    id="B17"
                    d="M957 948H1073V1009.5L851 1028.5L873.5 948H957Z"
                    fill="#302CFF"
                    stroke="black"
                  />
                  <path
                    id="B9"
                    d="M1436.5 999.5H1304.5V1070.5H1436.5L1552.5 1090V999.5H1436.5Z"
                    fill="#302CFF"
                    stroke="black"
                  />
                  <path
                    id="B24"
                    d="M809 932L519 954.5V1064L809 1041.5V932Z"
                    fill="#1621FA"
                    stroke="black"
                  />
                </g>

                <g id="Academic_Block">
                  <path
                    id="Central_Library"
                    d="M1675 513C1675 558.84 1637.84 596 1592 596C1546.16 596 1509 558.84 1509 513C1509 467.16 1546.16 430 1592 430C1637.84 430 1675 467.16 1675 513Z"
                    fill="#FF8D28"
                  />
                  <path
                    id="A14"
                    d="M2300.5 286L1741.5 341.5L1774 486.5L2321.5 426L2300.5 286Z"
                    fill="#FA3232"
                    stroke="black"
                  />
                  <path
                    id="A9"
                    d="M3294 460C3294 521.856 3243.86 572 3182 572C3120.14 572 3070 521.856 3070 460C3070 398.144 3120.14 348 3182 348C3243.86 348 3294 398.144 3294 460Z"
                    fill="#D9D9D9"
                  />
                  <path
                    id="A13"
                    d="M2280 464.5L1719 531.5V587L2292 531.5L2280 464.5Z"
                    fill="#D91616"
                    stroke="black"
                  />
                  <path
                    id="A10"
                    d="M3130.5 598.5L2462.5 472.5V538L3130.5 657V598.5Z"
                    fill="#E10202"
                    stroke="black"
                  />
                  <path
                    id="A11"
                    d="M2362.5 365.5L2398.5 241L3027 408.5L2997.5 522.5L2362.5 365.5Z"
                    fill="#E62525"
                    stroke="black"
                  />
                  <rect
                    id="A17"
                    x="880"
                    y="523"
                    width="528"
                    height="164"
                    fill="#EE1616"
                  />
                  <g id="A18">
                    <rect
                      x="880"
                      y="315"
                      width="556"
                      height="166"
                      fill="#D9D9D9"
                    />
                    <rect
                      x="880"
                      y="315"
                      width="556"
                      height="166"
                      fill="#F01414"
                    />
                  </g>
                </g>

                <g id="Mess">
                  <path
                    id="Oak_Mess"
                    d="M1279 959.5C1279 1008.38 1239.38 1048 1190.5 1048C1141.62 1048 1102 1008.38 1102 959.5C1102 910.623 1141.62 871 1190.5 871C1239.38 871 1279 910.623 1279 959.5Z"
                    fill="#0FF307"
                  />
                  <path
                    id="Pine_Mess"
                    d="M2482 761C2482 805.183 2446.18 841 2402 841C2357.82 841 2322 805.183 2322 761C2322 716.817 2357.82 681 2402 681C2446.18 681 2482 716.817 2482 761Z"
                    fill="#0FF307"
                  />
                  <path
                    id="Tulsi_Mess"
                    d="M2429 526C2429 559.689 2401.69 587 2368 587C2334.31 587 2307 559.689 2307 526C2307 492.311 2334.31 465 2368 465C2401.69 465 2429 492.311 2429 526Z"
                    fill="#0FF307"
                  />
                  <path
                    id="Peepal_Mess"
                    d="M458 1006.5L255.5 977.5V1039H207L181.5 1106.5L435.5 1183.5L451.5 1142V1106.5L435.5 1090.5L458 1006.5Z"
                    fill="#0FF307"
                    stroke="black"
                  />
                  <path
                    id="A19"
                    d="M793 529C793 573.183 757.183 609 713 609C668.817 609 633 573.183 633 529C633 484.817 668.817 449 713 449C757.183 449 793 484.817 793 529Z"
                    fill="#D9D9D9"
                  />
                </g>

                <g id="Village_Square">
                  <path
                    id="Sports_Complex"
                    d="M3171 1043.5L3032.5 950.5L3071.5 892L3047.5 811.5L3108.5 796.5V768.5L3277 738L3296.5 833.5V861.5L3318.5 931L3257.5 950.5V967.5L3225 1015.5L3201.5 1002.5L3171 1043.5Z"
                    fill="#D9D9D9"
                    stroke="black"
                  />
                  <path
                    id="CV_Raman_Guest_House"
                    d="M3182 1132L3164.5 1061L3128 1056.5L3086.5 1061L3060.5 1045.5H3013V1061V1115L3028 1151.5V1193L3086.5 1182L3112.5 1221L3138.5 1268.5L3164.5 1314L3199 1333.5L3240.5 1370.5L3288 1390L3340 1407.5H3379V1362V1314H3355L3277 1281.5L3231.5 1232L3199 1193L3182 1132Z"
                    fill="#D9D9D9"
                    stroke="black"
                  />
                  <path
                    id="Audi"
                    d="M3502.5 892L3439.5 972L3489.5 1037L3439.5 1089V1171H3459L3502.5 1219L3403 1294.5L3459 1398.5L3528.5 1366L3628 1232L3708 1171L3680 1089L3604 1037L3589 972L3502.5 892Z"
                    fill="#D9D9D9"
                    stroke="black"
                  />
                  <path
                    id="Health_Centre"
                    d="M3383.5 937.5H3346.5L3305.5 740.5L3405 712L3519.5 755.5L3446 937.5L3416 959L3383.5 937.5Z"
                    fill="#D9D9D9"
                    stroke="black"
                  />
                </g>
              </g>

              <g id="Roads">
                <path
                  id="roads"
                  d="M158.5 1112.5L326.5 1161.5L464.5 1205.5M464.5 1205.5L480 1214L544.5 1232L651 1275.5L772.5 1359.5L962 1384.5L1073 1395.5L1235 1434L1483.5 1451L1828.5 1529.5L2039 1565.5L2145.5 1519M464.5 1205.5L475.25 1077.5M2145.5 1519L2243 1702M2145.5 1519L2260 1453L2388 1442.5L2507 1374L2702.5 1334H2851.5L2945 1374L3036.5 1429.5L3177 1410.5M2145.5 1519L2126.5 1484L2145.5 1447V1412L2154.5 1366L2163 1334L2176.5 1298L2182 1278.5L2198 1244.5M2243 1702L2449.5 1597.5L2730.5 1551L2962 1623L3011 1640L3139 1597.5L3302.5 1565.5L3338.5 1551M2243 1702L2198 1766L1908.5 1802.5L1394 1766L1125 1856.5H109M3338.5 1551L3317.5 1508M3338.5 1551L3771 1193.5L3571.5 698M3317.5 1508L3177 1410.5M3317.5 1508L3422 1421L3384.5 1299.5M3177 1410.5L3096 1272L3011 1210.5M3011 1210.5L2962 1193.5M3011 1210.5L2986.5 1043M2962 1193.5V1023.5M2962 1193.5L2866 1156L2763.5 1149L2198 1244.5M2962 1023.5L2986.5 1043M2962 1023.5L2971 941M2986.5 1043L3077 1001.5L3202.5 1073.5M2198 1244.5L2107 1222.5M3571.5 698L3492.5 876.5L3469.5 922.5L3449.5 946.5L3401 1012M3571.5 698L3140.5 720H3011M3401 1012L3338.5 967L3252 1023.5L3202.5 1073.5M3401 1012L3422 1068L3416.5 1172.5L3449.5 1239L3384.5 1299.5M3202.5 1073.5V1156L3264.5 1239L3331 1283L3384.5 1299.5M3011 720L2778 654.5H2472M3011 720L3036.5 839.5L2971 941M2971 941L2763.5 982L2648 1001.5M2971 941L2749.5 811L2517.5 828M2648 1001.5L2388 1030.5L2118 1023.5M2648 1001.5L2560 922.5L2517.5 828M2118 1023.5L2107 1222.5M2118 1023.5L1908.5 1001.5M2118 1023.5L2198 961.5L2243 849.5M2107 1222.5L1828.5 1162.5M1908.5 1001.5L1819.5 913.5M1908.5 1001.5L1828.5 1162.5M1819.5 913.5L1883.5 792.5M1819.5 913.5L1500 984L1370.5 969V880M1883.5 792.5L2039 764L2260 777.5M1883.5 792.5L1723.5 764L1638 828L1370.5 880M2260 777.5L2243 849.5M2260 777.5L2309 728.5L2320.5 654.5M2243 849.5L2494 865L2517.5 828M2517.5 828L2472 654.5M2320.5 654.5H2472M2320.5 654.5L2029.5 597.5L1698.5 654.5M1698.5 654.5L1447.5 697.364M1698.5 654.5L1684 518L2320.5 447L2378.5 410L2986.5 544.5M1394 706.5L1376.19 838M1394 706.5H1086M1394 706.5L1447.5 697.364M1370.5 880L1221 854.5M1370.5 880L1376.19 838M1221 854.5L1086 880V1066.5M1221 854.5L1376.19 838M1221 854.5L1086 840.578M1086 1066.5H943.5L608.5 1098.5L475.25 1077.5M1086 1066.5L1301.5 1120.5L1564 1144L1828.5 1162.5M475.25 1077.5L486 961.5L758.5 854.5L1061 838L1086 840.578M360 984L344.5 807.5L699.5 676.5L876 706.5H1086M1086 706.5V840.578M1447.5 697.364V507H922.5"
                  fill="none"
                  stroke="#D7ACAC"
                  strokeWidth="15"
                  vectorEffect="non-scaling-stroke"
                />
              </g>

              <g id="Open_spaces">
                <g id="open_spaces1">
                  <path
                    d="M2092 1054L1924 1034.5L1882 1145.5L2077.5 1180L2092 1054Z"
                    fill="#A0FF9D"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M2050 908.5L1951.5 975L2104.5 995L2161.5 945.5L2050 908.5Z"
                    fill="#A0FF9D"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M2391 960.5L2312 995H2480L2495 975L2391 960.5Z"
                    fill="#A0FF9D"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M2925 1054L2823.5 1116L2940 1145.5L2925 1054Z"
                    fill="#A0FF9D"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M893.5 878.5L849 908.5L1054 928V878.5H893.5Z"
                    fill="#A0FF9D"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M3330.5 1017L3234 1103.5L3276 1197.5L3370 1259.5L3414.5 1232L3389.5 1180V1103.5L3370 1034.5L3330.5 1017Z"
                    fill="#A0FF9D"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M2092 1054L1924 1034.5L1882 1145.5L2077.5 1180L2092 1054Z"
                    fill="none"
                    stroke="#D7ACAC"
                  />
                  <path
                    d="M2050 908.5L1951.5 975L2104.5 995L2161.5 945.5L2050 908.5Z"
                    fill="none"
                    stroke="#D7ACAC"
                  />
                  <path
                    d="M2391 960.5L2312 995H2480L2495 975L2391 960.5Z"
                    fill="none"
                    stroke="#D7ACAC"
                  />
                  <path
                    d="M2925 1054L2823.5 1116L2940 1145.5L2925 1054Z"
                    fill="none"
                    stroke="#D7ACAC"
                  />
                  <path
                    d="M893.5 878.5L849 908.5L1054 928V878.5H893.5Z"
                    fill="none"
                    stroke="#D7ACAC"
                  />
                  <path
                    d="M3330.5 1017L3234 1103.5L3276 1197.5L3370 1259.5L3414.5 1232L3389.5 1180V1103.5L3370 1034.5L3330.5 1017Z"
                    fill="none"
                    stroke="#D7ACAC"
                  />
                </g>
                <path
                  id="open_spaces2"
                  d="M577.5 1449L159 1370L118 1823.5H812L859 1800.5L782.5 1785.5L577.5 1449Z"
                  fill="#A0FF9D"
                  fillOpacity="0.2"
                  stroke="#D7ACAC"
                />
                <path
                  id="open_spaces3"
                  d="M314 741V931.5H200.5L232 682L350 432.5L786 292V432.5H577L613.5 641.5L314 741Z"
                  fill="#A0FF9D"
                  fillOpacity="0.2"
                  stroke="#D7ACAC"
                />
                <g id="open_spaces4">
                  <path
                    d="M3177.5 609.5L3304.5 555L3328.51 423.5L3336 382.5L3348.26 364.5L3368 305.5L3567.5 555H3708L3939.5 927L3812.5 1131.5L3599.5 636.5L3177.5 659.5V609.5Z"
                    fill="#A0FF9D"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M3328.51 423.5L3336 382.5L3348.26 364.5M3328.51 423.5L3304.5 555L3177.5 609.5V659.5L3599.5 636.5L3812.5 1131.5L3939.5 927L3708 555H3567.5L3368 305.5L3348.26 364.5M3328.51 423.5L3348.26 364.5"
                    fill="none"
                    stroke="#D7ACAC"
                  />
                </g>
              </g>
            </g>

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

            {/* Buildings */}

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

        {hoveredBuilding && (
          <div
            style={{
              position: "fixed", // ✅ Changed from absolute to fixed
              left: "50%",
              top: "20%",
              transform: "translateX(-50%)",
              backgroundColor: "#1f2937",
              color: "white",
              padding: "12px 20px",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 500,
              pointerEvents: "none",
              opacity: 0.95,
              whiteSpace: "nowrap",
              zIndex: 9999,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            {hoveredBuilding.name}
          </div>
        )}

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
        <div className="modal-overlay" onClick={closeBuildingModal}>
          <div
            className="modal-fullscreen"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <h1>{selectedBuilding.name}</h1>
              <button className="modal-close" onClick={closeBuildingModal}>
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
                                  .split("T")[0],
                              );
                              setEventTime(
                                new Date(evt.startTime)
                                  .toTimeString()
                                  .slice(0, 5),
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

                      <button
                        className="save-btn"
                        onClick={() => {
                          if (!eventTitle || !eventDate || !eventTime) {
                            alert("Please fill all fields");
                            return;
                          }

                          const startTime = new Date(
                            `${eventDate}T${eventTime}`,
                          ).getTime();

                          const endTime =
                            startTime + DEFAULT_EVENT_DURATION_MIN * 60 * 1000;

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
                                        reminded: false, // reset reminder
                                      }
                                    : e,
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
                        }}
                      >
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
