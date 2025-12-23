import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import NorthCampus from "./pages/NorthCampus";

function App() {
  return (
    // MAIN CONTAINER: Forces the app to be exactly the size of the screen
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      {/* LAYER 1: BACKGROUND IMAGE (Stuck to the back) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/3/34/North_Campus,_IIT_Mandi_from_Griffon_Peak_Jan_2020_D35_0117.jpg" 
          alt="Background" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Blue Tint */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(30, 58, 138, 0.4)', backdropFilter: 'blur(2px)' }}></div>
      </div>

      {/* LAYER 2: CONTENT (Stuck to the front) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/north-campus" element={<ProtectedRoute><NorthCampus /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </div>

    </div>
  );
}

export default App;