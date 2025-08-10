import { useState, useEffect } from 'react';
import { UserService, UserProfile } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

export const useUserProfile = (userId?: string) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.uid;

  useEffect(() => {
    if (!targetUserId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe: (() => void) | undefined;

    try {
      // Subscribe to user profile changes
      unsubscribe = UserService.subscribeToUserProfile(targetUserId, (newProfile) => {
        setProfile(newProfile);
        setLoading(false);
      });
    } catch (err) {
      console.error('Error setting up user profile subscription:', err);
      setError('Failed to load user profile');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [targetUserId]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('User must be authenticated to update profile');
    }

    try {
      await UserService.createOrUpdateUser(user, updates);
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw new Error('Failed to update user profile');
    }
  };

  const updateSkills = async (skillsToTeach: string[], skillsToLearn: string[]) => {
    if (!user) {
      throw new Error('User must be authenticated to update skills');
    }

    try {
      await UserService.updateUserSkills(user.uid, skillsToTeach, skillsToLearn);
    } catch (err) {
      console.error('Error updating user skills:', err);
      throw new Error('Failed to update user skills');
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateSkills,
  };
}; 