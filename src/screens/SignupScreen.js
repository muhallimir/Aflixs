import React, { useEffect, useRef } from "react";
import "./SignupScreen.css";
import { auth } from "../firebase";
import { useHistory } from "react-router-dom";

function SignupScreen() {
  const history = useHistory();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const register = (e) => {
    e.preventDefault();
    // Firebase register register
    auth
      .createUserWithEmailAndPassword(
        emailRef.current.value,
        passwordRef.current.value
      )
      .then((authUser) => {
        console.log(authUser);
        if (auth) {
          history.push("/profile");
        }
      })
      .catch((error) => alert(error.message));
  };

  const signIn = (e) => {
    e.preventDefault();
    // Firebase login
    auth
      .signInWithEmailAndPassword(
        emailRef.current.value,
        passwordRef.current.value
      )
      .then((authUser) => {
        console.log(authUser);
        history.push("/profile");
      })
      .catch((error) => alert("Account not found. Click Register instead"));
  };

  return (
    <div className="signupScreen">
      <form>
        <h1>Sign In</h1>
        <input type="email" placeholder="Email" ref={emailRef} />
        <input type="password" placeholder="Password" ref={passwordRef} />
        <button type="submit" onClick={signIn}>
          Sign In
        </button>
        <br />
        <h4>
          <span className="signupScreen__gray">New to A-Flixs?</span>

          <span className="signupScreen__link" onClick={register}>
            {""} Click here to Register.
          </span>
        </h4>
      </form>
    </div>
  );
}

export default SignupScreen;
