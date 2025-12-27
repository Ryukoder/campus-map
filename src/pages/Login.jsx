import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import "../styles/Auth.css"; // Ensure CSS is imported

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (!userCredential.user.emailVerified) {
        setError("Please verify your email before logging in");
        setLoading(false);
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setResetMessage("");

    if (!resetEmail) {
      setResetMessage("⚠️ Please enter your email address");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("✅ Password reset link sent! Check your email inbox.");
    } catch (err) {
      setResetMessage("❌ Error: " + err.message);
    }
  };

  return (
    // 1. Added className="login-page" to load the Mountain Background from Auth.css
    <div
      className="login-page"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        position: "relative",
        zIndex: 20,
      }}
    >
      {/* 2. THE CARD */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "20px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          width: "90%", // Changed from 100%
          maxWidth: "400px",
          overflow: "hidden",
          position: "relative",
          zIndex: 30,
        }}
        className="animate-fade-in-up"
      >
        {/* HEADER SECTION - CHANGED FROM BLUE TO BLACK */}
        <div
          style={{
            backgroundColor: "#222",
            padding: "40px 30px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              color: "white",
              fontSize: "28px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            IIT MANDI MAP
          </h1>
          <p
            style={{
              color: "#ccc",
              fontSize: "12px",
              marginTop: "8px",
              textTransform: "uppercase",
            }}
          >
            Campus Navigation Portal
          </p>
        </div>

        {/* FORM SECTION */}
        <div style={{ padding: "30px" }}>
          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Email Input */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: "5px",
                }}
              >
                Institutional Email
              </label>
              <input
                type="email"
                placeholder="b23xxx@students.iitmandi.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  backgroundColor: "#f9f9f9",
                  fontSize: "16px",
                  color: "#333",
                }}
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: "5px",
                }}
              >
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  backgroundColor: "#f9f9f9",
                  fontSize: "16px",
                  color: "#333",
                }}
              />
            </div>

            {/* Options Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "14px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#555",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ marginRight: "8px" }}
                />
                Remember me
              </label>
              <span
                onClick={() => setShowForgotPassword(true)}
                style={{
                  color: "#000",
                  fontWeight: "bold",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Forgot password?
              </span>
            </div>

            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: error.includes("reset link sent")
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                  border: error.includes("reset link sent")
                    ? "2px solid rgba(16, 185, 129, 0.3)"
                    : "2px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "12px",
                  color: error.includes("reset link sent")
                    ? "#059669"
                    : "#dc2626",
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "10px",
                }}
              >
                {error}
              </div>
            )}

            {/* Sign In Button - CHANGED FROM BLUE TO BLACK */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                backgroundColor: loading ? "#555" : "#222",
                color: "white",
                fontWeight: "bold",
                padding: "16px",
                borderRadius: "12px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                fontSize: "16px",
                marginTop: "10px",
                transition: "background 0.3s",
                height: "56px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) =>
                !loading && (e.target.style.backgroundColor = "#000")
              }
              onMouseOut={(e) =>
                !loading && (e.target.style.backgroundColor = "#222")
              }
            >
              {loading && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    animation: "spin 1s linear infinite",
                    position: "absolute",
                    left: "20px",
                  }}
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="white"
                    strokeWidth="2"
                    strokeDasharray="10 28"
                    fill="none"
                  />
                </svg>
              )}
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: "25px",
              textAlign: "center",
              fontSize: "14px",
              color: "#666",
            }}
          >
            Don't have an account?{" "}
            <Link
              to="/signup"
              style={{
                color: "#000",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              Sign Up Now
            </Link>
          </div>
        </div>
      </div>
      {showForgotPassword && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowForgotPassword(false);
            setResetMessage("");
            setResetEmail("");
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "20px",
              padding: "32px",
              width: "90%",
              maxWidth: "400px",
              boxShadow: "0 32px 80px rgba(0, 0, 0, 0.5)",
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: "20px",
                fontSize: "22px",
                fontWeight: "700",
              }}
            >
              Reset Password
            </h2>

            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                backgroundColor: "#f9f9f9",
                fontSize: "16px",
                marginBottom: "16px",
              }}
            />

            {resetMessage && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: resetMessage.includes("✅")
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                  border: resetMessage.includes("✅")
                    ? "2px solid rgba(16, 185, 129, 0.3)"
                    : "2px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "12px",
                  color: resetMessage.includes("✅") ? "#059669" : "#dc2626",
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "16px",
                }}
              >
                {resetMessage}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetMessage("");
                  setResetEmail("");
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleForgotPassword}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#222",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
