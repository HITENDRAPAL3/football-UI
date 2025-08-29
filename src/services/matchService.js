const API_BASE_URL = 'http://localhost:8080/football/liveToWatch/v3';

class MatchService {
  
  // Get match details by ID
  async getMatchDetails(matchId) {
    try {
      const response = await fetch(`${API_BASE_URL}/getMatchDetails?matchId=${matchId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get match details: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting match details:', error);
      throw error;
    }
  }

  // Add new match details
  async addMatchDetails(matchDetails) {
    try {
      const response = await fetch(`${API_BASE_URL}/addMatchDetails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchDetails),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add match details: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error adding match details:', error);
      throw error;
    }
  }

  // Update match details
  async updateMatchDetails(matchId, matchDetails) {
    try {
      const response = await fetch(`${API_BASE_URL}/patchByMatchId?matchId=${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchDetails),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update match details: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error updating match details:', error);
      throw error;
    }
  }

  // Delete match details
  async deleteMatchDetails(matchId) {
    try {
      const response = await fetch(`${API_BASE_URL}/deleteByMatchId?matchId=${matchId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete match details: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error deleting match details:', error);
      throw error;
    }
  }

  // Get all match details
  async getAllMatchDetails() {
    try {
      const response = await fetch(`${API_BASE_URL}/getAllMatchDetails`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get all match details: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting all match details:', error);
      throw error;
    }
  }
}

export default new MatchService();