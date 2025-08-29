import React, { useState, useEffect, useRef } from 'react';
import matchService from '../services/matchService';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const UserDashboard = () => {
  const [allMatches, setAllMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  
  // Comment form states
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [newComment, setNewComment] = useState('');
  const [username, setUsername] = useState('');
  const [rating, setRating] = useState(5);

  // WebSocket states
  const [connected, setConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const [liveComments, setLiveComments] = useState([]);
  const [quickComment, setQuickComment] = useState('');
  const [sending, setSending] = useState(false);
  const stompClientRef = useRef(null);

  const WEBSOCKET_URL = 'http://localhost:8081/ws';

  // WebSocket connection effect - don't auto-connect, let user control
  useEffect(() => {
    // Don't auto-connect, let user control the connection
    return () => {
      disconnectWebSocket();
    };
  }, []);

  // WebSocket connection functions
  const connectWebSocket = () => {
    if (connected || stompClientRef.current) {
      showMessage('Already connected or connecting...', 'warning');
      return;
    }

    try {
      showMessage('Connecting to live feed...', 'success');
      const socket = new SockJS(WEBSOCKET_URL);
      const stompClient = Stomp.over(socket);
      stompClient.debug = () => {};

      stompClient.connect(
        {},
        (frame) => {
          console.log('User Dashboard connected to WebSocket:', frame);
          setConnected(true);
          stompClientRef.current = stompClient;
          showMessage('Live feed connected successfully!', 'success');

          // Subscribe to match events (read-only for users)
          stompClient.subscribe('/topic/matchEvents', (message) => {
            const receivedMessage = {
              content: message.body,
              timestamp: new Date().toLocaleTimeString(),
              id: Date.now() + Math.random(),
              type: 'live_event'
            };
            setLiveEvents(prevEvents => [...prevEvents, receivedMessage]);
          });

          // Subscribe to match comments
          stompClient.subscribe('/topic/matchComments', (message) => {
            const receivedMessage = {
              content: message.body,
              timestamp: new Date().toLocaleTimeString(),
              id: Date.now() + Math.random(),
              type: 'live_comment'
            };
            setLiveComments(prevComments => [...prevComments, receivedMessage]);
          });
        },
        (error) => {
          console.error('User WebSocket connection error:', error);
          setConnected(false);
          stompClientRef.current = null;
          showMessage('Failed to connect to live feed. Make sure WebSocket server is running on port 8081.', 'error');
        }
      );
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnected(false);
      showMessage('Error connecting to live feed: ' + error.message, 'error');
    }
  };

  const disconnectWebSocket = () => {
    if (stompClientRef.current) {
      stompClientRef.current.disconnect();
      stompClientRef.current = null;
      setConnected(false);
      showMessage('Disconnected from live feed', 'success');
      console.log('User Dashboard disconnected from WebSocket');
    }
  };

  const clearLiveFeeds = () => {
    setLiveEvents([]);
    setLiveComments([]);
  };

  // Quick comment sending (for fast user interaction)
  const sendQuickComment = async () => {
    if (!quickComment.trim() || !username.trim() || sending) {
      showMessage('Please enter both username and comment', 'error');
      return;
    }
    
    setSending(true);
    try {
      const matchComment = {
        commentid: null,
        matchid: parseInt(selectedMatchId) || 1,
        userid: null,
        username: username.trim(),
        text: quickComment.trim(),
        timestamp: new Date().toISOString(),
        rating: rating
      };

      await matchService.addComment(selectedMatchId || '1', matchComment);
      showMessage('Quick comment sent successfully!', 'success');
      setQuickComment('');
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error');
    } finally {
      setSending(false);
    }
  };

  // Show message with auto-hide
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Get all matches and categorize by status
  const handleGetAllMatches = async () => {
    setLoading(true);
    try {
      const matches = await matchService.getAllMatchDetails();
      
      // Filter out matches with null status and categorize by status
      const filteredMatches = matches.filter(match => match.matchStatus !== null);
      const live = filteredMatches.filter(match => match.matchStatus === 'live');
      const upcoming = filteredMatches.filter(match => match.matchStatus === 'upcoming');
      
      setAllMatches(filteredMatches);
      setLiveMatches(live);
      setUpcomingMatches(upcoming);
      
      showMessage(`Loaded ${filteredMatches.length} matches (${live.length} live, ${upcoming.length} upcoming)`, 'success');
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error');
      setAllMatches([]);
      setLiveMatches([]);
      setUpcomingMatches([]);
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

  // Handle match selection for detailed view
  const handleMatchSelect = async (match) => {
    setSelectedMatch(match);
    setSelectedMatchId(match.matchId.toString());
    setShowMatchDetails(true);
    
    // Auto-load comments for the selected match
    try {
      setLoading(true);
      const matchComments = await matchService.getComments(match.matchId);
      setComments(matchComments);
      showMessage(`Viewing ${match.homeTeamName} vs ${match.awayTeamName}`, 'success');
    } catch (error) {
      showMessage(`Error loading comments: ${error.message}`, 'error');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Clear match selection and go back to match list
  const handleBackToMatches = () => {
    setSelectedMatch(null);
    setShowMatchDetails(false);
    setComments([]);
    setSelectedMatchId('');
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h2>Matches & Comments</h2>
        <div className="connection-controls">
          <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            Live Feed: {connected ? 'Connected' : 'Disconnected'}
          </div>
          <button 
            onClick={connected ? disconnectWebSocket : connectWebSocket}
            className={`btn btn-sm ${connected ? 'btn-danger' : 'btn-success'}`}
            disabled={loading}
          >
            {connected ? 'Disconnect' : 'Connect Live Feed'}
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Quick User Actions */}
      <div className="form-section">
        <h3>Quick Comment</h3>
        <div className="quick-actions">
          <div className="form-grid">
            <div className="form-group">
              <input
                type="text"
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Quick comment..."
                value={quickComment}
                onChange={(e) => setQuickComment(e.target.value)}
                className="form-input"
                onKeyPress={(e) => e.key === 'Enter' && sendQuickComment()}
              />
            </div>
          </div>
          <div className="input-group">
            <button 
              onClick={sendQuickComment}
              disabled={sending || !quickComment.trim() || !username.trim()}
              className="btn btn-success"
            >
              {sending ? 'Sending...' : 'Quick Comment'}
            </button>
            <button 
              onClick={clearLiveFeeds}
              className="btn btn-secondary"
            >
              Clear Live Feeds
            </button>
          </div>
        </div>
      </div>

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
          {(liveMatches.length > 0 || upcomingMatches.length > 0) && (
            <button 
              onClick={() => {
                setAllMatches([]);
                setLiveMatches([]);
                setUpcomingMatches([]);
                setShowMatchDetails(false);
                setSelectedMatch(null);
              }}
              disabled={loading}
              className="btn btn-secondary"
            >
              Clear List
            </button>
          )}
        </div>
      </div>

      {/* Live Matches Section */}
      {liveMatches.length > 0 && !showMatchDetails && (
        <div className="live-matches-section">
          <h3>🔴 Live Matches ({liveMatches.length})</h3>
          <div className="matches-grid">
            {liveMatches.map((match) => (
              <div key={match.matchId} className="match-card user-match-card live-match">
                <div className="match-status live-status">● LIVE</div>
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
                    onClick={() => handleMatchSelect(match)}
                    className="btn btn-sm btn-success"
                    disabled={loading}
                  >
                    View Match Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Matches Section */}
      {upcomingMatches.length > 0 && !showMatchDetails && (
        <div className="upcoming-matches-section">
          <h3>📅 Upcoming Matches ({upcomingMatches.length})</h3>
          <div className="matches-grid">
            {upcomingMatches.map((match) => (
              <div key={match.matchId} className="match-card user-match-card upcoming-match">
                <div className="match-status upcoming-status">⏰ UPCOMING</div>
                <div className="match-id">Match ID: {match.matchId}</div>
                <div className="match-display">
                  <div className="team">
                    <strong>{match.homeTeamName}</strong>
                    <span className="score">-</span>
                  </div>
                  <div className="vs">VS</div>
                  <div className="team">
                    <strong>{match.awayTeamName}</strong>
                    <span className="score">-</span>
                  </div>
                </div>
                <div className="match-actions">
                  <button 
                    onClick={() => handleMatchSelect(match)}
                    className="btn btn-sm btn-info"
                    disabled={loading}
                  >
                    View Match Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Details View */}
      {showMatchDetails && selectedMatch && (
        <div className="match-details-view">
          <div className="match-details-header">
            <button 
              onClick={handleBackToMatches}
              className="btn btn-secondary"
              disabled={loading}
            >
              ← Back to Matches
            </button>
            <div className="match-info">
              <div className={`match-status ${selectedMatch.matchStatus}-status`}>
                {selectedMatch.matchStatus === 'live' ? '🔴 LIVE' : '📅 UPCOMING'}
              </div>
              <h3>{selectedMatch.homeTeamName} vs {selectedMatch.awayTeamName}</h3>
              <p>Match ID: {selectedMatch.matchId}</p>
            </div>
          </div>

          <div className="match-details-content">
            <div className="match-score-display">
              <div className="team-score">
                <div className="team-name">{selectedMatch.homeTeamName}</div>
                <div className="score-large">{selectedMatch.homeTeamScore || 0}</div>
              </div>
              <div className="vs-large">VS</div>
              <div className="team-score">
                <div className="team-name">{selectedMatch.awayTeamName}</div>
                <div className="score-large">{selectedMatch.awayTeamScore || 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Section - Only show when match is selected */}
      {showMatchDetails && selectedMatch && (
        <div className="form-section">
          <h3>Comments for {selectedMatch.homeTeamName} vs {selectedMatch.awayTeamName}</h3>
          
          {/* Add Comment Form */}
          <div className="comment-form">
            <h4>Add New Comment</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Match ID (Auto-selected)</label>
                <input
                  type="number"
                  value={selectedMatchId}
                  className="form-input"
                  disabled
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

        {/* Comments Display */}
        {comments.length > 0 && (
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
        </div>
      )}

      {/* Live Feeds */}
      <div className="live-feeds-section">
        <h3>Live Match Feeds</h3>
        <div className="live-feeds-container">
          {/* Live Events Feed (Read-only for users) */}
          <div className="live-feed events-feed">
            <h4>⚽ Live Events ({liveEvents.length})</h4>
            <div className="feed-content">
              {liveEvents.length === 0 ? (
                <p className="no-content">No live events yet...</p>
              ) : (
                liveEvents.slice(-10).map((event) => (
                  <div key={event.id} className="feed-item event-feed-item">
                    <div className="feed-timestamp">{event.timestamp}</div>
                    <div className="feed-content-text">{event.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Comments Feed */}
          <div className="live-feed comments-feed">
            <h4>💬 Live Comments ({liveComments.length})</h4>
            <div className="feed-content">
              {liveComments.length === 0 ? (
                <p className="no-content">No live comments yet...</p>
              ) : (
                liveComments.slice(-10).map((comment) => (
                  <div key={comment.id} className="feed-item comment-feed-item">
                    <div className="feed-timestamp">{comment.timestamp}</div>
                    <div className="feed-content-text">{comment.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h4>User Instructions:</h4>
        <ul>
          <li><strong>Quick Comment:</strong> Use the quick comment section to instantly share your thoughts</li>
          <li><strong>Live Feeds:</strong> Watch real-time match events and comments from other users</li>
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