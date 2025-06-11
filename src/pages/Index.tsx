
import React, { useState, useEffect } from 'react';
import VisualGrid from '@/components/VisualGrid';
import PasswordLock from '@/components/PasswordLock';

const Index = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Check if already unlocked in this session
  useEffect(() => {
    const unlocked = sessionStorage.getItem('visual-supports-unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
    sessionStorage.setItem('visual-supports-unlocked', 'true');
  };

  if (!isUnlocked) {
    return <PasswordLock onUnlock={handleUnlock} />;
  }

  return <VisualGrid />;
};

export default Index;
