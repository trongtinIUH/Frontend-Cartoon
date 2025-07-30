import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/Card";
import { useAuth } from "../context/AuthContext";
import {
  BarChart3,
  Users,
  PackageSearch,
  LayoutDashboard,
} from "lucide-react";


const ControlPanelPage = () => {
  const navigate = useNavigate();
  const { MyUser } = useAuth();

  // Kiểm tra quyền admin
  const isAdmin = MyUser?.my_user?.role === "ADMIN";
  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-gray-50">
        <div className="bg-white px-8 py-6 rounded-xl shadow text-center">
          <p className="text-lg text-red-500 font-semibold">
            Bạn không có quyền truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  // Dữ liệu các panel
  const panels = [
    {
      title: "Người dùng",
      description: "Quản lý tài khoản người dùng",
      icon: <Users className="text-blue-500 w-10 h-10" />,
      path: "/admin/users",
    },
    {
      title: "Quản lý phim",
      description: "Thêm, sửa, xóa phim và tập phim",
      icon: <PackageSearch className="text-green-500 w-10 h-10" />,
      path: "/manage-movie",
    },
    {
      title: "Chức năng bí ẩn",
      description: "Chức năng này sẽ được cập nhật sau",
      icon: <LayoutDashboard className="text-orange-500 w-10 h-10" />,
      path: "/admin/orders",
    },
    {
      title: "Thống kê",
      description: "Biểu đồ lượt xem & truy cập",
      icon: <BarChart3 className="text-purple-500 w-10 h-10" />,
      path: "/admin/statistics",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center drop-shadow">
          Bảng Điều Khiển Quản Trị
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {panels.map((panel, index) => (
            <Card
              key={index}
              className="group cursor-pointer bg-white border border-gray-200 rounded-2xl shadow hover:shadow-2xl transition-all duration-300"
              onClick={() => navigate(panel.path)}
            >
              <CardContent className="flex flex-col items-center p-8">
                <div className="mb-4 group-hover:scale-110 transition-transform">{panel.icon}</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2 text-center">
                  {panel.title}
                </h2>
                <p className="text-sm text-gray-500 text-center">{panel.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    
    </div>
  );
};

export default ControlPanelPage;