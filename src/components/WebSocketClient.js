import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const WebSocketClient = () => {
  const [connected, setConnected] = useState(false);
  const [matchEvents, setMatchEvents] = useState([]);
  const [matchComments, setMatchComments] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [userName, setUserName] = useState('ReactUser');
  const [userId, setUserId] = useState('user001');
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
   
    // Disable console logging from STOMP (correct way for @stomp/stompjs)
    stompClient.debug = () => {};

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
            id: Date.now(),
            type: 'notification'
          };
         
          setMatchComments(prevComments => [...prevComments, receivedMessage]);
          console.log('Received notification:', message.body);
        });

        // Subscribe to match comments topic
        stompClient.subscribe('/topic/matchComments', (message) => {
          const receivedMessage = {
            content: message.body,
            timestamp: new Date().toLocaleTimeString(),
            id: Date.now() + Math.random(),
            type: 'comment'
          };
         
          setMatchComments(prevComments => [...prevComments, receivedMessage]);
          console.log('Received match comment:', message.body);
        });

        // Subscribe to match events topic
        stompClient.subscribe('/topic/matchEvents', (message) => {
          const receivedMessage = {
            content: message.body,
            timestamp: new Date().toLocaleTimeString(),
            id: Date.now() + Math.random(),
            type: 'event'
          };
         
          setMatchEvents(prevEvents => [...prevEvents, receivedMessage]);
          console.log('Received match event:', message.body);
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

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return;
    
    setSending(true);
    
    const commentPayload = {
      commentId: `comment_${Date.now()}`,
      matchId: "match2",
      userId: userId,
      userName: userName,
      text: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      rating: 5
    };

    try {
      const response = await fetch('http://localhost:8080/football/liveToWatch/v3/addComment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(commentPayload)
      });

      if (response.ok) {
        console.log('Comment sent to Sports Platform:', commentPayload);
        setInputMessage('');
        
        // Add a local message to show it was sent
        const sentMessage = {
          content: `[SENT] ${inputMessage.trim()}`,
          timestamp: new Date().toLocaleTimeString(),
          id: Date.now() + '_sent',
          type: 'sent_comment'
        };
        setMatchComments(prevComments => [...prevComments, sentMessage]);
      } else {
        console.error('Failed to send comment:', response.status, response.statusText);
        alert('Failed to send comment. Make sure Sports Platform is running on port 8080.');
      }
    } catch (error) {
      console.error('Error sending comment:', error);
      alert('Error sending comment. Make sure Sports Platform is running on port 8080.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const clearMessages = () => {
    setMatchComments([]);
    setMatchEvents([]);
  };

  const sendTestMatchEvent = async () => {
    if (sending) return;
    
    setSending(true);
    
    const eventPayload = {
      eventId: `event_${Date.now()}`,
      matchId: "match2",
      playerId: userId,
      playerName: userName,
      eventType: "GOAL",
      minute: Math.floor(Math.random() * 90) + 1,
      description: `Goal scored by ${userName}!`,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('http://localhost:8080/football/liveToWatch/v3/addMatchEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(eventPayload)
      });

      if (response.ok) {
        console.log('Match event sent to Sports Platform:', eventPayload);
        
        // Add a local message to show it was sent
        const sentMessage = {
          content: `[SENT EVENT] Goal by ${userName} at minute ${eventPayload.minute}`,
          timestamp: new Date().toLocaleTimeString(),
          id: Date.now() + '_event_sent',
          type: 'sent_event'
        };
        setMatchEvents(prevEvents => [...prevEvents, sentMessage]);
      } else {
        console.error('Failed to send match event:', response.status, response.statusText);
        alert('Failed to send match event. Make sure Sports Platform is running on port 8080.');
      }
    } catch (error) {
      console.error('Error sending match event:', error);
      alert('Error sending match event. Make sure Sports Platform is running on port 8080.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden', padding: '0 10px', boxSizing: 'border-box' }}>
      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        Status: {connected ? 'Connected' : 'Disconnected'}
      </div>

      <div className="user-config">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="User Name"
            style={{ flex: 1 }}
          />
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID"
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <div className="message-input" style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your football comment..."
          disabled={sending}
          style={{ flex: 1 }}
        />
        <button 
          onClick={sendTestMatchEvent} 
          disabled={sending}
          style={{ minWidth: '120px', backgroundColor: '#24c54aff', color: 'White' }}
        >
          {sending ? 'Sending...' : 'Add Match Event'}
        </button>
        <button 
          onClick={sendMessage} 
          disabled={sending || !inputMessage.trim()}
          style={{ minWidth: '80px' ,backgroundColor: '#22afc8ff', color: 'White'  }}
        >
          {sending ? 'Sending...' : 'Add Comment'}
        </button>
        <button onClick={clearMessages}>
          Clear All
        </button>
      </div>

      <div style={{ margin: '20px 0', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
        <h4>🔄 End-to-End Flow Test</h4>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>
          1. Type a comment above and click "Add Comment" <br/>
          2. Comment/Event goes to Sports Platform API (MS 1)<br/>
          3. Sports Platform publishes to Kafka topic <br/>
          4. Football Consumer (MS 2) receives from Kafka <br/>
          5. MS2 broadcasts via WebSocket <br/>
          6. React UI displays the live message below
        </p>
      </div>

      <div className="live-containers" style={{ 
        display: 'flex', 
        gap: '20px', 
        marginTop: '20px', 
        flexWrap: 'wrap'
      }}>
        {/* Live Match Events Section */}
        <div className="events-container" style={{ 
          flex: 1, 
          minWidth: '280px',
          maxWidth: 'calc(50% - 10px)',
          border: '2px solid #28a745', 
          borderRadius: '8px', 
          padding: '15px',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ color: '#28a745', margin: '0 0 15px 0' }}>⚽ Live Match Events ({matchEvents.length})</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden' }}>
            {matchEvents.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No match events yet. Click "Add Match Event" to test!</p>
            ) : (
              matchEvents.map((event) => (
                <div key={event.id} 
                     style={{ 
                       margin: '8px 0', 
                       padding: '10px', 
                       backgroundColor: event.type === 'sent_event' ? '#d4edda' : '#f8f9fa',
                       border: '1px solid #28a745',
                       borderRadius: '5px',
                       wordWrap: 'break-word',
                       overflowWrap: 'break-word',
                       wordBreak: 'break-word',
                       whiteSpace: 'normal',
                       maxWidth: '100%'
                     }}>
                  <div style={{ fontSize: '12px', color: '#666', wordWrap: 'break-word' }}>{event.timestamp}</div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#28a745',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal'
                  }}>{event.content}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Chats Section */}
        <div className="comments-container" style={{ 
          flex: 1, 
          minWidth: '280px',
          maxWidth: 'calc(50% - 10px)',
          border: '2px solid #007bff', 
          borderRadius: '8px', 
          padding: '15px',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ color: '#007bff', margin: '0 0 15px 0' }}>💬 Live Chats ({matchComments.length})</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden' }}>
            {matchComments.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No comments yet. Add Comment</p>
            ) : (
              matchComments.map((comment) => (
                <div key={comment.id} 
                     style={{ 
                       margin: '8px 0', 
                       padding: '10px', 
                       backgroundColor: comment.type === 'sent_comment' ? '#cce7ff' : '#f8f9fa',
                       border: '1px solid #007bff',
                       borderRadius: '5px',
                       wordWrap: 'break-word',
                       overflowWrap: 'break-word',
                       wordBreak: 'break-word',
                       whiteSpace: 'normal',
                       maxWidth: '100%'
                     }}>
                  <div style={{ fontSize: '12px', color: '#666', wordWrap: 'break-word' }}>{comment.timestamp}</div>
                  <div style={{ 
                    color: '#007bff',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal'
                  }}>{comment.content}</div>
                </div>
              ))
            )}
          </div>
        </div>
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