import React, { useState, useEffect } from 'react';
// Fix: Use inline type import for SubmitHandler
import { useForm, type SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
// Fix: Import InferType from yup
import type { InferType } from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';
import { Mail, Lock } from 'lucide-react';
import { authService } from '../../services/authService';


const emailValidationSchema = yup.object({
    email: yup.string().email('Must be a valid email').required('Email is required'),
    password: yup.string().required('Password is required'),
}).defined();
// Fix: Use imported InferType
type EmailFormInputs = InferType<typeof emailValidationSchema>;


const getHomeRoute = (user: User) => {
    // After login, all users land on their profile page.
    return "/profile";
};

// Centralized friendly error message handler
const getFriendlyAuthError = (errorCode: string): string => {
    if (errorCode.includes('auth/too-many-requests')) {
        return 'Access has been temporarily disabled due to too many requests. Please try again later or reset your password.';
    }
    if (errorCode.includes('auth/popup-closed-by-user')) {
        return ''; // Don't show an error if they just close the popup
    }
    // For all other login errors (invalid credentials, unauthorized app user, etc.), show the custom message.
    console.error("Unhandled auth error:", errorCode);
    return 'An unexpected error occurred. Please contact Sudhan for access.';
};


const Login: React.FC = () => {
    const { loginWithEmail, loginWithGoogle } = useAuthStore();
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Email form
    const { register: registerEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors, isSubmitting: isEmailSubmitting } } = useForm<EmailFormInputs>({
        // FIX: Cast resolver to resolve type incompatibility between yup and react-hook-form.
        resolver: yupResolver(emailValidationSchema) as any,
    });

    const onEmailSubmit: SubmitHandler<EmailFormInputs> = async (data) => {
        setError('');
        const { error: authError, user } = await loginWithEmail(data.email, data.password);
        if (authError) {
            setError(getFriendlyAuthError(authError.message));
        } else if (user) {
            navigate(getHomeRoute(user), { replace: true });
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        const { error: authError, user } = await loginWithGoogle();
        if (authError) {
            if (authError.message === 'auth/unauthorized-domain-user') {
                // Redirect non-domain users to the company website
                window.location.href = 'https://paradigmfms.com/';
                return; // Stop further execution
            }
            const friendlyError = getFriendlyAuthError(authError.message);
            if (friendlyError) setError(friendlyError);
        } else if (user) {
            navigate(getHomeRoute(user), { replace: true });
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-6">
                 <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <Input id="email" type="email" autoComplete="email" placeholder="Email Address" registration={registerEmail('email')} error={emailErrors.email?.message} className="pl-11 !bg-white/10 !text-white !border-white/20 placeholder:!text-gray-300" />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <Input id="password" type="password" autoComplete="current-password" placeholder="Password" registration={registerEmail('password')} error={emailErrors.password?.message} className="pl-11 !bg-white/10 !text-white !border-white/20 placeholder:!text-gray-300" />
                </div>
                <div className="flex items-center justify-end"><Link to="/auth/forgot-password" className="text-sm font-medium text-white/80 hover:text-white">Forgot your password?</Link></div>
                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                <Button type="submit" className="w-full" isLoading={isEmailSubmitting} size="lg">Sign in</Button>
            </form>
            
            <div className="auth-separator">OR</div>
            <button type="button" onClick={handleGoogleLogin} className="google-signin-btn">
                <svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.487-11.181-8.264l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.508,44,30.021,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                Sign in with Google
            </button>
        </div>
    );
};
export default Login;