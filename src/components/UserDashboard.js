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
    if (!selectedMatchId || !newComment.trim()) {
      showMessage('Please select a match and enter a comment', 'error');
      return;
    }

    setLoading(true);
    try {
      await matchService.addComment(selectedMatchId, newComment.trim());
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
                    onClick={() => setSelectedMatchId(match.matchId.toString())}
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
            <label>Your Comment</label>
            <textarea
              placeholder="Share your thoughts about this match..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="form-input comment-textarea"
              rows="4"
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
              <div key={index} className="comment-item">
                <div className="comment-text">{comment.comment || comment}</div>
                <div className="comment-meta">
                  {comment.timestamp && (
                    <span className="comment-time">
                      {new Date(comment.timestamp).toLocaleString()}
                    </span>
                  )}
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
          <li><strong>View Comments:</strong> Click "View Comments" on any match card to see existing comments</li>
          <li><strong>Add Comment:</strong> Enter a Match ID and your comment, then click "Add Comment"</li>
          <li><strong>Quick Comment:</strong> Click "Add Comment" on a match card to auto-fill the Match ID</li>
        </ul>
      </div>
    </div>
  );
};

export default UserDashboard;