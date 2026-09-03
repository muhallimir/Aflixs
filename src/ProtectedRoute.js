import React from "react";
import { Route } from "react-router-dom";
import { useSelector } from "react-redux";
import LoginScreen from "./screens/LoginScreen";

// Route guard for authenticated screens. Keeps Firebase session as the source
// of truth via Redux (`counter.user`, synced by auth.onAuthStateChanged in App).
// Unauthenticated visits render the login screen instead of protected content.
function ProtectedRoute({ children, ...rest }) {
  const user = useSelector((state) => state.counter.user);
  return (
    <Route
      {...rest}
      render={() => (user ? children : <LoginScreen />)}
    />
  );
}

export default ProtectedRoute;
