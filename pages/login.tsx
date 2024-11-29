import { useState } from "react";
import { useRouter } from "next/router";
import React from "react";
import "../styles/accounts.css"; // Import the signup.css file for styling

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Handle input changes for both <input>
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/accounts/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        // Store the tokens (access and refresh) in localStorage or cookies
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        // Redirect to dashboard or home page
        router.push("/");
      } else {
        alert(data.error); // Display error message from the server
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="container">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          placeholder="Email"
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
          placeholder="Password"
        />
        <button type="submit">Login</button>
      </form>
      <footer>
        <p>
          Don't have an account? <a href="/signup">Sign up here</a>
        </p>
      </footer>
    </div>
  );
}
