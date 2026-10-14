import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function Navbar() {
  const navigate = useNavigate();
  const { totalItems, clearCart } = useCart();

  const handleLogout = async () => {
    try {
      await api.post("/customers/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      clearCart();
      navigate("/login");
    }
  };

  return (
    <nav className="navbar">
      <h2
        onClick={() => navigate("/home")}
        style={{ cursor: "pointer" }}
      >
        ShopKart
      </h2>

      <div className="navbar-links">
        <button onClick={() => navigate("/home")}>
          Home
        </button>

        <button onClick={() => navigate("/products")}>
          Products
        </button>

        <button onClick={() => navigate("/wishlist")}>
          Wishlist
        </button>

        <button onClick={() => navigate("/cart")}>
          Cart ({totalItems})
        </button>

        <button onClick={() => navigate("/orders")}>
          My Orders
        </button>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;