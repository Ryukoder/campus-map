import { useState } from "react";
import "../styles/Auth.css";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Remember Me:", rememberMe);

    alert("Login clicked (Firebase logic will come here)");
  };

  const handleForgotPassword = () => {
    if (!email) {
      alert("Please enter your email first");
      return;
    }

    alert(`Password reset link will be sent to ${email}`);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Login</h1>

        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="login-options">
          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>

          <span className="forgot-password" onClick={handleForgotPassword}>
            Forgot password
          </span>
        </div>

        <button className="login-button" onClick={handleLogin}>
          Sign In
        </button>

        <p className="signup-text">
          Don&apos;t have account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
