import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";

function OrderDetails() {
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
        err.response?.data?.message || "Unable to load this order."
      );
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return (
    <div className="order-details-page">
      <Navbar />

      {loading ? (
        <p>Loading order details...</p>
      ) : error ? (
        <div className="state-message">
          <h2>Unable to load order</h2>
          <p>{error}</p>
          <button onClick={fetchOrder}>Try Again</button>
        </div>
      ) : order ? (
        <>
          <h1>Order Details</h1>
          <p>Order ID: {order._id}</p>
          <p>
            Date: {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>

          <h2>Items</h2>

          {order.items.map((item, index) => (
            <div
              className="order-item"
              key={`${order._id}-${index}`}
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  width="100"
                />
              )}

              <h3>{item.name}</h3>
              <p>Price at purchase: ₹{item.price}</p>
              <p>Quantity: {item.quantity}</p>
              <p>
                Item total: ₹
                {(item.price * item.quantity).toLocaleString("en-IN")}
              </p>
            </div>
          ))}

          <h2>
            Total: ₹{order.totalAmount.toLocaleString("en-IN")}
          </h2>

          <p>Payment status: {order.paymentStatus}</p>
          <p>Order status: {order.status}</p>

          <h2>Shipping Address</h2>
          <p>{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.phone}</p>
          <p>{order.shippingAddress.addressLine1}</p>
          <p>
            {order.shippingAddress.city},{" "}
            {order.shippingAddress.state}{" "}
            {order.shippingAddress.pincode}
          </p>

          <button onClick={() => navigate("/orders")}>
            Back to My Orders
          </button>

          <button onClick={() => navigate("/products")}>
            Continue Shopping
          </button>
        </>
      ) : null}
    </div>
  );
}

export default OrderDetails;