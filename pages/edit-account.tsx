// pages/edit-account.tsx

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import React from "react";
import "../styles/accounts.css"; // Ensure this path is correct based on your project structure

// Define allowed roles
type Role = "USER" | "ADMIN";

// Define interface for user profile data (excluding password)
interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatar: string;
  role: Role;
}

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

export default function EditAccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    avatar: avatars[0],
    password: "",
    confirmPassword: "",
  });
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Function to get the token from localStorage
  const getToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  // Fetch current user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      const token = getToken();
      console.log("Fetched token:", token); // Debugging

      if (!token) {
        alert("You must be logged in to edit your account.");
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("/api/accounts/edit", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
          setFormData({
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            phoneNumber: data.user.phoneNumber,
            avatar: data.user.avatar,
            password: "",
            confirmPassword: "",
          });
          setSelectedAvatar(data.user.avatar);
        } else {
          alert(data.error);
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert("An error occurred while fetching your data. Please try again.");
      }
    };

    fetchUserData();
  }, [router]);

  // Handle input changes
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const token = getToken();
    if (!token) {
      alert("You must be logged in to edit your account.");
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("/api/accounts/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          avatar: formData.avatar,
          password: formData.password, // Optional
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account updated successfully.");
        router.push("/"); // Redirect to Landing Page
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error updating account:", error);
      alert("An error occurred while updating your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle account deletion
  const handleDelete = async () => {
    if (!user) return;

    const confirmDelete = confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmDelete) return;

    setIsDeleting(true);

    const token = getToken();
    if (!token) {
      alert("You must be logged in to delete your account.");
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("/api/accounts/edit", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        // No need to send body as backend derives userId from token
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        // Clear the token from localStorage and redirect to landing page
        localStorage.removeItem("accessToken");
        router.push("/"); // Redirect to Landing Page
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("An error occurred while deleting your account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return <div className="container"><p>Loading...</p></div>;
  }

  return (
    <div className="accounts-container">
      <h1>Edit Account</h1>
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
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleAvatarSelect(avatar);
                  }
                }}
              >
                <img src={avatar} alt={`Avatar ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Password (for updating password) */}
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="New Password (leave blank to keep current password)"
        />

        {/* Confirm Password */}
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="Confirm New Password"
        />

        {/* Submit Button */}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Account"}
        </button>
      </form>

      {/* Delete Account Button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="delete-button"
      >
        {isDeleting ? "Deleting..." : "Delete Account"}
      </button>

      <footer>
        <p>
          <a href="/">Back to Home</a>
        </p>
      </footer>

      {/* Styles */}
      <style jsx>{`
        .accounts-container {
          max-width: 500px;
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
          font-size: 16px;
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

        .delete-button {
          margin-top: 20px;
          background-color: #dc3545;
          color: white;
          padding: 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.3s;
        }

        .delete-button:disabled {
          background-color: #f5a6a6;
          cursor: not-allowed;
        }

        .delete-button:hover:not(:disabled) {
          background-color: #c82333;
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

        /* Responsive Design */
        @media (max-width: 600px) {
          .avatars-container {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
