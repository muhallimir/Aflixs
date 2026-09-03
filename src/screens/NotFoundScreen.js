import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Nav from "../Nav";
import { setPageMeta } from "../utils/seo";
import "./NotFoundScreen.css";

function NotFoundScreen() {
  useEffect(() => {
    setPageMeta({ title: "Page not found", description: "The page you asked for does not exist on Aflixs." });
  }, []);
  return (
    <div className="notFound">
      <Nav />
      <div className="notFound__body">
        <h1>404</h1>
        <h2>Lost your way?</h2>
        <p>Sorry, we can not find that page. It may have moved or never existed.</p>
        <div className="notFound__actions">
          <Link className="notFound__btn" to="/">
            Back to Home
          </Link>
          <Link className="notFound__btn ghost" to="/search">
            Search titles
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundScreen;
