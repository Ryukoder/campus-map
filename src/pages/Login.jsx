import { useState } from "react";
import "../styles/auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState("");

  const handleLogin = () => {
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Remember me:", rememberMe);
    alert("Login Button Clicked");
  };

  const handleForgotPassword = () => {
    if (!email) {
      alert("Please Enter Your Email First!");
      return;
    }

    alert(`Password reset link will be sent to ${email}`);
  };

  return (
    <div className="auth-container">
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="auth-row">
        <label className="remember">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember me
        </label>

        <span className="forgot" onClick={handleForgotPassword}>
          Forgot password?
        </span>
      </div>

      <button onClick={handleLogin}>Login</button>

      <p className="link-text">
        Don’t have an account? <span>Signup</span>
      </p>
    </div>
  );
};

export default Login;
