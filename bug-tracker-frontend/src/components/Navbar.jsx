import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, logout, getCurrentUser } from '../services/auth';
import "../Styles/Navbar.css"

const Navbar = ({ setLoggedIn }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const user = getCurrentUser();
  const loggedIn = isAuthenticated();
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
    navigate('/');
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="logo">
          <span className="logo-icon">🐞</span>
          <h2>Bug Tracker</h2>
        </Link>
      </div>

      <div className="navbar-right">
        {!loggedIn && (
          <>
            <Link to="/">Home</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/login">Login</Link>
          </>
        )}

        {loggedIn && (
          <>
            {role === "ADMIN" && (
              <>

              </>
            )}
            {role === "DEVELOPER" && (
              <>

              </>
            )}
            {role === "TESTER" && (
              <>

              </>
            )}
            <div className="user-menu">
              <div className="dropdown">
                <button 
                  className="dropbtn"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <span className="user-icon">👤</span>
                  <span className="username">{user?.sub}</span>
                </button>
                {isProfileOpen && (
                  <div className="dropdown-content">
                    <div className="dropdown-header">
                      <span className="role">{role}</span>
                    </div>
                    <button onClick={handleChangePassword} className="dropdown-item">
                      <span className="icon">🔑</span>
                      Change Password
                    </button>
                    <button onClick={handleLogout} className="dropdown-item">
                      <span className="icon">🚪</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
