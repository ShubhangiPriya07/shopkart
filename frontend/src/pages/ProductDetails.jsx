import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);

        setProduct(response.data.product);
      } catch (error) {
        setError("Something went wrong while loading the product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <h2>Loading product...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  if (!product) {
    return <h2>Product not found.</h2>;
  }

  return (
    <div>
      <img
        src={product.image}
        alt={product.name}
        width="400"
      />

      <h1>{product.name}</h1>

      <p>{product.description}</p>

      <p>₹{product.price}</p>

      <p>Category: {product.category}</p>

      <p>Stock: {product.stock} units</p>

      <button>Add to Cart</button>
    </div>
  );
}

export default ProductDetails;