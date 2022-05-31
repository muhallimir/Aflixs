import "./App.css";
import React, { useEffect } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { auth } from "./firebase";
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "./features/userSlice";
import Spinner from "react-spinkit";
import logo from "./logo.png";
import styled from "styled-components";
import { useAuthState } from "react-firebase-hooks/auth";

function App() {
  const user = useSelector((selectUser) => selectUser.counter.user);
  const dispatch = useDispatch();
  const [userAuth, loading] = useAuthState(auth);

  useEffect(() => {
    // will only run once when the app component loads..
    const unsubscribe = auth.onAuthStateChanged((userAuth) => {
      if (userAuth) {
        // the user just logged in / the user was logged in
        console.log("THE USER IS >>> ", userAuth);
        dispatch(
          login({
            uid: userAuth.uid,
            email: userAuth.email,
          })
        );
      } else {
        dispatch(logout());
      }
    });

    return unsubscribe;
  }, [dispatch]);

  if (loading) {
    return (
      <Apploading>
        <ApploadingContent>
          <img src={logo} alt="" />
          <Spinner name="pacman" color="red" fadeIn="none" />
        </ApploadingContent>
      </Apploading>
    );
  }

  return (
    <div className="App">
      <Router>
        <Route path="/">
          {!user ? (
            <LoginScreen />
          ) : (
            <Switch>
              <Route path="/profile">
                <ProfileScreen />
              </Route>
              <Route path="/">
                <HomeScreen />
              </Route>
            </Switch>
          )}
        </Route>
      </Router>
    </div>
  );
}
export default App;

const Apploading = styled.div`
  display: grid;
  place-items: center;
  height: 100vh;
  width: 100%;
`;

const ApploadingContent = styled.div`
  text-align: center;
  padding-bottom: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  > img {
    object-fit: contain;
    height: 200px;
    padding: 20px;
    margin-bottom: 20px;
  }
`;
