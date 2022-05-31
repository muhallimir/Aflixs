import React, { useState } from "react";
import "./LoginScreen.css";
import logo from "../logo.png";
import SignupScreen from "./SignupScreen";

function LoginScreen() {
  const [signIn, setSignIn] = useState(false);

  return (
    <div className="loginScreen">
      <div className="loginScreen__background">
        <img className="loginScreen__logo" src={logo} alt="" />
      </div>
      <button className="loginScreen__button" onClick={() => setSignIn(true)}>
        Sign-In
      </button>
      <div className="gradient"></div>

      <div className="loginScreen__body">
        {signIn ? (
          <SignupScreen />
        ) : (
          <>
            <h1>Films, TV Shows and more.</h1>
            <h2>Watch and Chill Anytime Anywhere</h2>
            <h3>Drop your email below to get started.</h3>
            <div className="loginScreen__input">
              <form>
                <input type="email" placeholder="Email Address" />
                <button
                  className="getStarted__button"
                  onClick={() => setSignIn(true)}
                >
                  {" "}
                  GET STARTED
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LoginScreen;
