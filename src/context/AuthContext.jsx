import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuth } from '../firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => setAdminUser(user));
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ adminUser, isLoading: adminUser === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
