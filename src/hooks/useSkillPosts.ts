import { useState, useEffect } from 'react';
import { SkillPostService, SkillPost } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

export const useSkillPosts = (type?: 'learn' | 'teach') => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SkillPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe: (() => void) | undefined;

    try {
      if (type) {
        // Subscribe to specific type
        unsubscribe = SkillPostService.subscribeToSkillPostsByType(type, (newPosts) => {
          setPosts(newPosts);
          setLoading(false);
        });
      } else {
        // Subscribe to all posts
        unsubscribe = SkillPostService.subscribeToSkillPosts((newPosts) => {
          setPosts(newPosts);
          setLoading(false);
        });
      }
    } catch (err) {
      console.error('Error setting up skill posts subscription:', err);
      setError('Failed to load skill posts');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, type]);

  const createPost = async (postData: Omit<SkillPost, 'id' | 'timestamp'>) => {
    if (!user) {
      throw new Error('User must be authenticated to create posts');
    }

    try {
      const postId = await SkillPostService.createSkillPost(postData);
      return postId;
    } catch (err) {
      console.error('Error creating skill post:', err);
      throw new Error('Failed to create skill post');
    }
  };

  const updatePost = async (postId: string, updates: Partial<SkillPost>) => {
    try {
      await SkillPostService.updateSkillPost(postId, updates);
    } catch (err) {
      console.error('Error updating skill post:', err);
      throw new Error('Failed to update skill post');
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete posts');
    }

    try {
      await SkillPostService.deleteSkillPost(postId, user.uid);
    } catch (err) {
      console.error('Error deleting skill post:', err);
      throw new Error('Failed to delete skill post');
    }
  };

  return {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
  };
}; 