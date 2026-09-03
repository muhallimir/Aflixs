import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <strong>Aflixs</strong>
          <span>Films, TV shows, and more.</span>
        </div>
        <nav className="footer__links" aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/search">Search</Link>
          <Link to="/profile">Profile</Link>
        </nav>
        <p className="footer__meta">
          {year} Aflixs streaming portfolio demo. Data by TMDB. Trailers via YouTube.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
