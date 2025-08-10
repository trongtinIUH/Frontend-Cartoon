// components/Logo.jsx
export default function Logo({ type = "wordmark", size = 40, onClick }) {
  const style = { display: "inline-flex", alignItems: "center", gap: 10, cursor: onClick ? "pointer" : "default" };
  if (type === "icon") {
    return (
      <img
        src={`${process.env.PUBLIC_URL}/image/cartoontoo-icon.svg`}
        alt="CartoonToo"
        width={size}
        height={size}
        style={{ borderRadius: 12 }}
        onClick={onClick}
      />
    );
  }
  return (
    <span style={style} onClick={onClick}>
      <img
        src={`${process.env.PUBLIC_URL}/image/cartoontoo-icon.svg`}
        alt="CartoonToo"
        width={size}
        height={size}
        style={{ borderRadius: 10 }}
      />
      <span style={{ fontWeight: 900, color: "#EAF2FF", fontFamily: "Poppins, Segoe UI, system-ui, sans-serif" }}>
        Cartoon
        <span style={{
          background: "linear-gradient(90deg,#F59E0B,#FDE047)",
          color: "#0A0A0A",
          borderRadius: 14,
          padding: "2px 8px",
          marginLeft: 6,
          fontWeight: 800
        }}>Too</span>
      </span>
    </span>
  );
}
