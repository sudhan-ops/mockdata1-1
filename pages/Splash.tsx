import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/ui/Logo';
import PermissionsPrimer from '../components/PermissionsPrimer';
import type { User } from '../types';

const Splash: React.FC = () => {
    const navigate = useNavigate();
    const { user, isInitialized } = useAuthStore();
    const [showPrimer, setShowPrimer] = useState(false);

    const getHomeRoute = (user: User | null) => {
        if (!user) return "/auth/login";
        return "/profile";
    };

    const proceedToApp = useCallback(() => {
        if (isInitialized) {
            if (user) {
                navigate(getHomeRoute(user), { replace: true });
            } else {
                navigate('/auth/login', { replace: true });
            }
        }
    }, [isInitialized, user, navigate, getHomeRoute]);

    useEffect(() => {
        if (!isInitialized) return;

        const checkPermissionsAndRedirect = async () => {
            const hasSeenPrimer = localStorage.getItem('hasSeenPermissionsPrimer');
            
            if (hasSeenPrimer) {
                proceedToApp();
                return;
            }

            if (navigator.permissions?.query) {
                try {
                    const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
                    const locationStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });

                    if (cameraStatus.state === 'granted' && locationStatus.state === 'granted') {
                        localStorage.setItem('hasSeenPermissionsPrimer', 'true');
                        proceedToApp();
                    } else if (cameraStatus.state === 'prompt' || locationStatus.state === 'prompt') {
                        setShowPrimer(true);
                    } else {
                        localStorage.setItem('hasSeenPermissionsPrimer', 'true');
                        proceedToApp();
                    }
                } catch (e) {
                    console.warn("Permission query failed, showing primer as fallback.", e);
                    setShowPrimer(true);
                }
            } else {
                setShowPrimer(true);
            }
        };

        const timer = setTimeout(checkPermissionsAndRedirect, 1500); // Wait for splash animation

        return () => clearTimeout(timer);
        
    }, [isInitialized, proceedToApp]);
    
    const handleAllowPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error("Camera permission was not granted:", err);
        }

        try {
            await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 0 });
            });
        } catch (err) {
            console.error("Location permission was not granted:", err);
        }

        localStorage.setItem('hasSeenPermissionsPrimer', 'true');
        setShowPrimer(false);
        proceedToApp();
    };

    const handleSkipPermissions = () => {
        localStorage.setItem('hasSeenPermissionsPrimer', 'true');
        setShowPrimer(false);
        proceedToApp();
    };

    if (showPrimer) {
        return <PermissionsPrimer onAllow={handleAllowPermissions} onSkip={handleSkipPermissions} />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
            <Logo className="h-16 mb-8" />
        </div>
    );
};

export default Splash;
