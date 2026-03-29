import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';

function PrivateRoute({ children }) {
  const token = useStore((state) => state.token);
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
          <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
        
        <Route
          path="/project/:projectId"
          element={
          <PrivateRoute>
              <ProjectBoard />
            </PrivateRoute>
          } />
        
      </Routes>
    </div>);

}

export default App;