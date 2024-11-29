// pages/templatecreation.tsx

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import "../app/globals.css";

const TemplateCreation = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [body, setBody] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(false); // New state to check if editing
  const { id } = router.query; // Get the template ID from the query parameters

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);

    if (id) {
      // If an id is present, fetch the template data for editing
      const fetchTemplate = async () => {
        try {
          const response = await fetch(`/api/templates/${id}`);
          if (response.ok) {
            const data = await response.json();
            setTitle(data.title);
            setDesc(data.desc);
            setBody(data.body);
            setTags(data.templateTags.map((tag: { name: string }) => tag.name));
            setIsEditing(true);
          } else {
            console.error("Failed to fetch template for editing.");
          }
        } catch (error) {
          console.error("Error fetching template:", error);
        }
      };

      fetchTemplate();
    } else if (router.query.code && typeof router.query.code === "string") {
      setBody(router.query.code);
    }
  }, [router.query.code, id]);

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTags(e.target.value.split(",").map((tag) => tag.trim()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      setError("Title and body are required fields.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("You must be logged in to create or edit a template.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const endpoint = isEditing ? `/api/templates/${id}` : "/api/templates";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, desc, body, templateTags: tags }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to submit template.");
      } else {
        const data = await response.json();
        const templateId = isEditing ? id : data.id;
        router.push(`/templates/${templateId}`);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="templatecreation-container">
      <h1>{isEditing ? "Edit Template" : "Create Template"}</h1>

      {error && <p className="error">{error}</p>}
      {!isAuthenticated && (
        <p className="error">
          You must be logged in to {isEditing ? "edit" : "create"} a template.
        </p>
      )}

      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="template-form">
          <div className="form-group">
            <label htmlFor="title">
              Title<span className="required">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter template title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="desc">Description</label>
            <textarea
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Enter a brief description"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="body">
              Body<span className="required">*</span>
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input
              id="tags"
              type="text"
              value={tags.join(", ")}
              onChange={handleTagChange}
              placeholder="e.g., javascript, api, example"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`button ${isSubmitting ? "button-disabled" : ""}`}
          >
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Submitting..."
              : isEditing
              ? "Update Template"
              : "Create Template"}
          </button>
        </form>
      )}
    </div>
  );
};

export default TemplateCreation;
