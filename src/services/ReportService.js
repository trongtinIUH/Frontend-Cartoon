import axios from 'axios';

// Tạo instance riêng cho report API với baseURL khác
const reportApiClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào request
reportApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('idToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Thêm userId từ localStorage - Backend mong đợi header "userId"
    const userStr = localStorage.getItem('my_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userId = user.my_user?.userId;
        
        if (userId) {
          config.headers['userId'] = userId;
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý response
reportApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

const ReportService = {
  // Báo lỗi phát video
  reportPlaybackIssue: async (reportData) => {
    try {
      // Validate required fields
      if (!reportData.movieId) {
        throw new Error('movieId is required');
      }
      if (!reportData.issueType) {
        throw new Error('issueType is required');
      }
      if (!reportData.issueDetail) {
        throw new Error('issueDetail is required');
      }

      // Map issueType từ Frontend sang Backend format
      const typeMapping = {
        'VIDEO_PLAYBACK': 'VIDEO',
        'AUDIO_SYNC': 'AUDIO', 
        'SUBTITLE_MISSING': 'SUBTITLE',
        'OTHER': 'OTHER'
      };

      // Mapping dữ liệu theo format mà Backend mong đợi
      const payload = {
        movieId: String(reportData.movieId), // @NotBlank validation
        seasonId: reportData.episodeId ? String(reportData.episodeId) : null, // seasonId có thể null
        episodeNumber: reportData.episodeNumber && reportData.episodeNumber > 0 ? reportData.episodeNumber : 1, // @Positive validation - must be > 0
        type: typeMapping[reportData.issueType] || reportData.issueType, // @NotBlank validation - map type
        detail: reportData.issueDetail ? String(reportData.issueDetail).trim() : null // detail có thể null
      };

      // Ensure episodeNumber is positive (required by @Positive annotation)
      if (!payload.episodeNumber || payload.episodeNumber <= 0) {
        payload.episodeNumber = 1; // Default to 1 if invalid
      }

      // Remove null/undefined fields để tránh validation lỗi (except seasonId and detail which can be null)
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined || payload[key] === '') {
          if (key === 'seasonId' || key === 'detail') { 
            // seasonId and detail are allowed to be null, keep them
            return;
          } else {
            // Other fields cannot be null/empty
            delete payload[key];
          }
        }
      });

      // Ensure required fields are present after cleanup
      if (!payload.movieId || !payload.type) {
        throw new Error('Missing required fields: movieId, type are mandatory');
      }

      console.log('Sending report payload:', payload);
      const response = await reportApiClient.post('/reports/playback', payload);
      return response.data;
    } catch (error) {
      console.error('Error reporting playback issue:', error);
      
      // Log chi tiết lỗi response
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      
      throw error;
    }
  },

  // Lấy tất cả báo lỗi của một phim (admin) - Using new movie-level endpoint
  getPlaybackIssues: async (movieId, params = {}) => {
    try {
      // Nếu không có movieId, query tất cả
      if (!movieId) {
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== '') {
            queryParams.append(key, params[key]);
          }
        });
        
        const url = queryParams.toString() ? 
          `/reports/playback?${queryParams.toString()}` : 
          '/reports/playback';
          
        const response = await reportApiClient.get(url);
        return response.data;
      }
      
      // ✅ NEW: Try movie-level endpoint first (if Backend implements it)
      
      try {
        // Try new movie endpoint first
        const movieUrl = `/reports/playback/movie/${movieId}`;
        const movieResponse = await reportApiClient.get(movieUrl);
        return movieResponse.data;
      } catch (movieEndpointError) {
        // Fallback to original endpoint
        const directQuery = new URLSearchParams();
        directQuery.append('movieId', movieId);
        
        const directUrl = `/reports/playback?${directQuery.toString()}`;
        
        const response = await reportApiClient.get(directUrl);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Error fetching playback issues:', error);
      throw error;
    }
  },

  // Lấy tất cả báo lỗi (không theo phim cụ thể)
  getAllPlaybackIssues: async (params = {}) => {
    try {
      return await ReportService.getPlaybackIssues(null, params);
    } catch (error) {
      console.error('Error fetching all playback issues:', error);
      throw error;
    }
  },

  // Cập nhật trạng thái báo lỗi (admin)
  updateIssueStatus: async (issueId, status, movieId, seasonId = null, episodeNumber = 1, enableTtl = true) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('movieId', movieId);
      queryParams.append('status', status);
      queryParams.append('enableTtl', enableTtl);
      
      if (seasonId) {
        queryParams.append('seasonId', seasonId);
      }
      if (episodeNumber) {
        queryParams.append('episodeNumber', episodeNumber);
      }

      // ✅ Backend đã được sửa thành @PatchMapping("/playback/{issueId}/status")
      // Giờ có thể gửi issueId trong đường dẫn như ban đầu
      const url = `/reports/playback/${issueId}/status?${queryParams.toString()}`;

      const response = await reportApiClient.patch(url);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating issue status:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      
      throw error;
    }
  },

  // Lấy thống kê trạng thái cho nhiều phim
  getMoviesIssueStatistics: async (movieIds) => {
    try {
      const statisticsMap = {};
      
      // Fetch data for each movie
      for (const movieId of movieIds) {
        try {
          const issues = await ReportService.getPlaybackIssues(movieId);
          
          // Count total issues
          const totalCount = issues.length;
          
          // Extract all statuses
          const statuses = issues.map(issue => issue.status || issue.issueStatus || 'OPEN');
          
          // Count by status
          const statusCounts = statuses.reduce((acc, status) => {
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});
          
          statisticsMap[movieId] = {
            total: totalCount,
            statuses: statuses,
            statusCounts: statusCounts,
            hasOpenIssues: statuses.includes('OPEN'),
            hasInProgressIssues: statuses.includes('IN_PROGRESS'),
            hasResolvedIssues: statuses.includes('RESOLVED'),
            hasInvalidIssues: statuses.includes('INVALID')
          };
        } catch (movieError) {
          statisticsMap[movieId] = {
            total: 0,
            statuses: [],
            statusCounts: {},
            hasOpenIssues: false,
            hasInProgressIssues: false,
            hasResolvedIssues: false,
            hasInvalidIssues: false
          };
        }
      }
      
      return statisticsMap;
    } catch (error) {
      console.error('Error getting movies issue statistics:', error);
      return {};
    }
  },

  // Lấy thống kê báo lỗi
  getIssueStats: async () => {
    try {
      const response = await reportApiClient.get('/reports/playback/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching issue stats:', error);
      // Trả về mock data nếu API chưa có
      return {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        invalid: 0
      };
    }
  }
};

export default ReportService;