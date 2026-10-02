import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export function useAuthFlow({ email, otp, setError, setSuccessMsg, setIsLoading }) {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError('');
    if (setSuccessMsg) setSuccessMsg('');
    setIsLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Network error. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    if (setSuccessMsg) setSuccessMsg('');
    setIsLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        if (setSuccessMsg) setSuccessMsg(data.message || 'Verification code resent successfully.');
      } else {
        setError(data.error || 'Failed to resend code.');
      }
    } catch (err) {
      setError('Network error. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse, context = 'Login') => {
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await response.json();
      if (response.ok) {
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        setError(data.error || `Google ${context} failed`);
      }
    } catch (err) {
      setError('Network error during Google login. Is the server running?');
    }
  };

  return { handleVerify, handleResendOtp, handleGoogleSuccess };
}
