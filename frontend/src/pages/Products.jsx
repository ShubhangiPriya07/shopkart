import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import Navbar from "../components/Navbar";

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (search) {
        params.search = search;
      }

      if (category) {
        params.category = category;
      }

      const response = await api.get("/products", { params });
      setProducts(response.data.products);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError("Something went wrong while loading products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category]);

  return (
    <div className="products-page">
      <Navbar />

      <div className="products-header">
        <h1>ShopKart Products</h1>
        <p>Browse our available products</p>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Fashion">Fashion</option>
          <option value="Books">Books</option>
          <option value="Home">Home</option>
        </select>
      </div>

      {loading && (
        <div className="state-message">
          <h2>Loading products...</h2>
        </div>
      )}

      {error && (
        <div className="state-message">
          <h2>{error}</h2>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="state-message">
          <h2>No products found.</h2>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;