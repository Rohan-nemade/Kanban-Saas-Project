import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
  const setUser = useStore((state) => state.setUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userId = params.get('userId');
    if (token) {
      setUser({ id: userId }, token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setReady(true); // only render routes after token is handled
  }, [setUser]);

  if (!ready) return null; // prevent premature PrivateRoute evaluation

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
          }
        />
        <Route
          path="/project/:projectId"
          element={
            <PrivateRoute>
              <ProjectBoard />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;