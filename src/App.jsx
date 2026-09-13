import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import CallModal from './components/CallModal';
import IncomingCallNotification from './components/IncomingCallNotification';
import Login from './pages/Login';
import LoginQR from './pages/LoginQR';
import Register from './pages/Register';
import Chat from './pages/Chat';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/login-qr" element={<LoginQR />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Chat />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          <CallProvider>
            <AppRoutes />
            <CallModal />
            <IncomingCallNotification />
          </CallProvider>
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
