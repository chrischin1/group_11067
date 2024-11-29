// pages/blogsearch/[id].tsx

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import "../../app/globals.css"; // Correct path to globals.css from the current file
import Navbar from "@/components/navbar";

const PostDetail = () => {
  const router = useRouter();
  const { id } = router.query; // Get the post ID from the URL
  const [post, setPost] = useState<any>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportStatus, setReportStatus] = useState<{ type: string; message: string } | null>(null);
  const [ratingStatus, setRatingStatus] = useState<{ type: string; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUserReported, setHasUserReported] = useState(false);
  const [userPostRatingValue, setUserPostRatingValue] = useState<number | null>(null);
  const [userCommentRatings, setUserCommentRatings] = useState<{ [key: number]: number | null }>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isHiding, setIsHiding] = useState(false); // State to manage hiding action
  const [hideStatus, setHideStatus] = useState<{ type: string; message: string } | null>(null); // Status for hiding
  const [isHovered, setIsHovered] = useState(false); // State to track hover status
  const [showRatingList, setShowRatingList] = useState(false);
  const [newComment, setNewComment] = useState(""); // State for the new comment
  const [commentStatus, setCommentStatus] = useState<{ type: string; message: string } | null>(null); // Status for comment submission

  // New states for handling replies
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  // Function to extract userId from token
  const getUserId = (): number | null => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
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

  // Function to extract role from token
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

  // Function to build the comments tree
  const buildCommentsTree = (comments: any[]) => {
    const commentMap: { [key: number]: any } = {};
    const roots: any[] = [];

    // Initialize a map of comments
    comments.forEach((comment) => {
      comment.replies = [];
      commentMap[comment.id] = comment;
    });

    // Build the tree
    comments.forEach((comment) => {
      if (comment.parentId && comment.parentId !== -1) {
        const parent = commentMap[comment.parentId];
        if (parent) {
          parent.replies.push(comment);
        } else {
          // Parent comment not found; treat as root
          roots.push(comment);
        }
      } else {
        roots.push(comment);
      }
    });

    return roots;
  };

  // Move fetchPost outside of useEffect so it can be called elsewhere
  const fetchPost = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/blogposts/${id}`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();

        // Build the comments tree
        const commentsTree = buildCommentsTree(data.comments);

        // Update the post state with the comments tree
        setPost({ ...data, commentsTree });
        checkIfUserReported(data.reports);
        checkIfUserRated(data);
      } else {
        console.error("Failed to fetch post");
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    }
  };

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);

    if (id) {
      fetchPost();
    }
  }, [id]);

  // Check if the user has already reported the post
  const checkIfUserReported = (reports: any[] | undefined) => {
    const userId = getUserId();
    if (userId && Array.isArray(reports)) {
      const reported = reports.some((report) => report.reporterId === userId);
      setHasUserReported(reported);
    }
  };

  // Check if the user has already rated the post or comments
  const checkIfUserRated = (data: any) => {
    const userId = getUserId();

    if (userId) {
      // Check if user has rated the post
      const userRating = data.ratings.find((rating: any) => rating.userId === userId);
      const userRatingValue = userRating ? userRating.value : null;
      setUserPostRatingValue(userRatingValue);

      // Check if user has rated comments
      const commentRatings: { [key: number]: number | null } = {};

      data.comments.forEach((comment: any) => {
        const userCommentRating = comment.ratings.find((rating: any) => rating.userId === userId);
        commentRatings[comment.id] = userCommentRating ? userCommentRating.value : null;
      });

      setUserCommentRatings(commentRatings);
    }
  };

  const handleEditBlogPost = () => {
    // Navigate to the blog post edit page
    router.push({
      pathname: `/editpost`,
      query: {
        id: post.id,
      },
    });
  };

  const handleReportClick = () => {
    setShowReportForm(true);
    setReportStatus(null); // Reset any previous status messages
  };

  // Handler for submitting a new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      setCommentStatus({ type: "danger", message: "Comment cannot be empty." });
      return;
    }

    setIsSubmitting(true);
    setCommentStatus(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setCommentStatus({ type: "danger", message: "You must be logged in to post a comment." });
        setIsSubmitting(false);
        return;
      }

      const userId = getUserId();
      if (!userId) {
        setCommentStatus({ type: "danger", message: "Unable to fetch user ID." });
        setIsSubmitting(false);
        return;
      }

      const parentId = -1; // Default parentId for comments directly on the post

      const response = await fetch(`/api/blogposts/${id}/comments/newcomment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          parentId: parentId, // Parent comment ID (-1 for top-level comments)
          body: newComment.trim(), // The body of the new comment
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCommentStatus({ type: "success", message: "Comment added successfully." });
        setNewComment(""); // Clear the text area
        fetchPost(); // Refresh the post data
      } else {
        setCommentStatus({ type: "danger", message: data.error || "Failed to add comment." });
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      setCommentStatus({ type: "danger", message: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: number) => {
    if (!replyText.trim()) {
      // Handle empty reply
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        // Handle not authenticated
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`/api/blogposts/${id}/comments/newcomment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          parentId: parentId,
          body: replyText.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setReplyText("");
        setReplyingToCommentId(null);
        fetchPost(); // Re-fetch the post data
      } else {
        // Handle error
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) {
      setReportStatus({ type: "danger", message: "Reason cannot be empty." });
      return;
    }
    setIsSubmitting(true);
    setReportStatus(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setReportStatus({ type: "danger", message: "You must be logged in to report content." });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/reports/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentId: post.id.toString(),
          contentType: "post",
          reason: reportReason.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setReportStatus({ type: "success", message: data.message });
        setReportReason("");
        setHasUserReported(true);
        setShowReportForm(false); // Close the form after successful submission
      } else {
        setReportStatus({ type: "danger", message: data.error });
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      setReportStatus({ type: "danger", message: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = async (rating: number, commentId: number) => {
    setIsSubmitting(true);
    setRatingStatus(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setRatingStatus({ type: "danger", message: "You must be logged in to rate." });
        setIsSubmitting(false);
        return;
      }

      const userId = getUserId();

      // Prevent voting the same way again
      if (commentId < 0) {
        if (userPostRatingValue === rating) {
          setRatingStatus({ type: "danger", message: "You have already voted this way on this post." });
          setIsSubmitting(false);
          return;
        }
      } else {
        if (userCommentRatings[commentId] === rating) {
          setRatingStatus({ type: "danger", message: "You have already voted this way on this comment." });
          setIsSubmitting(false);
          return;
        }
      }

      let response: Response;
      let data;

      if (commentId < 0) {
        response = await fetch(`/api/blogposts/${id}/rate`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            value: rating,
          }),
        });

        data = await response.json();

        if (response.ok) {
          setRatingStatus({ type: "success", message: data.message });
          setUserPostRatingValue(rating); // Update the user's rating value
          fetchPost(); // Fetch the updated post data
        } else {
          setRatingStatus({ type: "danger", message: data.error });
        }
      } else {
        response = await fetch(`/api/blogposts/${id}/comments/${commentId}/rate`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            value: rating,
          }),
        });

        data = await response.json();

        if (response.ok) {
          setRatingStatus({ type: "success", message: data.message });
          setUserCommentRatings((prev) => ({ ...prev, [commentId]: rating })); // Update the user's rating value
          fetchPost(); // Fetch the updated post data
        } else {
          setRatingStatus({ type: "danger", message: data.error });
        }
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      setRatingStatus({ type: "danger", message: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for hiding/unhiding post (Admin Only)
  const handleHidePost = async () => {
    if (!isAdmin) return;

    const confirmAction = confirm(
      post.isHidden
        ? "Are you sure you want to unhide this post?"
        : "Are you sure you want to hide this post?"
    );

    if (!confirmAction) return;

    setIsHiding(true);
    setHideStatus(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setHideStatus({ type: "danger", message: "Unauthorized. Please log in as admin." });
        setIsHiding(false);
        return;
      }

      const response = await fetch("/api/reports/hideContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentId: post.id.toString(),
          contentType: "post",
          isHidden: !post.isHidden,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setHideStatus({ type: "success", message: data.message });
        // Update the post's isHidden status locally
        setPost({ ...post, isHidden: !post.isHidden });
      } else {
        setHideStatus({ type: "danger", message: data.error });
      }
    } catch (error) {
      console.error("Error hiding/unhiding post:", error);
      setHideStatus({ type: "danger", message: "An unexpected error occurred." });
    } finally {
      setIsHiding(false);
    }
  };

  if (!post) {
    return <div>Loading...</div>;
  }

  // If the post is hidden and the current user is not the author or an admin, display a message
  const userRole = getUserRole();
  const currentUserId = getUserId();
  const isAuthor = currentUserId === post.user.id;
  const isAdmin = userRole === "ADMIN";

  if (post.isHidden && !isAuthor && !isAdmin) {
    return (
      <div className="template-detail-container">
        <Navbar />
        <h1 className="template-title">This post has been hidden due to inappropriate content.</h1>
      </div>
    );
  }

  // Function to render comments recursively
  const renderComments = (comments: any[]) => {
    return comments.map((comment) => (
      <div key={comment.id} className="comment-box" style={{ marginLeft: "20px" }}>
        <div className="comment-header"></div>
        <p className="comment-body">{comment.body}</p>
        <p>
          {comment.ratings && comment.ratings.length > 0
            ? `Average Rating: ${(
                comment.ratings.reduce(
                  (p: number, c: { value: number }) => p + c.value,
                  0
                ) / comment.ratings.length
              ).toFixed(2)}`
            : "No ratings yet."}
        </p>
        <button
          onClick={() => handleRatingClick(1, comment.id)}
          className="button"
          disabled={userCommentRatings[comment.id] === 1 || !isAuthenticated}
        >
          Upvote
        </button>
        <button
          onClick={() => handleRatingClick(0, comment.id)}
          className="button"
          disabled={userCommentRatings[comment.id] === 0 || !isAuthenticated}
        >
          Downvote
        </button>
        <button
          onClick={() => setReplyingToCommentId(replyingToCommentId === comment.id ? null : comment.id)}
          className="button"
          disabled={!isAuthenticated}
        >
          {replyingToCommentId === comment.id ? "Cancel" : "Reply"}
        </button>

        {/* Reply Form */}
        {replyingToCommentId === comment.id && (
          <div className="reply-form">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              style={{
                width: "100%",
                height: "80px",
                marginTop: "10px",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                resize: "none",
              }}
            />
            <button
              onClick={() => handleReplySubmit(comment.id)}
              disabled={isSubmitting}
              className="button"
              style={{ marginTop: "10px" }}
            >
              {isSubmitting ? "Submitting..." : "Submit Reply"}
            </button>
          </div>
        )}

        {/* Render replies recursively */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="replies">{renderComments(comment.replies)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="template-detail-container">
      <Navbar />
      <div className="post-detail-content">
        <h2 className="template-title">{post.title}</h2>
        <h3 className="template-author">
          By {post.user.firstName} {post.user.lastName}
        </h3>
        <h3 className="template-rating">
          {post.ratings.length > 0
            ? `Average Rating: ${(
                post.ratings.reduce((p: number, c: { value: number }) => p + c.value, 0) /
                post.ratings.length
              ).toFixed(2)}`
            : "No ratings yet."}
        </h3>
        <p className="template-desc">{post.desc}</p>

        {/* Admin: Display Report Count */}
        {isAdmin && (
          <div className="admin-report-count">
            <p>Total Reports: {post.reportCount}</p>
          </div>
        )}

        {/* Author: If post is hidden, show flag */}
        {isAuthor && post.isHidden && (
          <div className="author-hidden-flag">
            <p>This post has been hidden due to inappropriate content.</p>
          </div>
        )}

        {/* Tags Section */}
        <div className="template-tags">
          <h3>Tags:</h3>
          <div className="tags-container">
            {post.postTags.map((tag: { name: string }) => (
              <span key={tag.name} className="template-tag">
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        {/* Related Templates */}
        <div className="template-tags">
          <h3>Related Templates:</h3>
          {post.postTemplates && post.postTemplates.length > 0 ? (
            <div className="tags-container">
              {post.postTemplates.map((template: { id: string; title: string }) => (
                <span key={template.id} className="template-tag">
                  <a
                    href={`/templates/${template.id}`}
                    style={{
                      color: "white", // Adjust color for link styling
                      textDecoration: "none", // Remove underline from links
                    }}
                  >
                    {template.title}
                  </a>
                </span>
              ))}
            </div>
          ) : (
            <p>No related templates.</p>
          )}
        </div>

        {/* Existing Buttons */}
        <div className="button-group">
          {!post.isHidden && isAuthor && (
            <button onClick={handleEditBlogPost} className="button">
              Edit This Blog Post
            </button>
          )}
          {!post.isHidden && (
            <>
              <button
                onClick={() => handleRatingClick(1, -1)}
                className="button"
                disabled={userPostRatingValue === 1 || !isAuthenticated}
              >
                Upvote Post
              </button>
              <button
                onClick={() => handleRatingClick(0, -1)}
                className="button"
                disabled={userPostRatingValue === 0 || !isAuthenticated}
              >
                Downvote Post
              </button>
              {/* New Report Button */}
              <button
                onClick={handleReportClick}
                className="button report-button"
                disabled={hasUserReported}
                style={{
                  backgroundColor: hasUserReported ? "#6c757d" : "#dc3545", // Normal color
                  transition: "background-color 0.3s", // Smooth transition for background change
                  ...(isHovered && {
                    backgroundColor: "#9e2a2f", // Darker red on hover
                  }),
                }}
                onMouseEnter={() => setIsHovered(true)} // Set hover state to true on mouse enter
                onMouseLeave={() => setIsHovered(false)} // Set hover state to false on mouse leave
              >
                {hasUserReported ? "You have reported this post" : "Report This Post"}
              </button>
            </>
          )}
        </div>

        {/* Admin: Hide/Unhide Button */}
        {isAdmin && (
          <button
            onClick={handleHidePost}
            className="button hide-button"
            disabled={isHiding}
            style={{ backgroundColor: isHiding ? "#6c757d" : "#ffc107" }}
          >
            {isHiding
              ? "Processing..."
              : post.isHidden
              ? "Unhide Post"
              : "Hide Post"}
          </button>
        )}

        {/* Comments Section */}
        <div className="comments-section">
          {/* Text area for creating a comment */}
          {isAuthenticated ? (
            <div className="comment-creation">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your comment here"
                style={{
                  width: "100%",
                  height: "100px",
                  padding: "10px",
                  fontSize: "14px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                  resize: "none",
                }}
              />
              <button
                onClick={handleSubmitComment}
                className="button"
                disabled={isSubmitting}
                style={{
                  marginTop: "10px",
                  padding: "10px 20px",
                  backgroundColor: "#94b0da",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                {isSubmitting ? "Submitting..." : "Post Comment"}
              </button>
            </div>
          ) : (
            <p>You must be logged in to post comments.</p>
          )}

          {/* Comment submission status */}
          {commentStatus && (
            <p className={`status-message ${commentStatus.type}`}>
              {commentStatus.message}
            </p>
          )}

          <h3>Comments:</h3>
          {post.commentsTree && post.commentsTree.length > 0 ? (
            <div className="comments-container">
              {renderComments(post.commentsTree)}
            </div>
          ) : (
            <p>No comments yet. Be the first to comment!</p>
          )}
        </div>

        {/* Report Form */}
        {showReportForm && (
          <div className="report-form-overlay">
            <div className="report-form-container">
              <h2>Report This Post</h2>
              {reportStatus && (
                <div
                  className={`report-status ${
                    reportStatus.type === "success" ? "success" : "error"
                  }`}
                >
                  {reportStatus.message}
                </div>
              )}
              <form onSubmit={handleReportSubmit}>
                <div className="form-group">
                  <label htmlFor="reportReason">Reason for Reporting:</label>
                  <textarea
                    id="reportReason"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                    placeholder="Describe why you're reporting this post..."
                  ></textarea>
                </div>
                <div className="form-actions">
                  <button type="submit" className="button" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                  <button
                    type="button"
                    className="button cancel-button"
                    onClick={() => setShowReportForm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin: Hide/Unhide Status */}
        {hideStatus && (
          <div
            className={`hide-status ${
              hideStatus.type === "success" ? "success" : "error"
            }`}
          >
            {hideStatus.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
