import React, { useState } from 'react';
import WebSocketClient from './components/WebSocketClient';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('websocket');
  const [userRole, setUserRole] = useState('user'); // 'admin' or 'user'

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>Football Focus</h1>
          
          {/* Role Selector */}
          <div className="role-selector">
            <label>Login as:</label>
            <select 
              value={userRole} 
              onChange={(e) => {
                setUserRole(e.target.value);
                setActiveTab('websocket'); // Reset to default tab when role changes
              }}
              className="role-select"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'websocket' ? 'active' : ''}`}
            onClick={() => setActiveTab('websocket')}
          >
            Live WebSocket
          </button>
          
          {userRole === 'admin' ? (
            <button 
              className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Admin Dashboard
            </button>
          ) : (
            <button 
              className={`nav-tab ${activeTab === 'user' ? 'active' : ''}`}
              onClick={() => setActiveTab('user')}
            >
              Matches & Comments
            </button>
          )}
        </div>

        {/* Content based on active tab and role */}
        <div className="tab-content">
          {activeTab === 'websocket' && <WebSocketClient />}
          {activeTab === 'admin' && userRole === 'admin' && <AdminDashboard />}
          {activeTab === 'user' && userRole === 'user' && <UserDashboard />}
        </div>
      </div>
    </div>
  );
}

export default App;