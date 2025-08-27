import React from 'react';
import WebSocketClient from './components/WebSocketClient';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="container">
        <h1>Football Focus</h1>
        <WebSocketClient />
      </div>
    </div>
  );
}

export default App;
