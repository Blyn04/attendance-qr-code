import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../config/FirebaseConfig";
import "../styles/Login.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import jpcsLogo from "../assets/jpcs.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (/\s/.test(trimmedEmail) || /\s/.test(trimmedPassword)) {
      setError("Email and password must not contain spaces.");
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
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

  const handleReset = async (e) => {
    e.preventDefault();
    setResetMessage("");

    const trimmedResetEmail = resetEmail.trim();

    if (!trimmedResetEmail) {
      setResetMessage("Please enter your email.");
      return;
    }

    if (/\s/.test(trimmedResetEmail)) {
      setResetMessage("Email must not contain spaces.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, trimmedResetEmail);
      setResetMessage("Password reset email sent!");

    } catch (error) {
      setResetMessage("Error: " + error.message);
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
          onChange={(e) =>
            setEmail(e.target.value.replace(/\s/g, ""))
          }
          disabled={loading}
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            required
            onChange={(e) =>
              setPassword(e.target.value.replace(/\s/g, ""))
            }
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

        <div className="forgot-password">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setModalOpen(true);
            }}
          >
            Forgot Password?
          </a>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reset Password</h3>
            <form onSubmit={handleReset}>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) =>
                  setResetEmail(e.target.value.replace(/\s/g, ""))
                }
                required
              />
              <button type="submit">Send Reset Email</button>
              {resetMessage && (
                <p className="reset-message">{resetMessage}</p>
              )}
              <button
                type="button"
                className="close-modal"
                onClick={() => {
                  setModalOpen(false);
                  setResetEmail("");
                  setResetMessage("");
                }}
              >
                Close
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
