import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserService, UserProfile } from '@/lib/database';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  refreshUserProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserProfile = async () => {
    if (user) {
      try {
        const profile = await UserService.getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        console.log('User authenticated:', user.uid, user.email);
        
        try {
          // Try to get existing user profile
          let profile = await UserService.getUserProfile(user.uid);
          
          // If profile doesn't exist, create it
          if (!profile) {
            console.log('Creating new user profile for:', user.uid, user.email);
            await UserService.createOrUpdateUser(user);
            profile = await UserService.getUserProfile(user.uid);
            
            if (profile) {
              console.log('User profile created successfully:', profile);
            } else {
              console.error('User profile creation failed - profile still null');
            }
          } else {
            console.log('Existing user profile found:', profile.displayName || profile.email);
          }
          
          setUserProfile(profile);
        } catch (error) {
          console.error('Error with user profile:', error);
          
          // Try to create the profile anyway with retry logic
          try {
            console.log('Attempting to create user profile after error for:', user.uid);
            
            // Wait a bit and try again
            await new Promise(resolve => setTimeout(resolve, 1000));
            await UserService.createOrUpdateUser(user);
            
            // Wait a bit more and try to fetch
            await new Promise(resolve => setTimeout(resolve, 500));
            const profile = await UserService.getUserProfile(user.uid);
            
            if (profile) {
              console.log('User profile created successfully on retry:', profile);
              setUserProfile(profile);
            } else {
              console.error('Failed to create user profile even on retry');
              setUserProfile(null);
            }
          } catch (createError) {
            console.error('Failed to create user profile on retry:', createError);
            setUserProfile(null);
          }
        }
      } else {
        console.log('User signed out');
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}; 