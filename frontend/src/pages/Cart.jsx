import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";

function Cart() {
  const navigate = useNavigate();

  const {
    cartItems,
    loading,
    error,
    totalItems,
    subtotal,
    refreshCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const [actionError, setActionError] = useState("");
  const [busyProduct, setBusyProduct] = useState("");

  useEffect(() => {
    if (error === "Please log in to view your cart.") {
      navigate("/login", { replace: true });
    }
  }, [error, navigate]);

  const handleQuantityChange = async (productId, quantity) => {
    setBusyProduct(productId);
    setActionError("");

    try {
      await updateQuantity(productId, quantity);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      setActionError(
        err.response?.data?.message ||
          "Unable to update quantity."
      );
    } finally {
      setBusyProduct("");
    }
  };

  const handleRemove = async (productId) => {
    setBusyProduct(productId);
    setActionError("");

    try {
      await removeFromCart(productId);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      setActionError(
        err.response?.data?.message ||
          "Unable to remove product."
      );
    } finally {
      setBusyProduct("");
    }
  };

  return (
    <div className="cart-page">
      <Navbar />

      <h1>My Cart</h1>

      {loading && (
        <p className="state-message">Loading your cart...</p>
      )}

      {!loading && error && (
        <div className="state-message">
          <h2>Unable to load your cart</h2>
          <p>{error}</p>

          <button onClick={refreshCart}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && cartItems.length === 0 && (
        <div className="empty-cart state-message">
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet.</p>

          <button onClick={() => navigate("/products")}>
            Browse Products
          </button>
        </div>
      )}

      {!loading && !error && cartItems.length > 0 && (
        <>
          {actionError && (
            <p className="error-message">{actionError}</p>
          )}

          <div className="products-grid">
            {cartItems.map((item) => {
              const product = item.product;

              if (!product) {
                return (
                  <div className="product-card" key={item._id}>
                    <p>This product is no longer available.</p>
                  </div>
                );
              }

              const isBusy = busyProduct === product._id;

              return (
                <div className="product-card" key={product._id}>
                  <div className="product-image-container">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                    />
                  </div>

                  <div className="product-info">
                    <p className="product-category">
                      {product.category}
                    </p>

                    <h2>{product.name}</h2>

                    <p className="product-price">
                      ₹{product.price}
                    </p>

                    <p>
                      ₹{product.price * item.quantity}
                    </p>

                    <div className="quantity-controls">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            product._id,
                            item.quantity - 1
                          )
                        }
                        disabled={
                          isBusy || item.quantity <= 1
                        }
                      >
                        -
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() =>
                          handleQuantityChange(
                            product._id,
                            item.quantity + 1
                          )
                        }
                        disabled={
                          isBusy ||
                          item.quantity >= product.stock
                        }
                      >
                        +
                      </button>
                    </div>

                    {isBusy && <p>Updating...</p>}

                    <button
                      className="wishlist-button"
                      onClick={() => handleRemove(product._id)}
                      disabled={isBusy}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="order-summary">
            <h2>Order Summary</h2>

            <p>Total items: {totalItems}</p>

            <p>
              Subtotal: ₹{subtotal.toLocaleString("en-IN")}
            </p>

            <button
              className="cart-button"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;