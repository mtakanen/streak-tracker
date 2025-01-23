import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ScopeContextProps {
  scope: string | null;
  setScope: (scope: string | null) => void;
}

const ScopeContext = createContext<ScopeContextProps | undefined>(undefined);

export const ScopeProvider = ({ children }: { children: ReactNode }) => {
  const [scope, setScope] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('scope');
    }
    return null;
  });

  useEffect(() => {
    if (scope) {
      localStorage.setItem('scope', scope);
    }
  }, [scope]);

  return (
    <ScopeContext.Provider value={{ scope, setScope }}>
      {children}
    </ScopeContext.Provider>
  );
};

export const useScope = () => {
  const context = useContext(ScopeContext);
  if (context === undefined) {
    throw new Error('useScope must be used within a ScopeProvider');
  }
  return context;
};
