import React, { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import "../app/globals.css";

interface Template {
  id: string;
  title: string;
  desc: string;
  body: string;
  templateTags: { name: string }[];
}

interface Post {
  id: string;
  title: string;
  desc: string;
  postTags: { name: string }[];
}

const TemplatePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTemplates = async (search: string, page: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/templates/view/viewAll?searchTerm=${search}&page=${page}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch templates.");
      }
      const data = await response.json();
      setTemplates(data.templates);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (err: any) {
      setError(err.message || "Unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPostsByTemplate = async (templateId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/blogposts/blogpost?templates=${templateId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch posts.");
      }
      const data = await response.json();
      setPosts(data.posts_ret); // Assuming the backend sends `posts_ret` as the key for posts
    } catch (err: any) {
      setError(err.message || "Unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates(searchTerm, currentPage);
  }, [searchTerm, currentPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleTemplateClick = async (templateId: string) => {
    // Fetch related posts
    await fetchPostsByTemplate(templateId);

    // Redirect to the template details page
    window.location.href = `/templates/${templateId}`;
  };

  return (
    <main className="main-container">
        <Navbar />

       {/* Header Section */}
      <header className="header text-center py-12">
        <h1>Explore Templates</h1>
        <p>Find templates tailored to your needs with ease.</p>
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={handleSearch}
          className="template-search-input"
        />
      </header>

<section className="template-list">
  {loading ? (
    <p>Loading templates...</p>
  ) : error ? (
    <p className="error-message">{error}</p>
  ) : templates.length > 0 ? (
    templates.map((template) => (
      
      <a
        key={template.id}
        onClick={() => handleTemplateClick(template.id)}
        className="template-card"
      >
        <h3>{template.title}</h3>
        <p>{template.desc}</p>
        <div className="template-tags">
          {template.templateTags.map((tag, index) => (
            <span key={index} className="template-tag">
              {tag.name}
            </span>
          ))}
        </div>
      </a>
    ))
  ) : (
    <p>No templates found.</p>
  )}
</section>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
};

export default TemplatePage;
