import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";

function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.order);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load order confirmation."
      );
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return (
    <div className="order-success-page">
      <Navbar />

      {loading ? (
        <p>Loading order confirmation...</p>
      ) : error ? (
        <div className="state-message">
          <h2>Unable to load confirmation</h2>
          <p>{error}</p>
          <button onClick={fetchOrder}>Try Again</button>
        </div>
      ) : order ? (
        <div className="state-message">
          <h1>
            {order.paymentStatus === "PAID"
              ? "Order Placed Successfully"
              : "Payment Pending"}
          </h1>

          <p>Order ID: {order._id}</p>

          <p>
            Total: ₹{order.totalAmount.toLocaleString("en-IN")}
          </p>

          <p>Payment: {order.paymentStatus}</p>
          <p>Status: {order.status}</p>

          {order.paymentStatus !== "PAID" && (
            <p>
              Payment has not been verified. Check your order before
              attempting another payment.
            </p>
          )}

          <button onClick={() => navigate("/orders")}>
            View My Orders
          </button>

          <button onClick={() => navigate("/products")}>
            Continue Shopping
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default OrderSuccess;