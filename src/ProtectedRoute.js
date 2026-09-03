import React from "react";
import { Route } from "react-router-dom";
import { useSelector } from "react-redux";
import LoginScreen from "./screens/LoginScreen";

// Route guard: render children when a real or guest user is present, otherwise
// render the login screen. Both Firebase-authenticated and guest demo sessions
// are treated as authorised so visitors can explore the app before signing up.
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
