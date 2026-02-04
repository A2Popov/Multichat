import React, { useState } from 'react';
import { chatService } from '../services/api';

function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('gpt-3.5-turbo');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { role: 'user', content: message };
    setMessages([...messages, userMessage]);
    setLoading(true);
    setMessage('');

    try {
      const response = await chatService.sendMessage(message, model);
      const aiMessage = { role: 'assistant', content: response.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = { 
        role: 'error', 
        content: 'Failed to send message. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Multichat</h1>
        <div style={styles.headerRight}>
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            style={styles.select}
          >
            <option value="gpt-3.5-turbo">GPT-3.5</option>
            <option value="gpt-4">GPT-4</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
          </select>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            Start a conversation by typing a message below.
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              style={{
                ...styles.message,
                ...(msg.role === 'user' ? styles.userMessage : 
                    msg.role === 'error' ? styles.errorMessage : 
                    styles.assistantMessage)
              }}
            >
              <div style={styles.messageRole}>
                {msg.role === 'user' ? 'You' : 
                 msg.role === 'error' ? 'Error' : 'Assistant'}
              </div>
              <div>{msg.content}</div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          style={styles.input}
        />
        <button 
          type="submit" 
          disabled={loading || !message.trim()}
          style={styles.button}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'white',
    borderBottom: '1px solid #ddd',
  },
  headerRight: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  select: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.9rem',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  emptyState: {
    textAlign: 'center',
    color: '#999',
    marginTop: '2rem',
  },
  message: {
    padding: '1rem',
    borderRadius: '8px',
    maxWidth: '70%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    color: 'white',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    border: '1px solid #ddd',
  },
  errorMessage: {
    alignSelf: 'center',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    color: '#721c24',
  },
  messageRole: {
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    gap: '0.5rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderTop: '1px solid #ddd',
  },
  input: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};

export default Chat;
