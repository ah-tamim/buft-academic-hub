import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InstallPwaPromptProps {
  onInstallStateChange?: (installed: boolean) => void;
}

export function InstallPwaPrompt({ onInstallStateChange }: InstallPwaPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showTopPopup, setShowTopPopup] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if running inside installed standalone PWA app
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    // 2. Check if previously marked as installed in localStorage
    const hasBeenInstalled = localStorage.getItem('buft_pwa_is_installed') === 'true';

    if (isStandalone || hasBeenInstalled) {
      setIsInstalled(true);
      setShowTopPopup(false);
      if (onInstallStateChange) onInstallStateChange(true);
      return;
    }

    // 3. Check if user dismissed for the current browser session
    const sessionDismissed = sessionStorage.getItem('buft_pwa_top_prompt_session_dismissed');

    // Show popup after 800ms unless dismissed in current session
    if (!sessionDismissed) {
      const timer = setTimeout(() => {
        setShowTopPopup(true);
      }, 800);
      return () => clearTimeout(timer);
    }

    // Listen for Chrome/Edge 'beforeinstallprompt' event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!sessionStorage.getItem('buft_pwa_top_prompt_session_dismissed')) {
        setShowTopPopup(true);
      }
    };

    // Listen for successful PWA installation event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowTopPopup(false);
      setDeferredPrompt(null);
      // Permanently mark as installed so it never appears again
      localStorage.setItem('buft_pwa_is_installed', 'true');
      if (onInstallStateChange) onInstallStateChange(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstallStateChange]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setShowTopPopup(false);
          localStorage.setItem('buft_pwa_is_installed', 'true');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
    } else {
      // Fallback instruction trigger for browsers that don't support automated prompt
      alert('To install BUFT Academic HUB:\n\n1. Tap your browser menu (⋮ or Share icon).\n2. Select "Install App" or "Add to Home Screen".');
    }
  };

  // Close for the current browser session if user clicks X
  const dismissForSession = () => {
    setShowTopPopup(false);
    sessionStorage.setItem('buft_pwa_top_prompt_session_dismissed', 'true');
  };

  if (isInstalled || !showTopPopup) {
    return null;
  }

  return (
    <AnimatePresence>
      {showTopPopup && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.96 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="fixed top-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-[350px] z-50 no-print"
        >
          <div className="bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-xl shadow-slate-900/10 flex items-center justify-between gap-3 text-slate-800">
            
            {/* 3D Green & Gold BUFT Academic Hub App Icon */}
            <div className="relative flex-shrink-0">
              <img 
                src="/app-logo-combined.png" 
                alt="BUFT App Icon" 
                className="w-10 h-10 object-contain rounded-xl drop-shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icon-192.png';
                }}
              />
            </div>

            {/* App Title & Domain Subtitle */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[13px] text-slate-900 leading-tight truncate">
                Install BUFT Academic HUB
              </h4>
              <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                bufthub.vercel.app
              </p>
            </div>

            {/* Reddit-style "Install" Text Action & Dismiss */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstallClick}
                className="text-blue-600 hover:text-blue-700 font-bold text-xs px-3 py-1.5 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              >
                Install
              </button>
              <button
                onClick={dismissForSession}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
