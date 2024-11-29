"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import "../styles/navbar.css"; 

const Navbar: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
  
    useEffect(() => {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        setIsLoggedIn(true);
      }
    }, []);
  
    const handleLogout = async () => {
      const refreshToken = localStorage.getItem("refreshToken");
  
      if (refreshToken) {
        try {
          const response = await fetch("/api/accounts/logout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          });
  
          if (response.ok) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setIsLoggedIn(false);
          } else {
            const errorData = await response.json();
            console.error("Logout failed:", errorData.error);
          }
        } catch (error) {
          console.error("Error during logout:", error);
        }
      } else {
        console.error("No refresh token found.");
      }
    };
  
    return (
      <header className="navbar-container">
        <Link href="/">
          <h1 className="navbar-title">Scriptorium</h1>
        </Link>
        <div className="navbar-buttons">
          {!isLoggedIn ? (
            <>
              <Link href="/login">
                <button className="button button-secondary">Log In</button>
              </Link>
              <Link href="/signup">
                <button className="button button-primary">Sign Up</button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/edit-account">
                <button className="button button-secondary">Edit Account</button>
              </Link>
              <button className="button button-secondary" onClick={handleLogout}>
                Log Out
              </button>
            </>
          )}
        </div>
      </header>
    );
  };
  
  export default Navbar;
