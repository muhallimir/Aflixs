import React, { useState } from "react";
import "./SignupScreen.css";
import { auth } from "../firebase";
import { useHistory } from "react-router-dom";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function SignupScreen({ initialEmail = "" }) {
  const history = useHistory();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!isValidEmail(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const register = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const authUser = await auth.createUserWithEmailAndPassword(
        email.trim(),
        password
      );
      console.log(authUser);
      if (auth) {
        history.push("/");
      }
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const signIn = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const authUser = await auth.signInWithEmailAndPassword(
        email.trim(),
        password
      );
      console.log(authUser);
      history.push("/");
    } catch (error) {
      setFormError("Sign-in failed. Check your credentials or register first.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signupScreen">
      <form noValidate onSubmit={signIn}>
        <h1>Sign In</h1>
        <label className="signupScreen__label" htmlFor="signup-email">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
        />
        {errors.email && (
          <p className="signupScreen__error" id="signup-email-error" role="alert">
            {errors.email}
          </p>
        )}
        <label className="signupScreen__label" htmlFor="signup-password">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          placeholder="Password (min. 6 characters)"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "signup-password-error" : undefined}
        />
        {errors.password && (
          <p className="signupScreen__error" id="signup-password-error" role="alert">
            {errors.password}
          </p>
        )}
        {formError && (
          <p className="signupScreen__error" role="alert">
            {formError}
          </p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? "Please wait..." : "Sign In"}
        </button>
        <br />
        <h4>
          <span className="signupScreen__gray">New to A-Flixs?</span>{" "}
          <button
            type="button"
            className="signupScreen__link signupScreen__linkButton"
            onClick={register}
            disabled={submitting}
          >
            Click here to Register.
          </button>
        </h4>
      </form>
    </div>
  );
}

export default SignupScreen;
