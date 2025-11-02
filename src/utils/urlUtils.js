/**
 * URL Utils for CartoonToo
 * Tạo URL thân thiện và an toàn cho việc xem phim
 */

// Tạo slug từ tên phim/tập
export const createSlug = (text) => {
  if (!text) return 'unknown';
  
  return text
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50); // Limit length
};

// Tạo URL xem phim với slug (updated)
export const createWatchUrl = (movie, episode) => {
  if (!movie?.title || !episode?.episodeNumber) {
    // console.warn("Missing data for clean URL, falling back to ID format");
    return `/watch/${movie?.movieId}/${episode?.episodeId}`;
  }
  
  const movieSlug = createSlug(movie.title);
  const episodeSlug = `tap-${episode.episodeNumber}`;
  
  // console.log("Clean URL components:", { movieSlug, episodeSlug });
  
  // If slug is empty or too short, fallback to ID
  if (movieSlug.length < 3) {
    // console.warn("Slug too short, falling back to ID format");
    return `/watch/${movie.movieId}/${episode.episodeId}`;
  }
  
  return `/watch/${movieSlug}/${episodeSlug}`;
};

// Encode ID để backup (fallback)
export const encodeIds = (movieId, episodeId) => {
  try {
    return btoa(`${movieId}:${episodeId}`).replace(/[+/=]/g, (m) => {
      return { '+': '-', '/': '_', '=': '' }[m];
    });
  } catch {
    return null;
  }
};

// Decode ID từ backup
export const decodeIds = (encoded) => {
  try {
    const restored = encoded.replace(/[-_]/g, (m) => {
      return { '-': '+', '_': '/' }[m];
    });
    const decoded = atob(restored);
    const [movieId, episodeId] = decoded.split(':');
    return { movieId, episodeId };
  } catch {
    return null;
  }
};

// Tạo URL clean với slug only (legacy support)
export const createSecureWatchUrl = (movie, episode) => {
  // Use clean URL instead
  return createWatchUrl(movie, episode);
};

// Parse URL để lấy thông tin
export const parseWatchUrl = (movieSlug, episodeSlug, refParam) => {
  // Trường hợp 1: Có ref parameter (backup IDs)
  if (refParam) {
    const decoded = decodeIds(refParam);
    if (decoded) {
      return decoded;
    }
  }
  
  // Trường hợp 2: Parse từ slug (cần database lookup)
  const episodeNumber = episodeSlug.match(/tap-(\d+)/)?.[1];
  
  return {
    movieSlug,
    episodeNumber: episodeNumber ? parseInt(episodeNumber) : null,
    needDatabaseLookup: true
  };
};

export default {
  createSlug,
  createWatchUrl,
  createSecureWatchUrl,
  parseWatchUrl,
  encodeIds,
  decodeIds
};
