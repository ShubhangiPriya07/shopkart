import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";

function Wishlist() {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWishlist = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/wishlist");
      setWishlist(response.data.wishlist || []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load wishlist."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);

      setWishlist((currentWishlist) =>
        currentWishlist.filter(
          (product) => product._id !== productId
        )
      );
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      alert(
        err.response?.data?.message ||
          "Unable to remove product. Please try again."
      );
    }
  };

  return (
    <div className="wishlist-page">
      <Navbar />

      {loading ? (
        <div className="state-message">
          <h2>Loading your wishlist...</h2>
        </div>
      ) : error ? (
        <div className="state-message">
          <h2>Something went wrong</h2>
          <p>{error}</p>

          <button onClick={fetchWishlist}>
            Try Again
          </button>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="empty-wishlist">
          <h2>Your wishlist is empty</h2>
          <p>Save products you love and find them here later.</p>

          <button onClick={() => navigate("/products")}>
            Browse Products
          </button>
        </div>
      ) : (
        <>
          <h1>My Wishlist</h1>
          <p>{wishlist.length} products saved</p>

          <div className="products-grid">
            {wishlist.map((product) => (
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

                  <p className="product-stock">
                    {product.stock > 0
                      ? `${product.stock} units left`
                      : "Out of stock"}
                  </p>

                  <button
                    className="details-button"
                    onClick={() =>
                      navigate(`/products/${product._id}`)
                    }
                  >
                    View Details
                  </button>

                  <button
                    className="wishlist-button"
                    onClick={() => handleRemove(product._id)}
                  >
                    Remove from Wishlist
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Wishlist;