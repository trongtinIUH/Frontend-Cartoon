import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SidebarUserManagement from "../components/SidebarUserManagement";
import { toast } from "react-toastify";
import default_avatar from "../image/default_avatar.jpg";
import UserService from "../services/UserService";
import "../css/ProfilePage.css";
import ChangePasswordModal from "../models/ChangePasswordModal";

const ProfilePage = () => {
  const { MyUser, setMyUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("unspecified");
  const [avatar, setAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [showModalChangePassword, setShowModalChangePassword] = useState(false);

  useEffect(() => {
    if (MyUser?.my_user) {
      setEmail(MyUser.my_user.email);
      setDisplayName(MyUser.my_user.userName);
      setGender(MyUser.my_user.gender);
      setAvatar(MyUser.my_user.avatarUrl);
    } else {
      navigate("/");
    }
  }, [MyUser, navigate]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
      setAvatarFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = MyUser.my_user.userId;

      const userData = {
        email,
        userName: displayName,
        gender,
      };
      // check userName không được để trống
      if (!userData.userName.trim()) {
        return toast.error("Tên hiển thị không được để trống.");
      }

      // Gọi API update user
      await UserService.updateUserById(userId, userData, avatarFile);

      // Lấy user mới nhất từ server
      const updatedUserFromServer = await UserService.getUserById(userId);

      // Cập nhật MyUser + localStorage
      const newUserData = {
        ...MyUser,
        my_user: {
          ...MyUser.my_user,
          ...updatedUserFromServer,
        },
      };

      setMyUser(newUserData);
      localStorage.setItem("my_user", JSON.stringify(newUserData));

      toast.success("Cập nhật thành công!");
    } catch (err) {
      console.error("Lỗi khi cập nhật user:", err);
      toast.error("Cập nhật thất bại.");
    }
  };

  return (
      <div className="container-fluid text-white min-vh-100 py-5 px-3 profile-page">
        <div className="row">
          {/* Sidebar */}
          <div className="col-12 col-lg-3 mb-4">
            <SidebarUserManagement />
          </div>

          {/* Nội dung */}
          <div className="col-12 col-lg-9">
            <h5 className="mb-4 fw-bold">Tài khoản</h5>
            <p className="mb-4">Cập nhật thông tin tài khoản</p>

            <form onSubmit={handleSubmit} className="row g-4">
              {/* Email */}
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

              {/* Avatar */}
              <div className="col-md-3 text-center">
                <div className="position-relative d-inline-block mb-2">
                  <img
                    src={avatar || default_avatar}
                    alt="avatar"
                    className="rounded-circle border border-2"
                    style={{ width: 120, height: 120 }}
                  />
                  <label
                    className="position-absolute bottom-0 end-0 bg-secondary p-2 rounded-circle"
                    style={{ cursor: "pointer" }}
                  >
                    <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                    <i className="fas fa-camera"></i>
                  </label>
                </div>
                <div>Đổi ảnh đại diện</div>
              </div>

              {/* Display Name */}
              <div className="col-md-6">
                <label className="form-label text-white">Tên hiển thị</label>
                <input
                  type="text"
                  className="form-control bg-secondary text-white border-0"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              {/* Gender */}
              <div className="col-md-6">
                <label className="form-label text-white">Giới tính</label>
                <div>
                  {["male", "female", "unspecified"].map((g) => (
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
                        {g === "male" ? "Nam" : g === "female" ? "Nữ" : "Không xác định"}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Button */}
              <div className="col-12 col-md-3">
                <button type="submit" className="btn btn-watch px-4 py-2 fw-bold text-black">
                  Cập nhật
                </button>
              </div>

              {/* Change password */}
              <div className="col-12 text-white">
                Đổi mật khẩu, nhấn vào{" "}
                <span
                  style={{ color: "#4bc1fa", textDecoration: "none", cursor: "pointer" }}
                  onClick={() => setShowModalChangePassword(true)}
                >
                  đây
                </span>
              </div>
              <ChangePasswordModal
                show={showModalChangePassword}
                onClose={() => setShowModalChangePassword(false)}
              />
            </form>
          </div>
        </div>
      </div>
  );
};

export default ProfilePage;
