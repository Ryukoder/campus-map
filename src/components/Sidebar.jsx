import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase"; // ADD THIS IMPORT
import { signOut } from "firebase/auth"; // ADD THIS IMPORT

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const authPages = ["/", "/signup", "/login"];
  if (authPages.includes(location.pathname)) {
    return null;
  }

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Please try again.");
    }
  };

  return (
    <>
      {/* 1. TOGGLE BUTTON - Dark Theme */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed top-4 left-4 z-50 p-2.5 rounded-xl shadow-lg border-2 transition-all duration-300
          ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}
          bg-black/70 backdrop-blur-md border-white/15 hover:bg-black/85 hover:border-white/25`}
        style={{
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* 2. BACKDROP */}
      <div
        className={`fixed inset-0 bg-black/75 backdrop-blur-md z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* 3. SIDEBAR PANEL - Dark Theme */}
      <div
        className={`fixed top-0 left-0 h-full w-72 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(20px)",
          borderRight: "2px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Header - Dark */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{
            borderColor: "rgba(255, 255, 255, 0.1)",
            background: "rgba(255, 255, 255, 0.05)",
          }}
        >
          <h2 className="text-xl font-bold tracking-tight text-white">
            IIT MANDI MAP
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Menu Items - Dark */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          <SidebarItem
            label="🏠 Dashboard"
            onClick={() => handleNavigation("/dashboard")}
          />
          <SidebarItem
            label="🏛️ North Campus"
            onClick={() => handleNavigation("/north-campus")}
          />
          <SidebarItem
            label="🏫 South Campus"
            onClick={() => alert("South Campus Map Coming Soon!")}
          />

          <button
            onClick={() => {
              window.open(
                "https://oas.iitmandi.ac.in/instituteprocess/common/login.aspx",
                "_blank"
              );
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-gray-300 hover:text-white font-medium rounded-lg transition-all flex items-center"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
          >
            🚌 Bus Tracking
          </button>
        </nav>

        {/* Footer / Logout - Dark Red Theme */}
        <div
          className="p-6 border-t"
          style={{
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 px-4 text-white rounded-lg font-medium transition-all shadow-lg"
            style={{
              background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
              border: "2px solid rgba(255, 255, 255, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(220, 38, 38, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
            }}
          >
            🚪 Log Out
          </button>
        </div>
      </div>
    </>
  );
};

// Helper for menu items - Dark Theme
const SidebarItem = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left px-4 py-3 text-gray-300 hover:text-white font-medium rounded-lg transition-all"
    style={{
      background: "rgba(255, 255, 255, 0.05)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
    }}
  >
    {label}
  </button>
);

export default Sidebar;
