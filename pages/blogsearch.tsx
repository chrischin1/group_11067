// pages/blogsearch.tsx

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/navbar";
import "../app/globals.css";

interface Post {
  id: string;
  user: { firstName: string; lastName: string };
  title: string;
  desc: string;
  userId: string;
  postTags: { name: string }[];
  postTemplates: { title: string; id: number }[];
  ratings: { value: number }[];
  reportCount: number;
}

interface Data {
  title: string;
  desc: string;
  tags: string;
  templates: string;
  sortByControversial: boolean;
  sortOption: string;
  page: number;
  limit: number;
}

const BlogpostPage: React.FC = () => {
  const [searchData, setSearchData] = useState<Data>({
    title: "",
    desc: "",
    tags: "",
    templates: "",
    sortByControversial: false,
    sortOption: "",
    page: 1,
    limit: 6,
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const router = useRouter();

  const getUserRole = (): string | null => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          return payload.role;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
    setUserRole(getUserRole());
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPosts(searchData);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [
    searchData.title,
    searchData.desc,
    searchData.tags,
    searchData.templates,
    searchData.sortOption,
    searchData.sortByControversial,
    searchData.page,
  ]);

  const fetchPosts = async (search: Data) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        title: search.title,
        desc: search.desc,
        tags: search.tags,
        templates: search.templates,
        sortOption: search.sortOption,
        sortByControversial: search.sortByControversial.toString(),
        page: search.page.toString(),
        limit: search.limit.toString(),
      });

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (isAuthenticated) {
        const token = localStorage.getItem("accessToken");
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      const response = await fetch(
        `/api/blogposts/blogpost?${queryParams.toString()}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch posts.");
      }

      const data = await response.json();
      setPosts(data.posts_ret);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.message || "Unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handleSortOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      sortOption: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setSearchData((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-r from-[#dcedff] to-[#94b0da] text-[#343f3e] font-sans pb-8">
      <Navbar />

      {/* Header Section */}
      <header className="template-header text-center py-12">
        <h1>Browse blogposts by content, author, or templates.</h1>

        {/* Search Inputs Container */}
        <div className="search-container">
          <input
            type="text"
            name="title"
            value={searchData.title}
            onChange={handleSearch}
            placeholder="Title"
            className="search-input"
          />
          <input
            type="text"
            name="desc"
            value={searchData.desc}
            onChange={handleSearch}
            placeholder="Description"
            className="search-input"
          />
          <input
            type="text"
            name="tags"
            value={searchData.tags}
            onChange={handleSearch}
            placeholder="Tags (e.g. cool, fun, nice)"
            className="search-input"
          />
          <input
            type="text"
            name="templates"
            value={searchData.templates}
            onChange={handleSearch}
            placeholder="Templates (e.g. MergeSort, QuickSort)"
            className="search-input"
          />
        </div>

        {/* Sort Options */}
        <div className="sort-container">
          <label htmlFor="sortOption">Sort by:</label>
          <select
            id="sortOption"
            value={searchData.sortOption}
            onChange={handleSortOptionChange}
            className="sort-select"
          >
            <option value="">-- Select --</option>
            <option value="az">A-Z</option>
            <option value="highestRating">Highest Rating</option>
            <option value="lowestRating">Lowest Rating</option>
            {userRole === "ADMIN" && (
              <>
                <option value="mostReported">Most Reported</option>
                <option value="leastReported">Least Reported</option>
              </>
            )}
          </select>
        </div>
      </header>

      {/* Posts Section */}
      <section className="template-list">
        {loading ? (
          <p>Loading posts...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <a
              key={post.id}
              href={`/blogsearch/${post.id}`}
              className="template-card"
            >
              <h4>{`Post by ${post.user.firstName} ${post.user.lastName}`}</h4>
              <h3>{post.title}</h3>
              <p>{post.desc}</p>
              <div className="template-tags">
                {post.postTags.map((tag, index) => (
                  <span key={index} className="template-tag">
                    {tag.name}
                  </span>
                ))}
              </div>
              <div className="template-tags">
                {post.postTemplates.map((template, index) => (
                  <span key={index} className="template-tag">
                    <a href={`/templates/${template.id}`}>{template.title}</a>
                  </span>
                ))}
              </div>
              <p className="template-tags">
                {post.ratings.length > 0
                  ? `Average Rating: ${
                      (
                        post.ratings.reduce((p, c) => p + c.value, 0) /
                        post.ratings.length
                      ).toFixed(2)
                    }`
                  : "No ratings."}
              </p>
              {/* Admin: Display Report Count */}
              {userRole === "ADMIN" && (
                <p className="admin-report-count">
                  Total Reports: {post.reportCount}
                </p>
              )}
            </a>
          ))
        ) : (
          <p>No posts found.</p>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(searchData.page - 1)}
            disabled={searchData.page === 1}
          >
            Previous
          </button>
          <span>
            Page {searchData.page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(searchData.page + 1)}
            disabled={searchData.page === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .template-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
          padding: 20px;
        }

        .template-card {
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .template-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .template-card h3 {
          margin: 10px 0;
        }

        .admin-report-count {
          margin: 10px 0;
          padding: 5px;
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          border-radius: 4px;
          font-weight: bold;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 20px;
          gap: 10px;
        }

        .pagination button {
          padding: 10px 20px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .pagination button:hover:not(:disabled) {
          background-color: #005bb5;
        }

        .pagination button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        /* Sort Control Styles */
        .sort-container {
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .sort-select {
          padding: 5px 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        /* Search Inputs Container */
        .search-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-top: 20px;
        }

        /* Search Input Styles */
        .search-input {
          padding: 12px;
          border-radius: 5px;
          border: 1px solid #94b0da;
          font-size: 1rem;
          background-color: #f0f4f8;
          color: #343f3e;
          margin: 5px 0;
          width: 100%;
          max-width: 200px;
          box-sizing: border-box;
        }

        .search-input:focus {
          outline: none;
          border-color: #505a5b;
        }

        @media (max-width: 900px) {
          .search-input {
            max-width: 45%;
          }
        }

        @media (max-width: 600px) {
          .template-card {
            max-width: 100%;
          }

          .pagination button {
            padding: 8px 16px;
          }

          .sort-container {
            flex-direction: column;
            gap: 5px;
          }

          .search-container {
            flex-direction: column;
            align-items: center;
          }

          .search-input {
            max-width: 100%;
          }
        }
      `}</style>
    </main>
  );
};

export default BlogpostPage;
