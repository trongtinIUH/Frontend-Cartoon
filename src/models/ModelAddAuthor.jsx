// src/models/ModelAddAuthor.jsx
import React, { useState } from "react";
import AuthorService from "../services/AuthorService";
import { toast } from "react-toastify";
import { FaUser, FaUserTie, FaPlus } from "react-icons/fa";
import "../css/ModelAddMovie.css";

export default function ModelAddAuthor({ onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("DIRECTOR");
  const [loading, setLoading] = useState(false);
  
  const submit = async (e)=>{
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên!");
      return;
    }
    
    setLoading(true);
    try {
      await AuthorService.createAuthor({ name: name.trim(), authorRole: role, movieId: [] });
      toast.success("Thêm tác giả thành công!");
      onSuccess?.();
    } catch (e) { 
      toast.error("Lỗi thêm tác giả: " + (e?.message || "Không thể thêm"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="model-add-movie card shadow-lg p-4" style={{maxWidth: 480}}>
        <h4 className="mb-3 text-center fw-bold text-primary">
          <FaPlus className="me-2" />
          Thêm Tác Giả/Diễn Viên
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
                  Đang thêm...
                </>
              ) : (
                "Thêm mới"
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
