import React, { useState } from "react";
import "./LoginScreen.css";
import logo from "../logo.png";
import SignupScreen from "./SignupScreen";

function LoginScreen() {
  const [signIn, setSignIn] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleGetStarted = (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter a valid email to get started.");
      return;
    }
    setEmailError("");
    setSignIn(true);
  };

  return (
    <div className="loginScreen">
      <div className="loginScreen__background">
        <img className="loginScreen__logo" src={logo} alt="Aflixs logo" />
      </div>
      <button className="loginScreen__button" onClick={() => setSignIn(true)}>
        Sign-In
      </button>
      <div className="gradient"></div>

      <div className="loginScreen__body">
        {signIn ? (
          <SignupScreen initialEmail={email.trim()} />
        ) : (
          <>
            <h1>Films, TV Shows and more.</h1>
            <h2>Watch and Chill Anytime Anywhere</h2>
            <h3>Drop your email below to get started.</h3>
            <div className="loginScreen__input">
              <form onSubmit={handleGetStarted} noValidate>
                <input
                  type="email"
                  placeholder="Email Address"
                  aria-label="Email address"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(emailError)}
                />
                <button
                  className="getStarted__button"
                  type="submit"
                >
                  {" "}
                  GET STARTED
                </button>
              </form>
              {emailError && (
                <p className="loginScreen__error" role="alert">
                  {emailError}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LoginScreen;
