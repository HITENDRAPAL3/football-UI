import React, { useState } from 'react';
import WebSocketClient from './components/WebSocketClient';
import MatchDetailsManager from './components/MatchDetailsManager';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('websocket');

  return (
    <div className="App">
      <div className="container">
        <h1>Football Focus</h1>
        
        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'websocket' ? 'active' : ''}`}
            onClick={() => setActiveTab('websocket')}
          >
            Live WebSocket
          </button>
          <button 
            className={`nav-tab ${activeTab === 'crud' ? 'active' : ''}`}
            onClick={() => setActiveTab('crud')}
          >
            Match Management
          </button>
        </div>

        {/* Content based on active tab */}
        <div className="tab-content">
          {activeTab === 'websocket' && <WebSocketClient />}
          {activeTab === 'crud' && <MatchDetailsManager />}
        </div>
      </div>
    </div>
  );
}

export default App;