/**
 * Watch Together Types & Constants
 * @author Senior FE Developer
 * @version 1.0
 */

/**
 * @typedef {'JOIN'|'LEAVE'|'CHAT'|'PLAY'|'PAUSE'|'SEEK'|'SYNC_STATE'|'MEMBER_LIST'|'PING'|'PONG'|'SYSTEM'} WsType
 */

/**
 * @typedef {Object} WsEvent
 * @property {WsType} type
 * @property {string} roomId
 * @property {string} [senderId]
 * @property {string} [senderName]
 * @property {string} [avatarUrl]
 * @property {Object} [payload]
 * @property {string} [payload.text]
 * @property {number} [payload.positionMs]
 * @property {number} [payload.playbackRate]
 * @property {number} [payload.atHostTimeMs]
 * @property {boolean} [payload.playing]
 * @property {number} [payload.serverTimeMs]
 * @property {'OWNER'|'CO_HOST'|'MEMBER'} [payload.role]
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} Member
 * @property {string} userId
 * @property {string} userName
 * @property {string} [avatarUrl]
 * @property {'OWNER'|'CO_HOST'|'MEMBER'} role
 * @property {string} [lastSeenAt]
 */

/**
 * @typedef {Object} Message
 * @property {string} [id]
 * @property {'CHAT'|'SYSTEM'|'EVENT'} type
 * @property {string} [senderId]
 * @property {string} [senderName]
 * @property {string} [avatarUrl]
 * @property {string} [content]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} SyncState
 * @property {boolean} playing
 * @property {number} positionMs
 * @property {number} playbackRate
 * @property {number} serverTimeMs
 */

/**
 * @typedef {Object} WatchState
 * @property {Member[]} members
 * @property {Message[]} messages
 * @property {SyncState} sync
 * @property {number} latencyMs
 * @property {boolean} isHost
 */

// WebSocket Event Types
export const WS_TYPES = {
  JOIN: 'JOIN',
  LEAVE: 'LEAVE',
  CHAT: 'CHAT',
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  SEEK: 'SEEK',
  SYNC_STATE: 'SYNC_STATE',
  MEMBER_LIST: 'MEMBER_LIST',
  PING: 'PING',
  PONG: 'PONG',
  SYSTEM: 'SYSTEM',
};

// Member Roles
export const MEMBER_ROLES = {
  OWNER: 'OWNER',
  CO_HOST: 'CO_HOST',
  MEMBER: 'MEMBER',
};

// Message Types
export const MESSAGE_TYPES = {
  CHAT: 'CHAT',
  SYSTEM: 'SYSTEM',
  EVENT: 'EVENT',
};

// Config
export const WATCH_CONFIG = {
  HEARTBEAT_INTERVAL: 20000, // 20s
  RECONNECT_DELAYS: [1000, 2000, 5000, 10000], // exponential backoff
  SUPPRESS_ECHO_DURATION: 300, // 300ms
  MAX_SYNC_DRIFT: 500, // 500ms acceptable drift
  PAGINATION_LIMIT: 50,
};
