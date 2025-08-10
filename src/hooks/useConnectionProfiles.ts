import { useState, useEffect } from 'react';
import { UserService, UserProfile } from '@/lib/database';

export const useConnectionProfiles = (connections: any[]) => {
  const [profiles, setProfiles] = useState<{[key: string]: UserProfile}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfiles = async () => {
      if (!connections || connections.length === 0) {
        setProfiles({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const profilePromises = connections.map(async (connection) => {
          try {
            const profile = await UserService.getUserProfile(connection.connectedUserId);
            return { userId: connection.connectedUserId, profile };
          } catch (error) {
            console.error(`Failed to load profile for user ${connection.connectedUserId}:`, error);
            return { userId: connection.connectedUserId, profile: null };
          }
        });

        const profileResults = await Promise.all(profilePromises);
        
        const profileMap: {[key: string]: UserProfile} = {};
        profileResults.forEach(({ userId, profile }) => {
          if (profile) {
            profileMap[userId] = profile;
          }
        });

        setProfiles(profileMap);
      } catch (err) {
        console.error('Error loading connection profiles:', err);
        setError('Failed to load user profiles');
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [connections]);

  const getProfile = (userId: string): UserProfile | null => {
    return profiles[userId] || null;
  };

  const getDisplayName = (userId: string): string => {
    const profile = getProfile(userId);
    return profile?.displayName || profile?.email || userId || 'Unknown User';
  };

  const getAvatarUrl = (userId: string): string | undefined => {
    const profile = getProfile(userId);
    return profile?.photoURL;
  };

  return {
    profiles,
    loading,
    error,
    getProfile,
    getDisplayName,
    getAvatarUrl,
  };
};
