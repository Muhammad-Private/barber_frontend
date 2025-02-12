import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import apiInstance from '../interfaces/axiosInstance';
import Cookies from 'js-cookie';
import { useAppSelector } from '../hooks/hooks';

interface ProtectedRoutesProps {
  children: JSX.Element;
}

const ProtectedRoutes: React.FC<ProtectedRoutesProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const {access_token} = useAppSelector((state) => state.loginSlice);
  

  // Validate the token locally
  const validateToken = (token: string): boolean => {
    try {
      const decoded: { exp?: number } = jwtDecode(token);
      if (!decoded.exp) return true; // Valid if no expiration is set
      const currentTime = Date.now() / 1000; // Convert to seconds
      return decoded.exp > currentTime; // Check expiration
    } 
    catch {
      return false; // Token is invalid
    }
  };

  // Refresh the token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await apiInstance.post('/RefreshToken');
      const newAccessToken = response.data.accessToken;

      if (newAccessToken) {
        setIsAuthenticated(true);
        // Optionally store the new access token (e.g., in Redux or memory)
        return true;
      } else {
        setIsAuthenticated(false);
        return false;
      }
    } 
    catch (error) 
    {
      console.error('Failed to refresh token:', error);
      Cookies.remove('refreshToken');
      setIsAuthenticated(false);
      return false;
    }
  };

  // Check authentication and handle token refresh
  const checkAuth = async () => {
    if (!access_token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    const isTokenValid = validateToken(access_token);
    if (!isTokenValid) {
      const refreshed = await refreshToken();
      if (!refreshed) {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(true);
    }
    setLoading(false); // End loading
  };

  useEffect(() => {
    checkAuth(); // Validate and refresh token on mount
  }, [access_token]); // Rerun if the accessToken changes

  if (loading) {
    return <div>Loading...</div>; // Placeholder for loading state
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />; // Redirect to login if not authenticated
  }

  return children; // Render the protected content
};

export default ProtectedRoutes;
