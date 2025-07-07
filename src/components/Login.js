import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/FirebaseConfig";
import "../styles/Login.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import jpcsLogo from "../assets/jpcs.png"; 

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");

    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with that email.");
          break;

        case "auth/wrong-password":
          setError("Incorrect password. Please try again.");
          break;

        case "auth/invalid-email":
          setError("Invalid email format.");
          break;

        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again later.");
          break;

        default:
          setError("Login failed: " + err.message);
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {loading && (
        <div className="loader-overlay">
          <div className="loader" />
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="logo-container">
          <img src={jpcsLogo} alt="JPCS Logo" className="jpcs-logo" />
        </div>

        <h2 className="login-title">Login</h2>

        {error && <p className="error-text">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword((prev) => !prev)}
            role="button"
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </span>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
};

export default Login;
