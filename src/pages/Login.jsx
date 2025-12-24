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
    if (!email) {
      setError("Please enter your email first to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError("Password reset link sent! Check your email inbox.");
    } catch (err) {
      setError("Error: " + err.message);
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
          width: "100%",
          maxWidth: "400px",
          overflow: "hidden",
          position: "relative", // Ensure it sits above overlay
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
                onClick={handleForgotPassword}
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

            {error && <p className="error-text">{error}</p>}

            {/* Sign In Button - CHANGED FROM BLUE TO BLACK */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                backgroundColor: "#222", // BLACK
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
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#000")} // Darker black on hover
              onMouseOut={(e) => (e.target.style.backgroundColor = "#222")}
            >
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
    </div>
  );
};

export default Login;
