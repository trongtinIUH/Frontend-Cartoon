export const Card = ({ children, className = "", onClick }) => (
  <div
    className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);
