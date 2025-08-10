// utils/toast.js
import { toast } from "react-toastify";

const baseOptions = {
  position: "top-center",
  autoClose: 2500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  closeButton: true,
  icon: false,              // dùng gradient, icon không bắt buộc
  theme: "light",           // theme không ảnh hưởng vì mình style bằng class
};

const classesByType = {
  success: "toastify-gradient toastify-gradient--success",
  error:   "toastify-gradient toastify-gradient--error",
  warn:    "toastify-gradient toastify-gradient--warn",
  info:    "toastify-gradient toastify-gradient--info",
  default: "toastify-gradient toastify-gradient--info",
};

export const showToast = (message, type = "info", options = {}) => {
  const className = classesByType[type] || classesByType.default;

  const opts = {
    ...baseOptions,
    className,
    progressClassName: "toastify-gradient__progress",
    ...options,
  };

  switch (type) {
    case "success": return toast.success(message, opts);
    case "error":   return toast.error(message, opts);
    case "warn":    return toast.warn(message, opts);
    case "info":    return toast.info(message, opts);
    default:        return toast(message, opts);
  }
};

export default showToast;
