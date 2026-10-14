import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/cart");
      setCartItems(response.data.cart || []);

      return response.data.cart || [];
    } catch (err) {
      if (err.response?.status === 401) {
        setCartItems([]);
        setError("Please log in to view your cart.");
      } else {
        setError(
          err.response?.data?.message || "Unable to load your cart."
        );
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh when the user navigates between pages.
  useEffect(() => {
    refreshCart();
  }, [location.pathname, refreshCart]);

  const addToCart = async (productId) => {
    const response = await api.post(`/cart/${productId}`);
    setCartItems(response.data.cart || []);
    setError("");
    return response.data;
  };

  const updateQuantity = async (productId, quantity) => {
    const response = await api.patch(`/cart/${productId}`, {
      quantity,
    });

    setCartItems(response.data.cart || []);
    setError("");
    return response.data;
  };

  const removeFromCart = async (productId) => {
    const response = await api.delete(`/cart/${productId}`);
    setCartItems(response.data.cart || []);
    setError("");
    return response.data;
  };

  const clearCart = () => {
    setCartItems([]);
    setError("");
  };

  // Derived values: do not store totals separately.
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = cartItems.reduce(
    (total, item) =>
      total + (item.product?.price || 0) * item.quantity,
    0
  );

  const value = {
    cartItems,
    setCartItems,
    loading,
    error,
    totalItems,
    subtotal,
    refreshCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}