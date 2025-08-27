import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const WebSocketClient = () => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const stompClientRef = useRef(null);

  const WEBSOCKET_URL = 'http://localhost:8081/ws'; // Your Spring Boot WebSocket endpoint

  useEffect(() => {
    connect();
   
    // Cleanup on component unmount
    return () => {
      disconnect();
    };
  }, []);

  const connect = () => {
    const socket = new SockJS(WEBSOCKET_URL);
    const stompClient = Stomp.over(socket);
   
    // Disable console logging from STOMP
    stompClient.debug = null;

    stompClient.connect(
      {},
      (frame) => {
        console.log('Connected to WebSocket:', frame);
        setConnected(true);
        stompClientRef.current = stompClient;

        // Subscribe to notifications topic
        stompClient.subscribe('/topic/notifications', (message) => {
          const receivedMessage = {
            content: message.body,
            timestamp: new Date().toLocaleTimeString(),
            id: Date.now()
          };
         
          setMessages(prevMessages => [...prevMessages, receivedMessage]);
          console.log('Received message:', message.body);
        });
      },
      (error) => {
        console.error('WebSocket connection error:', error);
        setConnected(false);
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 5000);
      }
    );
  };

  const disconnect = () => {
    if (stompClientRef.current) {
      stompClientRef.current.disconnect();
      stompClientRef.current = null;
      setConnected(false);
      console.log('Disconnected from WebSocket');
    }
  };

  const sendMessage = () => {
    if (stompClientRef.current && connected && inputMessage.trim()) {
      stompClientRef.current.send('/app/sendMessage', {}, inputMessage);
      console.log('Message sent:', inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div>
      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        Status: {connected ? 'Connected' : 'Disconnected'}
      </div>

      <div className="message-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your message"
          disabled={!connected}
        />
        <button onClick={sendMessage} disabled={!connected || !inputMessage.trim()}>
          Send
        </button>
        <button onClick={clearMessages}>
          Clear
        </button>
      </div>

      <div className="messages-container">
        <h3>Live Messages ({messages.length})</h3>
        {messages.length === 0 ? (
          <p>No messages yet. Send a message or wait for incoming notifications.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="message">
              <div className="message-time">{message.timestamp}</div>
              <div className="message-content">{message.content}</div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={connected ? disconnect : connect}>
          {connected ? 'Disconnect' : 'Reconnect'}
        </button>
      </div>
    </div>
  );
};

export default WebSocketClient;