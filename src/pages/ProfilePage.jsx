import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SidebarUserManagement from "../components/SidebarUserManagement";
import "../css/ProfilePage.css";
import UserService from "../services/UserService";
import { toast } from "react-toastify";

const ProfilePage = () => {
  const { MyUser, updateUserInfo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("unspecified");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (MyUser?.my_user) {
      setEmail(MyUser.my_user.email);
      setDisplayName(MyUser.my_user.userName);
      setGender(MyUser.my_user.gender || "unspecified");
      setAvatar(MyUser.my_user.avatarUrl);
    }
  }, [MyUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatar(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUserInfo({ email, displayName, gender, avatar });
      toast.success("Cập nhật thành công!");
    } catch (err) {
      toast.error("Cập nhật thất bại.");
    }
  };

  return (
    <div className="d-flex bg-dark text-white min-vh-100 py-5 px-5">
      <SidebarUserManagement />

      <div className="flex-grow-1 p-4" style={{ marginLeft: '50px', marginTop: '100px' }}>
        <h5 className="mb-4 fw-bold">Tài khoản</h5>
        <p className="mb-4">Cập nhật thông tin tài khoản</p>
        <form onSubmit={handleSubmit} className="row g-4">
          <div className="col-md-6">
            <label className="form-label text-white">Email</label>
            <input
              type="email"
              className="form-control bg-secondary text-white border-0"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled
            />
          </div>

          <div className="col-md-3 text-center">
            <div className="position-relative d-inline-block mb-2">
              <img
                src={avatar || "https://via.placeholder.com/150"}
                alt="avatar"
                className="rounded-circle border border-2"
                style={{ width: 120, height: 120 }}
              />
              <label className="position-absolute bottom-0 end-0 bg-secondary p-2 rounded-circle" style={{ cursor: 'pointer' }}>
                <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                <i className="fas fa-camera"></i>
              </label>
            </div>
            <div>Đổi ảnh đại diện</div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white">Tên hiển thị</label>
            <input
              type="text"
              className="form-control bg-secondary text-white border-0"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label text-white">Giới tính</label>
            <div>
              {['male', 'female', 'unspecified'].map((g) => (
                <div className="form-check form-check-inline" key={g}>
                  <input
                    className="form-check-input"
                    type="radio"
                    name="gender"
                    id={g}
                    value={g}
                    checked={gender === g}
                    onChange={() => setGender(g)}
                  />
                  <label className="form-check-label text-white" htmlFor={g}>
                    {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Không xác định'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="col-12">
            <span type="submit" className="btn btn-warning px-4 py-2 fw-bold text-black">
              Cập nhật
            </span>
          </div>

          <div className="col-12 text-white">
            Đổi mật khẩu, nhấn vào <a href="/change-password" className="text-warning">đây</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
