// src/services/personalizationService.js
import axiosInstance from '../api/axiosInstance';

const API_BASE = '/api/personalization';

/**
 * Track user behavior signal
 * @param {string} userId - User ID
 * @param {string} eventType - Event type (view_start, view_engaged, view_end, click_movie, add_wishlist, search_query)
 * @param {string|null} movieId - Movie ID (null for search events)
 * @param {Object} metadata - Additional data (all values will be converted to strings)
 * @returns {Promise<Object|null>} - Response data or null if failed
 */
export async function trackSignal(userId, eventType, movieId, metadata = {}) {
  try {
    // Convert all metadata values to strings (BE requirement)
    const stringMetadata = {};
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        stringMetadata[key] = String(value);
      }
    });

    const response = await axiosInstance.post(`${API_BASE}/track`, {
      userId,
      eventType,
      movieId,
      metadata: stringMetadata
    });

    console.log('✅ Track signal success:', { userId, eventType, movieId });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to track signal:', error);
    // Don't throw - tracking shouldn't break UX
    return null;
  }
}

/**
 * Get personalized recommendations for user
 * @param {string} userId - User ID
 * @param {number} limit - Number of recommendations (default: 20)
 * @returns {Promise<Array>} - Array of movie objects with scores
 */
export async function getRecommendations(userId, limit = 20) {
  try {
    const response = await axiosInstance.get(
      `${API_BASE}/recommendations/${userId}`,
      { params: { limit } }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch recommendations:', error);
    return [];
  }
}

/**
 * Get recently watched movies
 * @param {string} userId - User ID
 * @param {number} limit - Number of movies (default: 10)
 * @returns {Promise<Array>} - Array of recently watched movies
 */
export async function getRecentlyWatched(userId, limit = 10) {
  try {
    const response = await axiosInstance.get(
      `${API_BASE}/history/recent/${userId}`,
      { params: { limit } }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch recently watched:', error);
    return [];
  }
}

/**
 * Get score badge for display (simplified - emoji + percentage only)
 * @param {number|null} score - Recommendation score (0-1)
 * @returns {Object|null} - Badge config {emoji, percentage} or null
 */
export function getScoreBadge(score) {
  if (!score || score === null) return null;
  
  // Convert to percentage and cap at 100%
  let percentage = Math.round(score * 100);
  if (percentage > 100) {
    percentage = 100;
  }
  if (percentage < 0) {
    percentage = 0;
  }
  
  // Normalize score for emoji selection (0-1 range)
  const normalizedScore = percentage / 100;
  
  // Return emoji based on normalized score range
  let emoji = '👍';
  if (normalizedScore > 0.85) {
    emoji = '🔥';
  } else if (normalizedScore > 0.7) {
    emoji = '✨';
  }
  
  return { 
    emoji,
    percentage,
    score // Keep original score for reference
  };
}

/**
 * Get user ID from localStorage
 * @returns {string|null} - User ID or null
 */
export function getCurrentUserId() {
  try {
    const myUserStr = localStorage.getItem("my_user");
    if (!myUserStr) return null;
    
    const myUser = JSON.parse(myUserStr);
    return myUser?.my_user?.userId || myUser?.userId || null;
  } catch (error) {
    console.error('Error extracting userId:', error);
    return null;
  }
}

// Export all functions
export default {
  trackSignal,
  getRecommendations,
  getRecentlyWatched,
  getScoreBadge,
  getCurrentUserId
};
