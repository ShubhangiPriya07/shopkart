import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/orders");
      setOrders(response.data.orders || []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message || "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="orders-page">
      <Navbar />

      <h1>My Orders</h1>

      {loading ? (
        <p>Loading your orders...</p>
      ) : error ? (
        <div className="state-message">
          <h2>Unable to load orders</h2>
          <p>{error}</p>
          <button onClick={fetchOrders}>Try Again</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="state-message">
          <h2>You have not placed any orders yet.</h2>
          <button onClick={() => navigate("/products")}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order._id}>
              <h2>Order #{order._id}</h2>

              <p>
                Date:{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN")}
              </p>

              <div>
                {order.items.map((item, index) => (
                  <p key={`${order._id}-${index}`}>
                    {item.name} × {item.quantity}
                  </p>
                ))}
              </div>

              <p>
                Total: ₹
                {order.totalAmount.toLocaleString("en-IN")}
              </p>

              <p>Payment: {order.paymentStatus}</p>
              <p>Status: {order.status}</p>

              <button
                onClick={() => navigate(`/orders/${order._id}`)}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;