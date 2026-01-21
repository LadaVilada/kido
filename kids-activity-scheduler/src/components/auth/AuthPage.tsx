'use client';

import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

type AuthMode = 'login' | 'signup' | 'forgot-password';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  const handleForgotPassword = () => {
    setMode('forgot-password');
  };

  const handleBackToLogin = () => {
    setMode('login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {mode === 'login' && (
          <LoginForm 
            onToggleMode={handleToggleMode}
            onForgotPassword={handleForgotPassword}
          />
        )}
        
        {mode === 'signup' && (
          <SignUpForm onToggleMode={handleToggleMode} />
        )}
        
        {mode === 'forgot-password' && (
          <ForgotPasswordForm onBack={handleBackToLogin} />
        )}
      </div>
    </div>
  );
};