import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { GoogleLogin } from '@react-oauth/google';
import LiquidEther from '../components/LiquidEther/LiquidEther';
import { InfinitySquareSnake } from '../components/InfinitySquareSnake';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [otp, setOtp] = useState('');

  const { login } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        if (data.requireVerification) {
           setNeedsVerification(true);
           setError(data.error);
        } else {
           setError(data.error || 'Login failed');
        }
      }
    } catch (err) {
      setError('Network error. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
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
  }

  const handleGoogleSuccess = async (credentialResponse) => {
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
        setError(data.error || 'Google Login failed');
      }
    } catch (err) {
      setError('Network error during Google login. Is the server running?');
    }
  };

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-900">
      <div className="absolute inset-0 z-0 transition-colors duration-300">
        <LiquidEther 
          colors={['#5227FF', '#FF9FFC', '#B497CF']} 
          lightMode={theme === 'light'}
          backgroundColor={theme === 'dark' ? '#111827' : '#f3f4f6'}
        />
      </div>
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl transition-colors duration-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white transition-colors duration-300">
          {needsVerification ? 'Verify Your Email' : 'Log In to BIT\'O PYQs'}
        </h2>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

        {!needsVerification ? (
          <>
            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed')}
                text="continue_with"
              />
            </div>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9FFC] disabled:opacity-60"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9FFC] disabled:opacity-60"
                  required
                  disabled={isLoading}
                />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-[#FF9FFC] text-gray-900 font-bold py-2 px-4 rounded-lg hover:opacity-90 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <InfinitySquareSnake className="text-gray-900 text-lg [--duration:2.5s]" />
                    Logging in...
                  </>
                ) : 'Log In'}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account? <Link to="/register" className="text-[#FF9FFC] hover:underline font-semibold">Sign up</Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">Please enter the 6-digit verification code sent to your email.</p>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-widest text-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9FFC] disabled:opacity-60"
                maxLength="6"
                required
                disabled={isLoading}
              />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-[#FF9FFC] text-gray-900 font-bold py-2 px-4 rounded-lg hover:opacity-90 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <InfinitySquareSnake className="text-gray-900 text-lg [--duration:2.5s]" />
                  Verifying...
                </>
              ) : 'Verify & Log In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}