
import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface PasswordLockProps {
  onUnlock: () => void;
}

const PasswordLock = ({ onUnlock }: PasswordLockProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '345-BXH') {
      onUnlock();
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="h-screen bg-background flex items-center justify-center">
      <div className="bg-card p-8 rounded-lg shadow-lg border border-border max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Visual Supports</h1>
          <p className="text-muted-foreground">Enter password to access</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className={`w-full px-4 py-3 border rounded-lg text-center text-lg tracking-wider bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              error ? 'border-destructive' : 'border-border'
            }`}
            autoFocus
          />
          {error && (
            <p className="text-destructive text-sm mt-2 text-center animate-fade-in">
              Incorrect password
            </p>
          )}
          <button
            type="submit"
            className="w-full mt-4 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordLock;
