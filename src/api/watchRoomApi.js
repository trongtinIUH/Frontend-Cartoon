/**
 * Watch Room HTTP API
 * @author Senior FE Developer
 * @version 1.0
 */

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

/**
 * Fetch wrapper with JSON handling
 */
async function fetchJSON(url, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API Error]', error);
    throw error;
  }
}

/**
 * Watch Room API
 */
export const watchRoomApi = {
  /**
   * Get room members
   * @param {string} roomId
   * @returns {Promise<Member[]>}
   */
  async getMembers(roomId) {
    return fetchJSON(`${API_BASE}/watchrooms/${roomId}/members`);
  },

  /**
   * Search messages with pagination
   * @param {string} roomId
   * @param {Object} params
   * @param {number} [params.limit=50]
   * @param {string} [params.cursor]
   * @returns {Promise<{messages: Message[], nextCursor: string}>}
   */
  async searchMessages(roomId, params = {}) {
    const queryParams = new URLSearchParams({
      limit: params.limit || 50,
      ...(params.cursor && { cursor: params.cursor }),
    });

    return fetchJSON(
      `${API_BASE}/watchrooms/${roomId}/messages/search?${queryParams}`
    );
  },

  /**
   * Transfer host to another user
   * @param {string} roomId
   * @param {string} toUserId
   * @returns {Promise<void>}
   */
  async transferHost(roomId, toUserId) {
    return fetchJSON(
      `${API_BASE}/watchrooms/${roomId}/transfer-host?toUserId=${toUserId}`,
      { method: 'POST' }
    );
  },

  /**
   * Kick user from room
   * @param {string} roomId
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async kickUser(roomId, userId) {
    return fetchJSON(
      `${API_BASE}/watchrooms/${roomId}/kick?userId=${userId}`,
      { method: 'POST' }
    );
  },

  /**
   * Get user's rooms
   * @param {string} userId
   * @returns {Promise<Room[]>}
   */
  async getUserRooms(userId) {
    return fetchJSON(`${API_BASE}/watchrooms/user/${userId}`);
  },

  /**
   * Get room info
   * @param {string} roomId
   * @returns {Promise<{roomId: string, name: string, videoUrl: string, createdAt: string}>}
   */
  async getRoomInfo(roomId) {
    return fetchJSON(`${API_BASE}/watchrooms/${roomId}`);
  },
};
