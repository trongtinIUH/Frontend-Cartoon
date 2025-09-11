// src/models/ModelUpdateAuthor.jsx
import React, { useState } from "react";
import AuthorService from "../services/AuthorService";
import { toast } from "react-toastify";
import { FaUser, FaUserTie } from "react-icons/fa";
import "../css/ModelAddMovie.css";

export default function ModelUpdateAuthor({ author, onClose, onSuccess }) {
  const [name, setName] = useState(author?.name || "");
  const [role, setRole] = useState(author?.authorRole || "DIRECTOR");
  const [loading, setLoading] = useState(false);

  const submit = async (e)=>{
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên!");
      return;
    }
    
    setLoading(true);
    try {
      await AuthorService.updateAuthor(author.authorId, { name: name.trim(), role });
      toast.success("Cập nhật tác giả thành công!");
      onSuccess?.();
    } catch (err) {
      if (String(err).includes("409") || String(err).includes("Duplicate")) {
        toast.error("Đã tồn tại tác giả với tên và vai trò này!");
      } else {
        toast.error("Lỗi cập nhật: " + (err?.message || "Không thể cập nhật"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="model-add-movie card shadow-lg p-4" style={{maxWidth: 480}}>
        <h4 className="mb-3 text-center fw-bold text-primary">
          <FaUser className="me-2" />
          Sửa Tác Giả/Diễn Viên
        </h4>
        
        <form onSubmit={submit} className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold">
              <FaUser className="me-1" /> Tên tác giả/diễn viên
            </label>
            <input 
              type="text"
              className="form-control" 
              value={name} 
              onChange={e=>setName(e.target.value)}
              placeholder="Nhập tên..."
              required
              maxLength={100}
            />
          </div>
          
          <div className="col-12">
            <label className="form-label fw-semibold">
              <FaUserTie className="me-1" /> Vai trò
            </label>
            <select 
              className="form-select" 
              value={role} 
              onChange={e=>setRole(e.target.value)}
            >
              <option value="DIRECTOR">Đạo diễn</option>
              <option value="PERFORMER">Diễn viên</option>
            </select>
          </div>
          
          <div className="col-12 d-flex gap-2 mt-4">
            <button 
              className="btn btn-primary flex-fill fw-bold" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Đang cập nhật...
                </>
              ) : (
                "Cập nhật"
              )}
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary flex-fill fw-bold" 
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
