// pages/signup.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import React from "react";
import "../styles/accounts.css"; 

// Define the available avatars
const avatars = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  "/avatars/avatar5.png",
  "/avatars/avatar6.png",
  "/avatars/avatar7.png",
  "/avatars/avatar8.png",
];

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    avatar: avatars[0], // Set default avatar
    // Removed 'role' from formData
  });

  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]); // State to track selected avatar
  const [isSubmitting, setIsSubmitting] = useState(false); // State to handle submission status

  // Handle input changes for <input>
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle avatar selection
  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    setFormData({
      ...formData,
      avatar: avatar,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Send formData directly without 'role'
      const response = await fetch("/api/accounts/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Send formData without 'role'
      });

      const rawResponse = await response.text();  // Using text() instead of json() to inspect the raw response
      console.log("Raw response:", rawResponse);

      const data = JSON.parse(rawResponse);
      if (response.ok) {
        // Redirect to login page (or wherever you want)
        router.push("/login");
      } else {
        alert(data.error); // Display error message from the server
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="accounts-container">
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        {/* First Name */}
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          required
          placeholder="First Name"
        />

        {/* Last Name */}
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleInputChange}
          required
          placeholder="Last Name"
        />

        {/* Email */}
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          placeholder="Email"
        />

        {/* Password */}
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
          placeholder="Password"
        />

        {/* Phone Number */}
        <input
          type="text"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          required
          placeholder="Phone Number"
        />

        {/* Avatar Selection */}
        <div className="avatar-selection">
          <h3>Select Your Profile Picture:</h3>
          <div className="avatars-container">
            {avatars.map((avatar, index) => (
              <div
                key={index}
                className={`avatar-option ${selectedAvatar === avatar ? "selected" : ""}`}
                onClick={() => handleAvatarSelect(avatar)}
              >
                <img src={avatar} alt={`Avatar ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Removed Hidden Role Input */}

        {/* Submit Button */}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing Up..." : "Sign Up"}
        </button>
      </form>
      <footer>
        <p>
          Already have an account? <a href="/login">Login here</a>
        </p>
      </footer>

      {/* Styles */}
      <style jsx>{`
        .accounts-container {
          max-width: 400px;
          margin: 50px auto;
          padding: 20px;
          background-color: #f5f5f5;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        h1 {
          text-align: center;
          margin-bottom: 20px;
        }

        form {
          display: flex;
          flex-direction: column;
        }

        input[type="text"],
        input[type="email"],
        input[type="password"] {
          padding: 10px;
          margin-bottom: 15px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .avatar-selection {
          margin-bottom: 15px;
        }

        .avatar-selection h3 {
          margin-bottom: 10px;
        }

        .avatars-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .avatar-option {
          border: 2px solid transparent;
          border-radius: 50%;
          padding: 2px;
          cursor: pointer;
          transition: border-color 0.3s;
        }

        .avatar-option.selected {
          border-color: #0070f3;
        }

        .avatar-option img {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
        }

        button {
          padding: 10px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
          font-size: 16px;
        }

        button:disabled {
          background-color: #a0c4ff;
          cursor: not-allowed;
        }

        button:hover:not(:disabled) {
          background-color: #005bb5;
        }

        footer {
          text-align: center;
          margin-top: 20px;
        }

        footer a {
          color: #0070f3;
          text-decoration: none;
        }

        footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
