import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";

const initialAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  pincode: "",
};

function Checkout() {
  const navigate = useNavigate();

  const {
    cartItems,
    subtotal,
    loading,
    clearCart,
    refreshCart,
  } = useCart();

  const [shippingAddress, setShippingAddress] =
    useState(initialAddress);
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setShippingAddress((current) => ({
      ...current,
      [name]: value,
    }));

    setFormErrors((current) => ({
      ...current,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const errors = {};

    for (const [field, value] of Object.entries(shippingAddress)) {
      if (!value.trim()) {
        errors[field] = "This field is required.";
      }
    }

    if (
      shippingAddress.phone.trim() &&
      !/^[6-9]\d{9}$/.test(shippingAddress.phone.trim())
    ) {
      errors.phone = "Enter a valid 10-digit Indian phone number.";
    }

    if (
      shippingAddress.pincode.trim() &&
      !/^\d{6}$/.test(shippingAddress.pincode.trim())
    ) {
      errors.pincode = "Pincode must contain 6 digits.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setError("");

    if (!validateForm()) return;

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setPlacingOrder(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout.");
      }

      // The backend calculates the actual total and validates stock.
      const response = await api.post(
        "/orders/create-payment-order",
        {
          shippingAddress: {
            ...shippingAddress,
            fullName: shippingAddress.fullName.trim(),
            phone: shippingAddress.phone.trim(),
            addressLine1: shippingAddress.addressLine1.trim(),
            city: shippingAddress.city.trim(),
            state: shippingAddress.state.trim(),
            pincode: shippingAddress.pincode.trim(),
          },
        }
      );

      const data = response.data;

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ShopKart",
        description: "ShopKart Order",
        order_id: data.razorpayOrderId,

        prefill: {
          name: shippingAddress.fullName,
          contact: shippingAddress.phone,
        },

        handler: async (paymentResponse) => {
          try {
            const verification = await api.post(
              "/orders/verify-payment",
              {
                shopKartOrderId: data.shopKartOrderId,
                razorpay_order_id:
                  paymentResponse.razorpay_order_id,
                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,
                razorpay_signature:
                  paymentResponse.razorpay_signature,
              }
            );

            if (!verification.data.success) {
              throw new Error("Payment verification failed.");
            }

            clearCart();

            navigate(`/order-success/${data.shopKartOrderId}`, {
              replace: true,
            });
          } catch (err) {
            setError(
              err.response?.data?.message ||
                "Payment verification failed. Your cart has not been cleared."
            );
            await refreshCart();
          } finally {
            setPlacingOrder(false);
          }
        },

        modal: {
          ondismiss: () => {
            setPlacingOrder(false);
            setError(
              "Checkout was closed. Your cart has been preserved."
            );
          },
        },

        theme: {
          color: "#2563eb",
        },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", () => {
        setError(
          "Payment failed. Your cart has not been cleared. Please try again."
        );
        setPlacingOrder(false);
      });

      paymentObject.open();
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to start checkout."
      );
      setPlacingOrder(false);
    }
  };

  return (
    <div className="checkout-page">
      <Navbar />

      <h1>Checkout</h1>

      {loading ? (
        <p>Loading your cart...</p>
      ) : cartItems.length === 0 ? (
        <div className="state-message">
          <h2>Your cart is empty</h2>
          <button onClick={() => navigate("/products")}>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="checkout-layout">
          <form onSubmit={handlePlaceOrder}>
            <h2>Shipping Details</h2>

            {[
              ["fullName", "Full Name"],
              ["phone", "Phone Number"],
              ["addressLine1", "Address Line"],
              ["city", "City"],
              ["state", "State"],
              ["pincode", "Pincode"],
            ].map(([name, label]) => (
              <div className="form-field" key={name}>
                <label htmlFor={name}>{label}</label>

                <input
                  id={name}
                  name={name}
                  value={shippingAddress[name]}
                  onChange={handleChange}
                  autoComplete="on"
                  required
                />

                {formErrors[name] && (
                  <p className="error-message">
                    {formErrors[name]}
                  </p>
                )}
              </div>
            ))}

            {error && <p className="error-message">{error}</p>}

            <button
              type="submit"
              className="cart-button"
              disabled={placingOrder || loading}
            >
              {placingOrder ? "Processing..." : "Place Order"}
            </button>
          </form>

          <div className="order-summary">
            <h2>Order Summary</h2>

            {cartItems.map((item) => (
              <p key={item.product._id}>
                {item.product.name} × {item.quantity}
                {" — "}
                ₹
                {(
                  item.product.price * item.quantity
                ).toLocaleString("en-IN")}
              </p>
            ))}

            <h3>
              Total: ₹{subtotal.toLocaleString("en-IN")}
            </h3>

            <p>The final total is calculated by the server.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;