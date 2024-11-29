"use client";
import Image from "next/image";
// import "../styles/landingPage.css";
import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // check if the user is logged in by verifying the access token in localStorage
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
        // Send logout request to the API
        const response = await fetch("/api/accounts/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
          // on success, clear tokens from localStorage and update state
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
      // If no refresh token is found
      console.error("No refresh token found.");
    }
  };

  return (
    <main className="main-container">
      <Navbar />

      {/* Header Section */}
      <section className="header text-center py-12">
        <h1>Welcome to Scriptorium</h1>
        <p>
          The world of collaborative writing and code sharing for the next
          generation of creators and innovators.
        </p>
        <div className="button-group">
        <Link href="/editor">
          <button className="button button-primary">Get Started Coding</button>
        </Link>
        <Link href="/blogsearch">
        <button className="button button-secondary">View Blogposts</button>
        </Link>
        <Link href="/templates">
        <button className="button button-primary">View Templates</button>
        </Link>
        <Link href="/create">
        <button className="button button-secondary">Write a Blogpost</button>
        </Link>
          
        </div>
      </section>

      {/* Features Section */}
        <section className="features-section">
        <div className="container mx-auto px-6 md:px-12">
          <h2>Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <div className="feature-card">
              <h3>Create Your Own Coding Templates</h3>
              <p>
                Design and customize your coding templates to speed up your workflow. Whether it’s for a project, exercise, or learning, create reusable templates for any purpose.
              </p>
            </div>
            <div className="feature-card blue-background">
              <h3>Discuss and Share Code</h3>
              <p>
                Share your code, ask for feedback, and discuss ideas with fellow developers. Scriptorium makes it easy to connect with others and enhance your coding skills through collaboration.
              </p>
            </div>
            <div className="feature-card">
              <h3>Access 15+ Languages</h3>
              <p>
                Take advantage of over 15 programming languages available on Scriptorium. Whether you're working with Python, JavaScript, C++, or more, we’ve got you covered.
              </p>
            </div>
            <div className="feature-card blue-background">
              <h3>Join Our Community of Code Writers</h3>
              <p>
                Become part of a thriving community of code writers and developers. Collaborate, learn from each other, and work together to improve your skills in a supportive environment.
              </p>
            </div>
            <div className="feature-card">
              <h3>Real-Time Code Execution</h3>
              <p>
              Instantly see the output of your code with real-time execution. Test your code, see the results, and debug any issues on the fly.
              </p>
            </div>
            <div className="feature-card blue-background">
              <h3>Discover & Fork Code Templates</h3>
              <p>
              Browse through a variety of user-created code templates, each complete with explanations and tags. Fork any template to build on top of it, or modify it for your own needs. 
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="call-to-action">
        <h2>Ready to Start?</h2>
        <p>Join Scriptorium and unlock your creative potential.</p>
      </section>

      {/* Footer */}
      <div className="landing">
        <footer>
          <p>&copy; 2024 Scriptorium, Inc. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}