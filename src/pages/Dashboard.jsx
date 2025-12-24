import React from "react"; // Ensure React is imported
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* Background Image Wrapper */}
      <div className="dashboard-background"></div>
      
      {/* Dark Overlay for readability */}
      <div className="dashboard-overlay"></div>

      {/* Logout Button (Top Right) */}
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>

      {/* Main Glass Card */}
      <div className="dashboard-card">
        <h1 className="dashboard-title">Select Campus</h1>

        <div className="button-group">
          <button
            className="campus-btn primary-btn"
            onClick={() => navigate("/north-campus")}
          >
            North Campus
          </button>

          <button className="campus-btn secondary-btn">
            South Campus
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;