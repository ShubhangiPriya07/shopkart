import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [savingWishlist, setSavingWishlist] = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleAddToWishlist = async () => {
    setSavingWishlist(true);
    setMessage("");
    setError("");

    try {
      await api.post(`/wishlist/${product._id}`);
      setMessage("Added to Wishlist");
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to save product."
      );
    } finally {
      setSavingWishlist(false);
    }
  };

  const handleAddToCart = async () => {
    setAddingCart(true);
    setMessage("");
    setError("");

    try {
      await addToCart(product._id);
      setMessage("Added to Cart");
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to add product to cart."
      );
    } finally {
      setAddingCart(false);
    }
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
        />
      </div>

      <div className="product-info">
        <p className="product-category">{product.category}</p>

        <h2>{product.name}</h2>

        <p className="product-price">₹{product.price}</p>

        <p className="product-stock">
          {product.stock > 0
            ? `${product.stock} units left`
            : "Out of stock"}
        </p>

        <button
          className="details-button"
          onClick={() => navigate(`/products/${product._id}`)}
        >
          View Details
        </button>

        <button
          className="wishlist-button"
          onClick={handleAddToWishlist}
          disabled={savingWishlist}
        >
          {savingWishlist ? "Saving..." : "♡ Add to Wishlist"}
        </button>

        <button
          className="cart-button"
          onClick={handleAddToCart}
          disabled={addingCart || product.stock < 1}
        >
          {addingCart
            ? "Adding..."
            : product.stock < 1
              ? "Out of Stock"
              : "Add to Cart"}
        </button>

        {message && <p>{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default ProductCard;