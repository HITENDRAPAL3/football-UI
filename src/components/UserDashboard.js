import React, { useState } from 'react';
import matchService from '../services/matchService';

const UserDashboard = () => {
  const [allMatches, setAllMatches] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  
  // Comment form states
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [newComment, setNewComment] = useState('');
  const [username, setUsername] = useState('');
  const [rating, setRating] = useState(5);

  // Show message with auto-hide
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Get all matches
  const handleGetAllMatches = async () => {
    setLoading(true);
    try {
      const matches = await matchService.getAllMatchDetails();
      setAllMatches(matches);
      showMessage(`Loaded ${matches.length} matches successfully!`, 'success');
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error');
      setAllMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Get comments for a match
  const handleGetComments = async (matchId) => {
    setLoading(true);
    setSelectedMatchId(matchId);
    try {
      const matchComments = await matchService.getComments(matchId);
      setComments(matchComments);
      showMessage(`Loaded ${matchComments.length} comments for match ${matchId}`, 'success');
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!selectedMatchId || !newComment.trim() || !username.trim()) {
      showMessage('Please fill in all required fields (Match ID, Username, Comment)', 'error');
      return;
    }

    setLoading(true);
    try {
      // Create MatchComment object with all required fields
      const matchComment = {
        commentid: null, // Backend will generate this
        matchid: parseInt(selectedMatchId),
        userid: null, // Could be generated or user-provided in a real system
        username: username.trim(),
        text: newComment.trim(),
        timestamp: new Date().toISOString(),
        rating: rating
      };

      await matchService.addComment(selectedMatchId, matchComment);
      showMessage('Comment added successfully!', 'success');
      setNewComment('');
      
      // Refresh comments
      await handleGetComments(selectedMatchId);
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Clear comment form
  const clearCommentForm = () => {
    setSelectedMatchId('');
    setNewComment('');
    setUsername('');
    setRating(5);
    setComments([]);
  };

  return (
    <div className="user-dashboard">
      <h2>Matches & Comments</h2>

      {/* Message Display */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Get All Matches Section */}
      <div className="form-section">
        <h3>All Matches</h3>
        <div className="input-group">
          <button 
            onClick={handleGetAllMatches}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Loading...' : 'Load All Matches'}
          </button>
          {allMatches.length > 0 && (
            <button 
              onClick={() => setAllMatches([])}
              disabled={loading}
              className="btn btn-secondary"
            >
              Clear List
            </button>
          )}
        </div>
      </div>

      {/* All Matches Display */}
      {allMatches.length > 0 && (
        <div className="all-matches">
          <h3>Available Matches ({allMatches.length})</h3>
          <div className="matches-grid">
            {allMatches.map((match) => (
              <div key={match.matchId} className="match-card user-match-card">
                <div className="match-id">Match ID: {match.matchId}</div>
                <div className="match-display">
                  <div className="team">
                    <strong>{match.homeTeamName}</strong>
                    <span className="score">{match.homeTeamScore || 0}</span>
                  </div>
                  <div className="vs">VS</div>
                  <div className="team">
                    <strong>{match.awayTeamName}</strong>
                    <span className="score">{match.awayTeamScore || 0}</span>
                  </div>
                </div>
                <div className="match-actions">
                  <button 
                    onClick={() => handleGetComments(match.matchId)}
                    className="btn btn-sm btn-info"
                    disabled={loading}
                  >
                    View Comments
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedMatchId(match.matchId.toString());
                      // Scroll to comment form
                      document.querySelector('.comment-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="btn btn-sm btn-outline"
                    disabled={loading}
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="form-section">
        <h3>Comments Management</h3>
        
        {/* Add Comment Form */}
        <div className="comment-form">
          <h4>Add New Comment</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Match ID</label>
              <input
                type="number"
                placeholder="Enter Match ID"
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Username*</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Rating (1-5 stars)</label>
            <div className="rating-container">
              <select
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="form-input rating-select"
              >
                <option value={1}>⭐ (1 star)</option>
                <option value={2}>⭐⭐ (2 stars)</option>
                <option value={3}>⭐⭐⭐ (3 stars)</option>
                <option value={4}>⭐⭐⭐⭐ (4 stars)</option>
                <option value={5}>⭐⭐⭐⭐⭐ (5 stars)</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Your Comment*</label>
            <textarea
              placeholder="Share your thoughts about this match..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="form-input comment-textarea"
              rows="4"
              required
            />
          </div>
          
          <div className="comment-actions">
            <button 
              onClick={handleAddComment}
              disabled={loading}
              className="btn btn-success"
            >
              {loading ? 'Adding...' : 'Add Comment'}
            </button>
            <button 
              onClick={clearCommentForm}
              disabled={loading}
              className="btn btn-secondary"
            >
              Clear Form
            </button>
          </div>
        </div>
      </div>

      {/* Comments Display */}
      {comments.length > 0 && selectedMatchId && (
        <div className="comments-display">
          <h3>Comments for Match {selectedMatchId} ({comments.length})</h3>
          <div className="comments-list">
            {comments.map((comment, index) => (
              <div key={comment.commentid || index} className="comment-item">
                <div className="comment-header">
                  <div className="comment-user">
                    <strong>{comment.username || 'Anonymous'}</strong>
                    {comment.rating && (
                      <span className="comment-rating">
                        {'⭐'.repeat(comment.rating)}
                      </span>
                    )}
                  </div>
                  {comment.timestamp && (
                    <span className="comment-time">
                      {new Date(comment.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="comment-text">
                  {comment.text || comment.comment || comment}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="help-section">
        <h4>User Instructions:</h4>
        <ul>
          <li><strong>View Matches:</strong> Click "Load All Matches" to see all available matches</li>
          <li><strong>View Comments:</strong> Click "View Comments" on any match card to see existing comments with ratings and usernames</li>
          <li><strong>Add Comment:</strong> Fill in all required fields:</li>
          <ul>
            <li>Match ID (required)</li>
            <li>Username (required)</li>
            <li>Rating (1-5 stars)</li>
            <li>Comment text (required)</li>
          </ul>
          <li><strong>Quick Comment:</strong> Click "Add Comment" on a match card to auto-fill the Match ID and scroll to the form</li>
        </ul>
      </div>
    </div>
  );
};

export default UserDashboard;