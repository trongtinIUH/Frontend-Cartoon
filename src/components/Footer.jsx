import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaArrowUp,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: "#1e2a33",
        color: "#ccc",
        padding: "40px 20px",
        textAlign: "center",
        fontSize: "14px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
       
        
        <h5 style={{ marginTop: "30px", color: "#eee" }}>Miễn trừ trách nhiệm</h5>
        <p style={{ maxWidth: "900px", margin: "10px auto" }}>
          Trang web này cung cấp nội dung hoạt hình chỉ với mục đích giải trí và
          <strong> không chịu trách nhiệm </strong>về bất kỳ nội dung quảng cáo,
          liên kết của bên thứ ba hiển thị trên trang web của chúng tôi.
        </p>
        <p style={{ maxWidth: "900px", margin: "0 auto" }}>
          Tất cả thông tin và hình ảnh trên website đều được thu thập từ internet.
          Chúng tôi không chịu trách nhiệm về bất kỳ nội dung nào. Nếu bạn hoặc tổ chức của bạn có vấn đề liên quan đến nội dung hiển thị, vui lòng liên hệ với chúng tôi để được giải quyết.
        </p>

        <div style={{ marginTop: "30px", display: "flex", justifyContent: "center", gap: "15px" }}>
          <a href="#" style={{ color: "#fff" }}><FaFacebookF /></a>
          <a href="#" style={{ color: "#fff" }}><FaInstagram /></a>
          <a href="#" style={{ color: "#fff" }}><FaTwitter /></a>
          <a href="#" style={{ color: "#fff" }}><FaYoutube /></a>
          <a href="#" style={{
            backgroundColor: "#7fff00",
            borderRadius: "4px",
            padding: "5px",
            color: "#000"
          }}><FaArrowUp /></a>
        </div>

        <p>Liên Hệ Quảng Cáo: <a href="https://www.linkedin.com/in/t%C3%ADn-tr%E1%BA%A7n-tr%E1%BB%8Dng-b05549367/" style={{ color: "#f5f5f5" }}>trantin1973@gmail.com</a></p>
        <p style={{ marginTop: "5px" }}>© Copyright 2025 CartoonToo. All rights reserved.</p>

      </div>
    </footer>
  );
};

export default Footer;
