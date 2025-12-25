import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // To check which page we are on

  // --- LOGIC FROM YOUR OLD NAVBAR ---
  // If we are on Login ("/") or Signup, DO NOT show the sidebar
  const authPages = ["/", "/signup", "/login"];
  if (authPages.includes(location.pathname)) {
    return null; // Render nothing
  }
  // ----------------------------------

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    // Navigate to login (add your auth logout logic here later if needed)
    navigate('/'); 
  };

  return (
    <>
      {/* 1. TOGGLE BUTTON (Only visible when sidebar is closed) */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed top-4 left-4 z-50 p-2.5 rounded-md shadow-md border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300
          ${isOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* 2. BACKDROP (Dark overlay) */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      {/* 3. SIDEBAR PANEL */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">IIT MANDI MAP</h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          <SidebarItem label="Dashboard" onClick={() => handleNavigation('/dashboard')} />
          <SidebarItem label="North Campus" onClick={() => handleNavigation('/north-campus')} />
          <SidebarItem label="South Campus" onClick={() => alert("South Campus Map Coming Soon!")} />
          
          {/* External Link Logic */}
          <button 
            onClick={() => {
                window.open("https://oas.iitmandi.ac.in/instituteprocess/common/login.aspx", "_blank");
                setIsOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-black font-medium rounded-lg transition-colors flex items-center"
          >
            Bus Tracking
          </button>
        </nav>

        {/* Footer / Logout */}
        <div className="p-6 border-t border-gray-100">
  <button 
    type="button"  
    onClick={(e) => {
      e.preventDefault(); 
      handleLogout();
    }}
    className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors shadow-sm"
  >
    Log Out
  </button>
</div>
      </div>
    </>
  );
};

// Helper for clean buttons
const SidebarItem = ({ label, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-black font-medium rounded-lg transition-colors"
  >
    {label}
  </button>
);

export default Sidebar;