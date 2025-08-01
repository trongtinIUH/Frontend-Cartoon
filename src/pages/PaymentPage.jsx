import { useLocation } from "react-router-dom";

const PaymentPage = () => {
  const location = useLocation();
  const { selectedPackage } = location.state || {};

  return (
    <div className="min-vh-100 bg-dark text-white d-flex flex-column align-items-center justify-content-center" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
      <h1>Payment Page</h1>
    </div>
  );
};

export default PaymentPage;
