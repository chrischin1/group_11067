// pages/blogposts/create.tsx

import { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/router";
import React from "react";
import Navbar from "@/components/navbar";

// Interfaces for Tags and Templates
interface Tag {
  tagId: number;
  name: string;
}

interface Template {
  id: number;
  title: string;
}

interface Option {
  value: string;
  label: string;
}

// SingleSelect Component
interface SingleSelectProps {
  options: Option[];
  selected: string | undefined;
  onChange: (selected: string | undefined) => void;
  label: string;
}

const SingleSelect: React.FC<SingleSelectProps> = ({
  options,
  selected,
  onChange,
  label,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle dropdown open/close
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle option selection
  const handleOptionClick = (value: string) => {
    if (value === "") {
      // "No Code Template" selected
      onChange(undefined);
    } else {
      onChange(value);
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="single-select-container" ref={containerRef}>
      <label className="single-select-label">{label}:</label>
      <div className="single-select-box" onClick={toggleDropdown}>
        {selected ? (
          <span className="selected-value">
            {options.find((opt) => opt.value === selected)?.label}
          </span>
        ) : (
          <span className="placeholder">Select a {label.toLowerCase()}</span>
        )}
        <span className="dropdown-arrow">&#9662;</span>
      </div>

      {isOpen && (
        <div className="dropdown">
          <input
            type="text"
            className="search-input"
            placeholder={`Search ${label.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <div className="options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`option ${
                    selected === option.value ? "selected" : ""
                  }`}
                  onClick={() => handleOptionClick(option.value)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="no-options">No {label.toLowerCase()} found.</div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .single-select-container {
          display: flex;
          flex-direction: column;
          position: relative; /* Establish positioning context */
        }

        .single-select-label {
          margin-bottom: 0.5rem;
          font-weight: bold;
          color: #555;
        }

        .single-select-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border: 1px solid #ccc;
          border-radius: 0.25rem;
          background-color: #fff;
          cursor: pointer;
          user-select: none;
        }

        .selected-value {
          color: #333;
        }

        .placeholder {
          color: #888;
        }

        .dropdown-arrow {
          font-size: 0.8rem;
          color: #555;
        }

        .dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          background-color: #fff;
          border: 1px solid #ccc;
          border-radius: 0.25rem;
          margin-top: 0.25rem;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .search-input {
          width: 100%;
          padding: 0.5rem;
          border: none;
          border-bottom: 1px solid #ccc;
          outline: none;
          font-size: 1rem;
        }

        .options {
          max-height: 150px;
          overflow-y: auto;
        }

        .option {
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .option:hover {
          background-color: #f0f0f0;
        }

        .option.selected {
          background-color: #e0e0e0;
          font-weight: bold;
        }

        .no-options {
          padding: 0.5rem 0.75rem;
          color: #888;
        }

        /* Prevent dropdown from overflowing the viewport */
        @media (max-width: 600px) {
          .dropdown {
            left: 0;
            right: 0;
          }
        }
      `}</style>
    </div>
  );
};

const CreateBlogPost = () => {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(
    undefined
  );
  const [templates, setTemplates] = useState<{ id: number; title: string }[]>(
    []
  );
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [errorTemplates, setErrorTemplates] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      // Optionally, redirect to login
      // router.push("/login");
    }
  }, []);

  // Fetch available templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/templates/view/viewAll?limit=100");
        if (!response.ok) {
          throw new Error("Failed to fetch templates.");
        }
        const data = await response.json();
        setTemplates(data.templates);
      } catch (err: any) {
        console.error(err);
        setErrorTemplates(err.message || "Failed to fetch templates.");
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!title.trim() || !desc.trim()) {
      setError("Title and Description are required fields.");
      return;
    }

    // Convert tags input to array
    const tagArray = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setTags(tagArray);

    // Ensure a template is selected or "No Template" is chosen
    // If "No Template" is selected, selectedTemplateId will be undefined
    // If a template is selected, it will have a value
    setError("");
    setIsSubmitting(true);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("You must be logged in to create a blog post.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/blogposts/blogpost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          desc,
          postTags: tagArray,
          postTemplates: selectedTemplateId
            ? [Number(selectedTemplateId)]
            : [], // Empty array if no template selected
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create blog post.");
      } else {
        const data = await response.json();
        console.log("Blog post created:", data);
        // Redirect to the newly created blog post page
        router.push(`/blogsearch/${data.id}`);
      }
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle tags input change
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
  };

  return (
    <div className="container">
      <Navbar />
      <h1>Create Blog Post</h1>

      {error && <p className="error">{error}</p>}

      {!isAuthenticated && (
        <p className="error">You must be logged in to create a blog post.</p>
      )}

      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="blogpost-form">
          {/* Title Input */}
          <div className="form-group">
            <label htmlFor="title">
              Title<span className="required">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter blog post title"
              required
            />
          </div>

          {/* Description Input */}
          <div className="form-group">
            <label htmlFor="desc">
              Description<span className="required">*</span>
            </label>
            <textarea
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Enter a brief description"
              rows={3}
              required
            />
          </div>

          {/* Tags Input */}
          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input
              id="tags"
              type="text"
              value={tagsInput}
              onChange={handleTagsChange}
              placeholder="e.g., JavaScript, API, Next.js"
            />
          </div>

          {/* Code Templates Single-Select */}
          <div className="form-group">
            <SingleSelect
              options={[
                { value: "", label: "No Code Template" }, // "No Template" option
                ...templates.map((template) => ({
                  value: template.id.toString(),
                  label: template.title,
                })),
              ]}
              selected={selectedTemplateId}
              onChange={setSelectedTemplateId}
              label="Code Template"
            />
            {loadingTemplates && <p>Loading templates...</p>}
            {errorTemplates && <p className="error">{errorTemplates}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`button ${isSubmitting ? "button-disabled" : ""}`}
          >
            {isSubmitting ? "Submitting..." : "Create Blog Post"}
          </button>
        </form>
      )}

      <style jsx>{`
        .container {
          max-width: 100%;
          margin: 0 auto;
          padding: 0rem;
          background-color: #f9f9f9;
          border-radius: 0.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(to right, #dcedff, #94b0da);
          color: #343f3e;
          font-family: sans-serif;
          padding-bottom: 2rem; /* Equivalent to pb-8 */
        }
        

        h1 {
          text-align: center;
          margin: 2rem;
          color: #333; 
          font-size: 2rem;
        }

        .error {
          color: red;
          margin-bottom: 1rem;
          text-align: center;
        }

        .required {
          color: red;
        }

        .blogpost-form {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        label {
          margin-bottom: 0.5rem;
          font-weight: bold;
          color: #555;
        }

        input[type="text"],
        textarea {
          padding: 0.75rem;
          border: 1px solid #ccc;
          border-radius: 0.25rem;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        input[type="text"]:focus,
        textarea:focus {
          border-color: #8f91a2;
          outline: none;
        }

        .button {
          padding: 0.75rem 1.5rem;
          background-color: #8f91a2;
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
          align-self: flex-end;
          transition: background-color 0.3s ease;
        }

        .button:hover {
          background-color: #505a5b;
        }

        .button-disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        /* Responsive Design */
        @media (max-width: 600px) {
          .container {
            padding: 1rem;
          }

          .button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateBlogPost;
