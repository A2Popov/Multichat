import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import { authService } from './services/api';

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            authService.isAuthenticated() ? 
            <Navigate to="/chat" replace /> : 
            <Login />
          } 
        />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
