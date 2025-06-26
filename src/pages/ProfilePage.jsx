import React,{useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/ProfilePage.css";
import {User,Mail  } from 'lucide-react';
import UserService from "../services/UserService";
import { toast } from "react-toastify";
import Header from "../components/Header";
import AuthService from "../services/AuthService";

const ProfilePage = () => {
  const { MyUser, updateUserInfo } = useAuth();
  const navigate = useNavigate();

  const user = MyUser?.my_user || {};

  const [isEditing, setIsEditing] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [form, setForm] = useState({
    userName: user.userName || "",
    email: user.email || "",
    dob: user.dob || "",
  });



  return (
    <div className="profile-page">
      <Header />
      <div className="profile-card">
        <img
          className="profile-avatar"
          src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
          alt="Avatar"
        />

        {isEditing ? (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
             // Gửi thông tin cập nhật lên server
            await UserService.updateUserById(user.userId, form);

            // Gọi lại API lấy thông tin mới nhất
            const updatedUser = await UserService.getUserById(user.userId);

            // Cập nhật lại vào context + localStorage
            updateUserInfo({ my_user: updatedUser });

            toast.success("Cập nhật thành công!");
          } catch (error) {
            console.error("Cập nhật thất bại:", error);
            toast.error("Cập nhật thất bại. Vui lòng thử lại sau.");
          }
          setIsEditing(false);
          // Có thể reload lại thông tin user nếu cần
        }}
      >
        <div>
          <h2>Chỉnh sửa thông tin cá nhân</h2>
          <label>Họ tên:</label>
          <input
            name="userName"
            value={form.userName}
            onChange={e => setForm({ ...form, userName: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            name="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label>Ngày sinh:</label>
          <input
            name="dob"
            type="date"
            value={form.dob}
            onChange={e => setForm({ ...form, dob: e.target.value })}
          />
        </div>
        <div style={{ marginTop: 12 , display: 'flex', justifyContent: 'flex-end'}}>
          <button type="submit">Lưu</button>
          <button type="button" onClick={() => setIsEditing(false)} style={{ marginLeft: 8, backgroundColor: "#636e72", color: "white" }}>
            Hủy
          </button>
        </div>
      </form>
    ) : (
      <>
        <div className="info-group">
          <strong><User />Họ tên:</strong> <span>{user.userName}</span>
        </div>
        <div className="info-group">
          <strong><Mail /> Email:</strong> <span>{user.email || "Chưa cập nhật"}</span>
        </div>
        <div className="info-group">
          <strong>🔐 Vai trò:</strong> <span>{user.role}</span>
        </div>
        <div className="info-group">
          <strong>🆔 ID:</strong> <span>{user.userId}</span>
        </div>
        <div className="info-group">
          <strong>📅 Ngày tạo:</strong> <span>{user.createdAt || "N/A"}</span>
        </div>
        <div className="button-group">
          <button className="back-button" onClick={() => navigate("/main")}>
            Quay lại
          </button>
          <button className="edit-button" style={{ backgroundColor: "#8fce00", color: "white" }} onClick={() => setIsEditing(true)}>
            Chỉnh sửa
          </button>
          <button className="change-password-button" style={{ backgroundColor: "#8fce00", color: "white",fontSize:"14px" }} onClick={() => setIsChangingPassword((prev)=> !prev)}>
            Đổi mật khẩu
          </button>
        </div>

        {isChangingPassword && (
          <form
            className="change-password-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const { currentPassword, newPassword, confirmPassword } = changePasswordForm;

              if (newPassword !== confirmPassword) {
                toast.error("Mật khẩu mới và xác nhận mật khẩu không khớp.");
                return;
              }

              try {
                await AuthService.changePassword({
                  username: user.phoneNumber,
                  currentPassword,
                  newPassword,
                });
                toast.success("Đổi mật khẩu thành công!");
                setChangePasswordForm({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: ""
                });
                setIsChangingPassword(false);
              } catch (error) {
                console.error("Error changing password:", error);
                toast.error("Đổi mật khẩu thất bại. Vui lòng thử lại sau.");
              }
            }}
          >
            <h3>Đổi mật khẩu</h3>
            <div>
              <label>Hiện tại:</label>
              <input
                type="password"
                name="currentPassword"
                value={changePasswordForm.currentPassword}
                onChange={(e) => setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Mật khẩu mới:</label>
              <input
                type="password"
                name="newPassword"
                value={changePasswordForm.newPassword}
                onChange={(e) => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Xác nhận mật khẩu mới:</label>
              <input
                type="password"
                name="confirmPassword"
                value={changePasswordForm.confirmPassword}
                onChange={(e) => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                required
              />
            </div>
            <div style={{flexDirection:"row", display:"flex", justifyContent:"space-between"}}>
              <button type="submit">Lưu</button>
              <button type="button" onClick={() => setIsChangingPassword(false)} style={{ marginLeft: 8, backgroundColor: "#636e72", color: "white" }}>
                Hủy
              </button>
            </div>
          </form>
        )}
      </>
    )}

        <div className="profile-footer">
          <p>© 2025 - Bản quyền thuộc về trongtinIUH</p>
        </div>
      </div>
    </div>
  );
};


export default ProfilePage;
