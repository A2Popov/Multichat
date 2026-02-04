import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, authService } from '../services/api';

function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    is_admin: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.listUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await userService.createUser(formData);
      setSuccess('User created successfully!');
      setFormData({ username: '', password: '', is_admin: false });
      setShowCreateForm(false);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Admin Panel</h1>
        <div style={styles.headerRight}>
          <button 
            onClick={() => navigate('/chat')}
            style={styles.chatButton}
          >
            Go to Chat
          </button>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2>User Management</h2>
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={styles.createButton}
            >
              {showCreateForm ? 'Cancel' : 'Create User'}
            </button>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          {showCreateForm && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Username:</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Password:</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  checked={formData.is_admin}
                  onChange={(e) => setFormData({...formData, is_admin: e.target.checked})}
                  id="is_admin"
                />
                <label htmlFor="is_admin" style={styles.checkboxLabel}>
                  Admin privileges
                </label>
              </div>
              <button type="submit" style={styles.submitButton}>
                Create User
              </button>
            </form>
          )}
        </div>

        <div style={styles.section}>
          <h2>Users</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Admin</th>
                <th style={styles.th}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={styles.td}>{user.id}</td>
                  <td style={styles.td}>{user.username}</td>
                  <td style={styles.td}>{user.is_admin ? 'Yes' : 'No'}</td>
                  <td style={styles.td}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
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
  },
  chatButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  content: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  section: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  createButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  form: {
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  checkboxLabel: {
    marginLeft: '0.5rem',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  error: {
    color: '#dc3545',
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
    border: '1px solid #f5c6cb',
  },
  success: {
    color: '#155724',
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: '#d4edda',
    borderRadius: '4px',
    border: '1px solid #c3e6cb',
  },
  loading: {
    textAlign: 'center',
    marginTop: '2rem',
    fontSize: '1.2rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem',
    borderBottom: '2px solid #ddd',
    fontWeight: '600',
  },
  td: {
    padding: '0.75rem',
    borderBottom: '1px solid #ddd',
  },
};

export default Admin;
