// pages/templates/[id].tsx

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import "../../app/globals.css";
import Navbar from "@/components/navbar";

const TemplateDetail = () => {
  const router = useRouter();
  const { id } = router.query; // Get the template ID from the URL
  const [template, setTemplate] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]); // Store related blog posts
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state
  const [currentUserId, setCurrentUserId] = useState<number | null>(null); // Current user ID
  const [isAuthor, setIsAuthor] = useState<boolean>(false); // Is current user the author
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Submission state

  // Function to get the token from localStorage
  const getToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  };

  // Function to extract userId from token
  const getUserId = (): number | null => {
    if (typeof window !== "undefined") {
      const token = getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          return payload.userId;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    // Check authentication status
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
      const userId = getUserId();
      setCurrentUserId(userId);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      // Fetch template data from your API using the template ID
      const fetchTemplate = async () => {
        try {
          const response = await fetch(`/api/templates/${id}`);
          if (response.ok) {
            const data = await response.json();
            setTemplate(data);
            // Check if current user is the author
            if (currentUserId && data.userId === currentUserId) {
              setIsAuthor(true);
            }
          } else {
            console.error("Failed to fetch template");
          }
        } catch (error) {
          console.error("Error fetching template:", error);
        }
      };

      fetchTemplate();
    }
  }, [id, currentUserId]);

  // Fetch blog posts related to the template
  useEffect(() => {
    if (id) {
      const fetchPosts = async () => {
        setLoadingPosts(true);
        try {
          const response = await fetch(`/api/blogposts/blogpost?templates=${id}`);
          if (response.ok) {
            const data = await response.json();
            setPosts(data.posts_ret); // Assuming the backend sends `posts_ret` as the key for posts
          } else {
            console.error("Failed to fetch posts.");
          }
        } catch (error) {
          setError("Error fetching posts.");
          console.error(error);
        } finally {
          setLoadingPosts(false);
        }
      };

      fetchPosts();
    }
  }, [id]);

  const handlePostClick = (postId: number) => {
    // Navigate to the specific blog post page
    router.push(`/blogsearch/${postId}`);
  };

  const handleCreateBlogPost = () => {
    // Navigate to the blog post creation page with template info
    router.push({
      pathname: '/create',
      query: {
        templateId: id,
        title: template?.title,
        desc: template?.desc,
        tags: JSON.stringify(
          template?.templateTags.map((tag: { name: string }) => tag.name)
        ), // Pass tags as a string
      },
    });
  };

  const handleUseTemplate = () => {
    if (!template) return;

    // Encode the template code to safely include it in the URL
    const encodedCode = encodeURIComponent(template.body);

    // Navigate to the editor page with the template code as a query parameter
    router.push({
      pathname: '/editor',
      query: { code: encodedCode },
    });
  };

  const handleForkTemplate = async () => {
    if (!template) return;

    const token = getToken();
    if (!token) {
      alert("You must be logged in to fork a template.");
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 201) {
        alert(
          "Template forked successfully! You now have a forked version of this template."
        );
        router.push(`/templates/${data.forkedTemplate.id}`);
      } else if (response.status === 403) {
        alert(data.message);
      } else {
        alert(data.error || "An error occurred while forking the template.");
      }
    } catch (error: any) {
      console.error("Error forking template:", error);
      alert("An unexpected error occurred. Please try again later.");
    }
  };

  const handleEditClick = () => {
    // Redirect to the template creation page with the template data
    router.push({
      pathname: '/templatecreation',
      query: {
        id: template.id,
      },
    });
  };

  const handleDeleteTemplate = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this template? This action cannot be undone."
    );
    if (!confirmDelete) return;

    const token = getToken();
    if (!token) {
      alert("You must be logged in to delete a template.");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204) {
        alert("Template deleted successfully!");
        router.push("/templates"); // Redirect to templates list
      } else {
        const data = await response.json();
        alert(data.error || "An error occurred while deleting the template.");
      }
    } catch (error: any) {
      console.error("Error deleting template:", error);
      alert("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!template) {
    return <div>Loading...</div>;
  }

  return (
    <div className="template-detail-container">
      <Navbar />
      <h1 className="template-title">{template.title}</h1>
      <p className="template-desc">{template.desc}</p>

      <div className="template-body">
        <h2>Code Body:</h2>
        <pre className="code-container">
          <code>{template.body}</code>
        </pre>
      </div>

      <div className="template-tags">
        <h3>Tags:</h3>
        {template.templateTags.map((tag: { name: string }) => (
          <div key={tag.name} className="template-tag">
            {tag.name}
          </div>
        ))}
      </div>

      <div className="template-buttons-container">
        <button onClick={handleCreateBlogPost} className="button">
          Create Blog Post from this Template
        </button>
        <button onClick={handleUseTemplate} className="button">
          Use Template
        </button>
        {isAuthenticated && (
          <>
            <button onClick={handleForkTemplate} className="button">
              Fork Template
            </button>
            {isAuthor && (
              <>
                <button onClick={handleEditClick} className="button">
                  Edit Template
                </button>
                <button onClick={handleDeleteTemplate} className="button">
                  Delete Template
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Display related blog posts */}
      <div className="related-posts-section">
        <h3>Related Blog Posts</h3>
        {loadingPosts ? (
          <p>Loading related posts...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : posts.length > 0 ? (
          <div className="posts-cards-container">
            {posts.map((post: any) => (
              <div
                key={post.id}
                className="post-card"
                onClick={() => handlePostClick(post.id)} // Handle click
              >
                <h4 className="post-title">{post.title}</h4>
                <p className="post-desc">
                  {post.desc.length > 150
                    ? post.desc.substring(0, 150) + "..."
                    : post.desc}
                </p>
                <div className="post-tags">
                  {post.postTags.map((tag: { name: string }) => (
                    <span key={tag.name} className="post-tag">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No related blog posts found.</p>
        )}
      </div>
    </div>
  );
};

export default TemplateDetail;
