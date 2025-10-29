import React, { useState } from 'react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom'; // Assuming react-router-dom is used for navigation

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data, error } = await authService.signInWithPassword(email, password);

    if (error) {
      setError(error.message);
    } else if (data?.user) {
      // Assuming successful login redirects to a dashboard or home page
      navigate('/profile');
    }
    setIsLoading(false);
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-white text-center mb-2">Sign In</h2>
      <p className="text-center text-gray-400 mb-6">Enter your credentials to access your account.</p>
      <form onSubmit={handleSubmit}>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="mb-4">
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon="mail"
              />
            </div>
            <div className="mb-6">
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon="lock"
              />
            </div>
            <div className="text-right mb-6">
              <a href="/forgot-password" className="text-blue-400 hover:underline text-sm">Forgot your password?</a>
            </div>
            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
            <div className="flex items-center my-6">
              <hr className="flex-grow border-gray-700" />
              <span className="mx-4 text-gray-500">OR</span>
              <hr className="flex-grow border-gray-700" />
            </div>
            <Button type="button" variant="primary" className="w-full flex items-center justify-center"
              aria-label="Sign in with Google"
            >
              <img src="/images/google-icon.svg" alt="Google" className="w-5 h-5 mr-2" />
              Sign in with Google
            </Button>
          </form>
    </>
  );
}