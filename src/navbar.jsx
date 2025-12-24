import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

export default function Navbar() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const location = useLocation(); // Tracks which page the user is on

  const authPages = ["/", "/signup"];
  if (authPages.includes(location.pathname)) {
    return null; 
  }
  
  const navStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center", 
    backgroundColor: "#e0e0e0", 
    height: isCollapsed? "12.5vh" : "65vh", // 🎯 Dynamic Height
    width: isCollapsed? "70px" : "230px", 
    position: "fixed",
    top: "12px",  // Gives it a floating look
    left: "12px", 
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", // Smoother animation
    overflow: "hidden",
    zIndex: 1000,
    borderRadius: "16px", 
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    padding: "10px 0"
  };

  const linkStyle = {
    color: "black",
    padding: "10px",
    textDecoration: "none",
    fontSize: "17.6px",
    textAlign: "center", 
    width: "85%",
    display: "flex",
    justifyContent: "center", 
    alignItems: "center",
    whiteSpace: "nowrap",
    borderRadius: "10px",
    margin: "4px 0",
    transition: "background 0.2s"
  };

  return (
    <div style={navStyle}>
      {/* Toggle Button: Centralized icons */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{ 
          background: "#383838", 
          border: "none", 
          color: "white", 
          padding: "10px", 
          margin: "5px 0 15px 0",
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "1.3rem",
          width: "50px",
          height: "50px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        {isCollapsed? "☰" : "☰"} 
      </button>

      {/* IIT Mandi Text: Hidden when minimized to fit 20vh */}
      {!isCollapsed && (
        <h2 style={{ color: '#f1c40f', fontSize: '1.2rem', marginBottom: '15px', fontWeight: 'bold' }}>
          IIT MANDI MAP
        </h2>
      )}

      {/* Links: Only top 2 icons show when minimized to fit into 20vh height */}
      <Link to="/dashboard" style={linkStyle} className="nav-link">
        {isCollapsed? "" : "Dashboard"}
      </Link>
      
      <Link to="/north-campus" style={linkStyle} className="nav-link">
        {isCollapsed? "" : "North Campus"}
      </Link>

      {/* These extra links only show when expanded (65vh) */}
      {!isCollapsed && (
        <>
          <Link to="/south-campus" style={linkStyle} className="nav-link">South Campus</Link>
          <Link to="/bus-tracker" style={linkStyle} className="nav-link">Bus Tracking</Link>
          
          <div style={{ flex: 1 }}></div> {/* Pushes Logout to the bottom of 65vh */}

          <Link to="/logout" style={{...linkStyle, backgroundColor: "#c0392b", marginBottom: "10px" }}>
            Logout
          </Link>
        </>
      )}
    </div>
  );
}