import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TestForm } from './pages/TestForm';
import { AddQuestions } from './pages/AddQuestions';
import { PreviewPublish } from './pages/PreviewPublish';
import './App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />

          {/* Protected App Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard / Home */}
            <Route index element={<Dashboard />} />
            
            {/* Test Blueprint Form */}
            <Route path="tests/new" element={<TestForm />} />
            <Route path="tests/:id/edit" element={<TestForm />} />
            
            {/* Add MCQ Items */}
            <Route path="tests/:id/questions" element={<AddQuestions />} />
            
            {/* Preview & Publish */}
            <Route path="tests/:id/preview" element={<PreviewPublish />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
