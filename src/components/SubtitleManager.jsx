import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import SubtitleService from '../services/SubtitleService';

const SubtitleManager = ({ 
  seasonId, 
  episodeNumber, 
  onSubtitlesChange,
  className = ""
}) => {
  const [subtitles, setSubtitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    lang: 'vi',
    label: '',
    kind: 'subtitles',
    isDefault: false,
    file: null
  });

  const languageOptions = SubtitleService.getLanguageOptions();

  // Load existing subtitles
  const loadSubtitles = useCallback(async () => {
    console.log('🎬 SubtitleManager props:', { seasonId, episodeNumber });
    
    if (!seasonId || !episodeNumber) {
      console.warn('❌ Missing required props:', { seasonId, episodeNumber });
      return;
    }
    
    try {
      setLoading(true);
      const data = await SubtitleService.getSubtitles(seasonId, episodeNumber);
      setSubtitles(Array.isArray(data) ? data : []);
      onSubtitlesChange?.(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading subtitles:', error);
      setSubtitles([]);
    } finally {
      setLoading(false);
    }
  }, [seasonId, episodeNumber, onSubtitlesChange]);

  useEffect(() => {
    loadSubtitles();
  }, [loadSubtitles]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate label from language
    if (field === 'lang' && !formData.label) {
      const langOption = languageOptions.find(opt => opt.value === value);
      if (langOption) {
        setFormData(prev => ({
          ...prev,
          label: langOption.label
        }));
      }
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      SubtitleService.validateSubtitleFile(file);
      setFormData(prev => ({ ...prev, file }));
    } catch (error) {
      toast.error(error.message);
      e.target.value = ''; // Reset file input
    }
  };

  // Add subtitle
  const handleAddSubtitle = async (e) => {
    e.preventDefault();
    
    if (!formData.file) {
      toast.error('Vui lòng chọn file phụ đề');
      return;
    }

    if (!formData.lang) {
      toast.error('Vui lòng chọn ngôn ngữ');
      return;
    }

    try {
      setLoading(true);
      await SubtitleService.addSubtitle(seasonId, episodeNumber, formData, formData.file);
      
      toast.success('Thêm phụ đề thành công!');
      
      // Reset form
      setFormData({
        lang: 'vi',
        label: '',
        kind: 'subtitles',
        isDefault: false,
        file: null
      });
      
      // Reset file input
      const fileInput = document.getElementById('subtitle-file-input');
      if (fileInput) fileInput.value = '';
      
      setShowAddForm(false);
      await loadSubtitles();
      
    } catch (error) {
      console.error('Error adding subtitle:', error);
      toast.error('Thêm phụ đề thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Delete subtitle
  const handleDeleteSubtitle = async (lang) => {
    if (!window.confirm(`Bạn có chắc muốn xóa phụ đề ${lang}?`)) return;

    try {
      setLoading(true);
      await SubtitleService.deleteSubtitle(seasonId, episodeNumber, lang);
      toast.success('Xóa phụ đề thành công!');
      await loadSubtitles();
    } catch (error) {
      console.error('Error deleting subtitle:', error);
      toast.error('Xóa phụ đề thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!seasonId || !episodeNumber) {
    return (
      <div className={`subtitle-manager ${className}`}>
        <p className="text-muted">Cần chọn season và episode để quản lý phụ đề</p>
      </div>
    );
  }

  return (
    <div className={`subtitle-manager ${className}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">
          <i className="fas fa-closed-captioning me-2"></i>
          Phụ đề ({subtitles.length})
        </h6>
        <button 
          className="btn btn-sm btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={loading}
        >
          <i className="fas fa-plus me-1"></i>
          Thêm phụ đề
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card mb-3">
          <div className="card-body">
            <form onSubmit={handleAddSubtitle}>
              <div className="row">
                <div className="col-md-4">
                  <label className="form-label">Ngôn ngữ *</label>
                  <select 
                    className="form-select"
                    value={formData.lang}
                    onChange={(e) => handleInputChange('lang', e.target.value)}
                    required
                  >
                    {languageOptions.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label">Nhãn hiển thị</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={formData.label}
                    onChange={(e) => handleInputChange('label', e.target.value)}
                    placeholder="Tự động từ ngôn ngữ"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Loại</label>
                  <select 
                    className="form-select"
                    value={formData.kind}
                    onChange={(e) => handleInputChange('kind', e.target.value)}
                  >
                    <option value="subtitles">Subtitles</option>
                    <option value="captions">Captions</option>
                  </select>
                </div>
              </div>

              <div className="row mt-3">
                <div className="col-md-8">
                  <label className="form-label">File phụ đề *</label>
                  <input 
                    id="subtitle-file-input"
                    type="file"
                    className="form-control"
                    accept=".vtt,.srt"
                    onChange={handleFileChange}
                    required
                  />
                  <small className="text-muted">Hỗ trợ: .vtt, .srt (tối đa 5MB)</small>
                </div>

                <div className="col-md-4">
                  <label className="form-label">&nbsp;</label>
                  <div className="form-check">
                    <input 
                      type="checkbox"
                      className="form-check-input"
                      checked={formData.isDefault}
                      onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                    />
                    <label className="form-check-label">
                      Mặc định
                    </label>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button 
                  type="submit" 
                  className="btn btn-success btn-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-1"></i>
                      Thêm phụ đề
                    </>
                  )}
                </button>
                
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subtitles List */}
      {loading && !showAddForm && (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm me-2"></div>
          Đang tải phụ đề...
        </div>
      )}

      {!loading && subtitles.length === 0 && (
        <div className="text-muted text-center py-3">
          <i className="fas fa-closed-captioning fa-2x mb-2 d-block"></i>
          Chưa có phụ đề nào
        </div>
      )}

      {!loading && subtitles.length > 0 && (
        <div className="list-group">
          {subtitles.map((subtitle, index) => (
            <div key={subtitle.lang} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-medium">{subtitle.label}</span>
                    <span className="badge bg-secondary">{subtitle.lang.toUpperCase()}</span>
                    <span className="badge bg-info">{subtitle.kind}</span>
                    {subtitle.isDefault && (
                      <span className="badge bg-success">Mặc định</span>
                    )}
                  </div>
                  <small className="text-muted d-block mt-1">
                    <i className="fas fa-link me-1"></i>
                    <a 
                      href={subtitle.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      {subtitle.url}
                    </a>
                  </small>
                </div>

                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDeleteSubtitle(subtitle.lang)}
                    disabled={loading}
                    title="Xóa phụ đề"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubtitleManager;