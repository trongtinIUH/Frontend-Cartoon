import axiosInstance from '../api/axiosInstance';

const BASE_URL = '/episodes';

const SubtitleService = {
  // Helper: Clean subtitle content - loại bỏ [âm nhạc] và các descriptor
  cleanSubtitleContent: (content) => {
    if (!content) return content;
    
    // Patterns to remove
    const patternsToRemove = [
      /\[âm nhạc\]/gi,
      /\[music\]/gi,
      /\[nhạc nền\]/gi,
      /\[background music\]/gi,
      /\[bgm\]/gi,
      /\[sound effects\]/gi,
      /\[hiệu ứng âm thanh\]/gi,
      /\[tiếng động\]/gi,
      /\[applause\]/gi,
      /\[vỗ tay\]/gi,
      /\[laughter\]/gi,
      /\[tiếng cười\]/gi,
      /\[silence\]/gi,
      /\[im lặng\]/gi,
      /\[inaudible\]/gi,
      /\[không nghe rõ\]/gi,
      // Empty lines or lines with only brackets
      /^\s*\[.*\]\s*$/gm,
      // Multiple empty lines
      /\n\s*\n\s*\n/g
    ];
    
    let cleaned = content;
    
    // Apply all patterns
    patternsToRemove.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Clean up extra whitespace and empty lines
    cleaned = cleaned
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 consecutive newlines
      .replace(/^\s+|\s+$/g, '') // Trim start/end
      .replace(/\s+$/gm, ''); // Trim end of each line
    
    return cleaned;
  },

  // Thêm subtitle cho episode
  addSubtitle: async (seasonId, episodeNumber, subtitleData, file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('lang', subtitleData.lang);
      formData.append('label', subtitleData.label || subtitleData.lang.toUpperCase());
      formData.append('kind', subtitleData.kind || 'subtitles');
      formData.append('isDefault', subtitleData.isDefault || false);
      
      // Clean subtitle content if requested
      if (options.cleanContent && file.type === 'text/plain') {
        try {
          const fileContent = await file.text();
          const cleanedContent = SubtitleService.cleanSubtitleContent(fileContent);
          const cleanedBlob = new Blob([cleanedContent], { type: 'text/plain' });
          const cleanedFile = new File([cleanedBlob], file.name, { type: file.type });
          formData.append('file', cleanedFile);
          console.log('✨ Subtitle content cleaned - removed music/sound descriptors');
        } catch (cleanError) {
          console.warn('Failed to clean subtitle content, using original:', cleanError);
          formData.append('file', file);
        }
      } else {
        formData.append('file', file);
      }

      // Add cleaning flag to backend
      if (options.cleanContent) {
        formData.append('cleanContent', 'true');
      }

      const response = await axiosInstance.post(
        `${BASE_URL}/season/${seasonId}/ep/${episodeNumber}/subtitles`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding subtitle:', error);
      throw error;
    }
  },

  // Xóa subtitle theo ngôn ngữ
  deleteSubtitle: async (seasonId, episodeNumber, lang) => {
    try {
      const response = await axiosInstance.delete(
        `${BASE_URL}/season/${seasonId}/ep/${episodeNumber}/subtitles/${lang}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting subtitle:', error);
      throw error;
    }
  },

  // Cập nhật subtitle
  updateSubtitle: async (seasonId, episodeNumber, lang, subtitleData, file, options = {}) => {
    try {
      const formData = new FormData();
      if (subtitleData.label) formData.append('label', subtitleData.label);
      formData.append('kind', subtitleData.kind || 'subtitles');
      formData.append('isDefault', subtitleData.isDefault || false);
      
      if (file) {
        // Clean subtitle content if requested
        if (options.cleanContent && file.type === 'text/plain') {
          try {
            const fileContent = await file.text();
            const cleanedContent = SubtitleService.cleanSubtitleContent(fileContent);
            const cleanedBlob = new Blob([cleanedContent], { type: 'text/plain' });
            const cleanedFile = new File([cleanedBlob], file.name, { type: file.type });
            formData.append('file', cleanedFile);
          } catch (cleanError) {
            console.warn('Failed to clean subtitle content, using original:', cleanError);
            formData.append('file', file);
          }
        } else {
          formData.append('file', file);
        }
      } else if (subtitleData.url) {
        formData.append('url', subtitleData.url);
      }

      const response = await axiosInstance.put(
        `${BASE_URL}/${seasonId}/${episodeNumber}/subtitles/${lang}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating subtitle:', error);
      throw error;
    }
  },

  // Lấy danh sách subtitles
  getSubtitles: async (seasonId, episodeNumber) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/season/${seasonId}/ep/${episodeNumber}/subtitles`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching subtitles:', error);
      throw error;
    }
  },

  // Helper: validate subtitle file
  validateSubtitleFile: (file) => {
    const allowedTypes = ['.vtt', '.srt'];
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExt)) {
      throw new Error('Chỉ hỗ trợ file .vtt và .srt');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File phụ đề không được vượt quá 5MB');
    }

    return true;
  },

  // Helper: language options
  getLanguageOptions: () => [
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'zh-Hans', label: '中文 (简体)' },
    { value: 'zh-Hant', label: '中文 (繁體)' },
    { value: 'th', label: 'ไทย' },
    { value: 'id', label: 'Bahasa Indonesia' }
  ]
};

export default SubtitleService;