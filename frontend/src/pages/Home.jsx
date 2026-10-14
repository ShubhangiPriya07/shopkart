import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import api from "../services/api";

function Home() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/products");
        setProducts(response.data.products || response.data || []);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load products. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate]);

  return (
    <>
      <Navbar />

      <main className="shopping-home shopping-home-products-only">
        <section className="shopping-products-section">
          <div className="shopping-section-header">
            <div>
              <span className="section-eyebrow">OUR COLLECTION</span>
              <h2>Explore products</h2>
              <p>Find something you'll love.</p>
            </div>
          </div>

          {loading && (
            <div className="loading-state">Loading products...</div>
          )}

          {!loading && error && (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="empty-state">
              <h3>No products available yet</h3>
              <p>Check back later for new arrivals.</p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default Home;