// UpdateUserModal.js
import React, { useState } from "react";
import showToast  from "../utils/AppUtils";
const UpdateUserModal = ({ isOpen, onClose, onSave }) => {


  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const [editUserInfo, setEditUserInfo] = useState({
    gender: userInfo.gender || "Male",
    dob: userInfo.dob || "",
    fullName: userInfo.fullName || "",
    username: userInfo.username || "",
  });

  // Hàm kiểm tra và xử lý tên (đảm bảo mỗi từ bắt đầu bằng chữ hoa)
  const capitalizeName = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditUserInfo({
      ...editUserInfo,
      [name]: value,
    });
  };

  const handleSave = () => {
    // Kiểm tra fullName không được để trống
    if (!editUserInfo.fullName.trim()) {
      showToast("Tên đầy đủ không được để trống", "error");
      return; // Không lưu thông tin nếu tên trống
    }
  
    // Kiểm tra tên không chứa ký tự đặc biệt và chữ số
    const namePattern = /^[a-zA-Zàáạảãàâầấẩẫăắằẳẵâờóọỏõờđèéẹẻẽêếềểễỉíìịĩóòọỏõôồốổỗơờớởỡơúùụủũưừứựửữýỳỷỹỵ\s]+$/; // Chỉ cho phép chữ cái và dấu cách
    if (!namePattern.test(editUserInfo.fullName)) {
      showToast("Tên đầy đủ không được chứa ký tự đặc biệt hoặc số", "error");
      return; // Không lưu thông tin nếu tên chứa ký tự đặc biệt hoặc số
    }
  
    // Kiểm tra ngày sinh (dob)
    const today = new Date();
    const dob = new Date(editUserInfo.dob);
  
    // Kiểm tra ngày sinh không lớn hơn ngày hiện tại
    if (dob > today) {
      showToast("Ngày sinh không được lớn hơn ngày hiện tại", "error");
      return; // Không lưu thông tin nếu ngày sinh lớn hơn ngày hiện tại
    }
  
    // Kiểm tra tuổi (>= 14 tuổi)
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
  
    if (age < 14) {
      showToast("Bạn phải đủ 14 tuổi để cập nhật thông tin", "error");
      return; // Không lưu thông tin nếu tuổi nhỏ hơn 14
    }
  
    // Chỉnh sửa tên đầy đủ nếu cần
    const formattedFullName = capitalizeName(editUserInfo.fullName);
    const updatedUserInfo = { ...editUserInfo, fullName: formattedFullName };
  
    onSave(updatedUserInfo);
    onClose(); // Đóng modal sau khi lưu
  };
  
  
  

  return (
    isOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <h3 className="text-xl font-bold mb-4">Cập nhật thông tin</h3>
          <div className="space-y-4">
            <input
              type="text"
              name="fullName"
              value={editUserInfo.fullName || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder="Họ và tên"
            />
            <input
              type="text"
              name="username"
              disabled
              value={editUserInfo.username || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder="Số điện thoại"
            />
            <select
              name="gender"
              value={editUserInfo.gender || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Chọn giới tính</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
              <option value="Other">Khác</option>
            </select>
            <input
              type="date"
              name="dob"
              value={editUserInfo.dob || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder="Ngày sinh"
            />
            <div className="flex justify-between mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-500 text-white rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded-lg"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default UpdateUserModal;