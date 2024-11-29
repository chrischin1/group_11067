import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import "../../app/globals.css"; // Correct path to globals.css from the current file
import Navbar from "@/components/navbar";

const CommentDetail = () => {
  const router = useRouter();
  const { id, commentId } = router.query; // Get the comment ID from the URL
  const [comment, setComment] = useState<any>(null);
  const [replies, setReplies] = useState<any>(null);

  useEffect(() => {
    if (id && commentId) {
      // Fetch comment data from your API using the post ID
      const fetchComment = async () => {
        try {
          const response = await fetch(`/api/blogposts/${id}/comments/${commentId}`);
          if (response.ok) {
            const data = await response.json();
            setComment(data.comment);
            setReplies(data.replies);
          } else {
            console.error("Failed to fetch comment");
          }
        } catch (error) {
          console.error("Error fetching comment:", error);
        }
      };

      fetchComment();
    }
  }, [id]);

  const handleEditComment = () => {
    // Navigate to the blog post edit page
    router.push({
      pathname: `/editcomment`,
      query: {
        id: comment.id,
      },
    });
  };

  const handleRateComment = () => {
    // Navigate to the blog post rating page
    router.push({
      pathname: `/rate`,
      query: {
        commentId: comment.id,
        postId: -1,
      },
    });
  };

  const handleReply = (commentId: number) => {
    // Respond to a comment
    router.push({
      pathname: `/blogsearch/comment`,
      query: {
        postId: id,
        parentId: commentId,
      },
    });
  };

  if (!comment) {
    return <div>Loading...</div>;
  }

  return (
    <div className="template-detail-container">
      <Navbar />
      <h3 className="template-title">{comment.user.firstName + " " + comment.user.lastName}</h3>
      <h3 className="template-title">{comment.ratings.length > 0 ? `Average Rating: ${(comment.ratings.reduce( ( p: number, c: {value: number} ) => p + c.value, 0 ) / comment.ratings.length)}` : ("No ratings.")}</h3>
      <p className="template-desc">{comment.body}</p>

      <div className="template-tags">
        <h3>Replies:</h3>
        {comment.replies.map((comment: { id: number, user: {firstName: string, lastName: string}, body: string }) => (
          <div key={comment.user.firstName + " " + comment.user.lastName} className="template-tag" onClick={() => handleReply(comment.id)}>
            <h6>{comment.user.firstName + " " + comment.user.lastName}</h6>
            <p>{comment.body}</p>
          </div>
        ))}
      </div>
      {/* Button to edit comment */}
      <button onClick={handleEditComment} className="button">
        Edit This Comment
      </button>
      {/* Button to rate comment */}
      <button onClick={handleRateComment} className="button">
        Rate This Comment
      </button>
    </div>
  );
};

export default CommentDetail;
