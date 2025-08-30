import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

interface AuthRedirectProps {
  children: React.ReactNode;
}

export const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      // If user is logged in and is a fan, redirect to fan dashboard
      if (user.user_type === 'fan') {
        navigate(`/fan/${user.id}`, { replace: true });
      }
      // If user is logged in but not a fan, let them stay on current page
    }
  }, [user, isLoading, navigate]);

  // Show children while loading or if user is not a fan
  return <>{children}</>;
};