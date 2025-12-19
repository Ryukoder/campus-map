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
    <div className="login-page">
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>

      <div className="login-card">
        <h1 className="login-title">Select Campus</h1>

        <button
          className="login-button"
          onClick={() => navigate("/north-campus")}
        >
          North Campus
        </button>

        <button className="login-button">South Campus</button>
      </div>
    </div>
  );
};

export default Dashboard;
