import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);
      navigate('/dashboard');
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Signing you in...</p>
    </div>
  );
}