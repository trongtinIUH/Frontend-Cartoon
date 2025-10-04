/**
 * Utility functions for subtitle content cleaning and processing
 */

export const SubtitleCleaner = {
  /**
   * Clean subtitle content by removing music, sound effects, and other descriptors
   * @param {string} content - Raw subtitle content (SRT or VTT format)
   * @returns {string} - Cleaned subtitle content
   */
  cleanContent: (content) => {
    if (!content || typeof content !== 'string') return content;
    
    // Patterns for common descriptors to remove
    const descriptorPatterns = [
      // Vietnamese descriptors
      /\[âm nhạc\]/gi,
      /\[nhạc nền\]/gi,
      /\[hiệu ứng âm thanh\]/gi,
      /\[tiếng động\]/gi,
      /\[vỗ tay\]/gi,
      /\[tiếng cười\]/gi,
      /\[im lặng\]/gi,
      /\[không nghe rõ\]/gi,
      /\[thở dài\]/gi,
      /\[tiếng thở\]/gi,
      
      // English descriptors
      /\[music\]/gi,
      /\[background music\]/gi,
      /\[bgm\]/gi,
      /\[sound effects\]/gi,
      /\[applause\]/gi,
      /\[laughter\]/gi,
      /\[silence\]/gi,
      /\[inaudible\]/gi,
      /\[sighs\]/gi,
      /\[breathing\]/gi,
      
      // Generic patterns
      /\[.*music.*\]/gi,
      /\[.*âm nhạc.*\]/gi,
      /\[.*sound.*\]/gi,
      /\[.*âm thanh.*\]/gi,
      
      // Empty brackets or lines with only brackets
      /^\s*\[.*\]\s*$/gm,
      
      // Lines with only punctuation or whitespace
      /^\s*[.,!?;:]*\s*$/gm
    ];
    
    let cleaned = content;
    
    // Apply all cleaning patterns
    descriptorPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Clean up formatting
    cleaned = cleaned
      // Remove multiple consecutive empty lines
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      // Remove leading/trailing whitespace from each line
      .replace(/^\s+|\s+$/gm, '')
      // Remove completely empty subtitle blocks (timestamp with no content)
      .replace(/(\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*\n\s*\n/g, '')
      // Trim overall content
      .trim();
    
    return cleaned;
  },

  /**
   * Validate if subtitle content has been effectively cleaned
   * @param {string} originalContent 
   * @param {string} cleanedContent 
   * @returns {object} - Validation results
   */
  validateCleaning: (originalContent, cleanedContent) => {
    const originalLines = originalContent.split('\n').length;
    const cleanedLines = cleanedContent.split('\n').length;
    const removedLines = originalLines - cleanedLines;
    
    const musicDescriptors = [
      /\[âm nhạc\]/gi,
      /\[music\]/gi,
      /\[nhạc nền\]/gi
    ];
    
    const originalDescriptors = musicDescriptors.reduce((count, pattern) => {
      return count + (originalContent.match(pattern) || []).length;
    }, 0);
    
    const remainingDescriptors = musicDescriptors.reduce((count, pattern) => {
      return count + (cleanedContent.match(pattern) || []).length;
    }, 0);
    
    return {
      success: remainingDescriptors === 0,
      removedLines,
      removedDescriptors: originalDescriptors - remainingDescriptors,
      originalDescriptors,
      remainingDescriptors,
      compressionRatio: cleanedContent.length / originalContent.length
    };
  },

  /**
   * Preview what would be removed without actually cleaning
   * @param {string} content 
   * @returns {array} - Array of items that would be removed
   */
  previewRemovals: (content) => {
    const removals = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (/\[.*\]/.test(line)) {
        removals.push({
          line: index + 1,
          content: line.trim(),
          type: 'descriptor'
        });
      }
    });
    
    return removals;
  }
};

export default SubtitleCleaner;