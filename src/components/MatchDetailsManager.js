import React, { useState } from 'react';
import matchService from '../services/matchService';

const MatchDetailsManager = () => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [allMatches, setAllMatches] = useState([]); // New state for all matches
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  
  // Form states
  const [matchId, setMatchId] = useState('');
  const [homeTeamName, setHomeTeamName] = useState('');
  const [homeTeamScore, setHomeTeamScore] = useState('');
  const [awayTeamName, setAwayTeamName] = useState('');
  const [awayTeamScore, setAwayTeamScore] = useState('');

  // Clear form and messages
  const clearForm = () => {
    setMatchId('');
    setHomeTeamName('');
    setHomeTeamScore('');
    setAwayTeamName('');
    setAwayTeamScore('');
    setCurrentMatch(null);
    setMessage('');
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

  // Get match details
  const handleGetMatch = async () => {
    if (!matchId.trim()) {
      showMessage('Please enter a match ID', 'error');
      return;
    }

    setLoading(true);
    try {
      const match = await matchService.getMatchDetails(matchId);
      setCurrentMatch(match);
      
      // Populate form with current data
      setHomeTeamName(match.homeTeamName || '');
      setHomeTeamScore(match.homeTeamScore?.toString() || '');
      setAwayTeamName(match.awayTeamName || '');
      setAwayTeamScore(match.awayTeamScore?.toString() || '');
      
      showMessage('Match details loaded successfully!', 'success');
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error');
      setCurrentMatch(null);
    } finally {
      setLoading(false);
    }
  };

  // Add new match
  const handleAddMatch = async () => {
    if (!matchId.trim() || !homeTeamName.trim() || !awayTeamName.trim()) {
      showMessage('Please fill in Match ID, Home Team, and Away Team', 'error');
      return;
    }

    setLoading(true);
    try {
      const matchDetails = {
        matchId: parseInt(matchId),
        homeTeamName: homeTeamName.trim(),
        homeTeamScore: homeTeamScore ? parseInt(homeTeamScore) : null,
        awayTeamName: awayTeamName.trim(),
        awayTeamScore: awayTeamScore ? parseInt(awayTeamScore) : null
      };

      await matchService.addMatchDetails(matchDetails);
      showMessage('Match details added successfully!', 'success');
      
      // Refresh the current match data
      await handleGetMatch();
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update match
  const handleUpdateMatch = async () => {
    if (!matchId.trim()) {
      showMessage('Please enter a match ID', 'error');
      return;
    }

    setLoading(true);
    try {
      const updateData = {};
      
      // Only include non-empty fields for partial update
      if (homeTeamName.trim()) updateData.homeTeamName = homeTeamName.trim();
      if (homeTeamScore !== '') updateData.homeTeamScore = parseInt(homeTeamScore);
      if (awayTeamName.trim()) updateData.awayTeamName = awayTeamName.trim();
      if (awayTeamScore !== '') updateData.awayTeamScore = parseInt(awayTeamScore);

      if (Object.keys(updateData).length === 0) {
        showMessage('Please provide at least one field to update', 'error');
        return;
      }

      await matchService.updateMatchDetails(matchId, updateData);
      showMessage('Match details updated successfully!', 'success');
      
      // Refresh the current match data
      await handleGetMatch();
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete match
  const handleDeleteMatch = async () => {
    if (!matchId.trim()) {
      showMessage('Please enter a match ID', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete match ${matchId}?`)) {
      return;
    }

    setLoading(true);
    try {
      await matchService.deleteMatchDetails(matchId);
      showMessage('Match details deleted successfully!', 'success');
      clearForm();
      // Refresh all matches list if it's currently displayed
      if (allMatches.length > 0) {
        await handleGetAllMatches();
      }
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="match-details-manager">
      <h2>Match Details Management</h2>

      {/* Message Display */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Match ID Input */}
      <div className="form-section">
        <h3>Match ID</h3>
        <div className="input-group">
          <input
            type="number"
            placeholder="Enter Match ID"
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            className="form-input"
          />
          <button 
            onClick={handleGetMatch}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Loading...' : 'Get Match'}
          </button>
        </div>
      </div>

      {/* Current Match Display */}
      {currentMatch && (
        <div className="current-match">
          <h3>Current Match Details</h3>
          <div className="match-display">
            <div className="team">
              <strong>{currentMatch.homeTeamName}</strong>
              <span className="score">{currentMatch.homeTeamScore}</span>
            </div>
            <div className="vs">VS</div>
            <div className="team">
              <strong>{currentMatch.awayTeamName}</strong>
              <span className="score">{currentMatch.awayTeamScore}</span>
            </div>
          </div>
        </div>
      )}

      {/* Get All Matches Section */}
      <div className="form-section">
        <h3>All Match Details</h3>
        <div className="input-group">
          <button 
            onClick={handleGetAllMatches}
            disabled={loading}
            className="btn btn-info"
          >
            {loading ? 'Loading...' : 'Get All Matches'}
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
          <h3>All Matches ({allMatches.length})</h3>
          <div className="matches-grid">
            {allMatches.map((match) => (
              <div key={match.matchId} className="match-card">
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
                <button 
                  onClick={() => {
                    setMatchId(match.matchId.toString());
                    handleGetMatch();
                  }}
                  className="btn btn-sm btn-outline"
                >
                  Load Match
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="form-section">
        <h3>Match Details Form</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Home Team Name</label>
            <input
              type="text"
              placeholder="Enter home team name"
              value={homeTeamName}
              onChange={(e) => setHomeTeamName(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label>Home Team Score</label>
            <input
              type="number"
              placeholder="Enter home team score"
              value={homeTeamScore}
              onChange={(e) => setHomeTeamScore(e.target.value)}
              className="form-input"
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label>Away Team Name</label>
            <input
              type="text"
              placeholder="Enter away team name"
              value={awayTeamName}
              onChange={(e) => setAwayTeamName(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label>Away Team Score</label>
            <input
              type="number"
              placeholder="Enter away team score"
              value={awayTeamScore}
              onChange={(e) => setAwayTeamScore(e.target.value)}
              className="form-input"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          onClick={handleAddMatch}
          disabled={loading}
          className="btn btn-success"
        >
          {loading ? 'Adding...' : 'Add Match'}
        </button>
        
        <button 
          onClick={handleUpdateMatch}
          disabled={loading}
          className="btn btn-warning"
        >
          {loading ? 'Updating...' : 'Update Match'}
        </button>
        
        <button 
          onClick={handleDeleteMatch}
          disabled={loading}
          className="btn btn-danger"
        >
          {loading ? 'Deleting...' : 'Delete Match'}
        </button>
        
        <button 
          onClick={clearForm}
          disabled={loading}
          className="btn btn-secondary"
        >
          Clear Form
        </button>
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h4>Instructions:</h4>
        <ul>
          <li><strong>Get:</strong> Enter Match ID and click "Get Match" to load existing data</li>
          <li><strong>Get All:</strong> Click "Get All Matches" to load and display all matches. Click "Load Match" on any card to edit it</li>
          <li><strong>Add:</strong> Fill in Match ID, team names (required), and scores (optional), then click "Add Match"</li>
          <li><strong>Update:</strong> Enter Match ID, modify any fields you want to change, then click "Update Match"</li>
          <li><strong>Delete:</strong> Enter Match ID and click "Delete Match" (confirmation required)</li>
        </ul>
      </div>
    </div>
  );
};

export default MatchDetailsManager;