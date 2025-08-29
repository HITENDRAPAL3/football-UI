import React, { useState } from 'react';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import './App.css';

function App() {
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
              onChange={(e) => setUserRole(e.target.value)}
              className="role-select"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        
        {/* Role-based Dashboard */}
        <div className="dashboard-content">
          {userRole === 'admin' ? <AdminDashboard /> : <UserDashboard />}
        </div>
      </div>
    </div>
  );
}

export default App;