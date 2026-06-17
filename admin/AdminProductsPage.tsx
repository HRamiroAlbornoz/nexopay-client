import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, deleteProduct } from "../../services/products/products.service";
import type { Product } from "../../types";

type Status = "loading" | "empty" | "ready" | "error";

export const AdminProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setStatus("loading");
        const data = await getProducts();
        setProducts(data);
        setStatus(data.length === 0 ? "empty" : "ready");
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (productId: string) => {
    const confirmDelete = window.confirm(
      "Seguro que desea eliminar este producto?",
    );
    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(productId);
      await deleteProduct(productId);
      const updatedProducts = products.filter(
        (product) => product.id !== productId,
      );
      setProducts(updatedProducts);
      if (updatedProducts.length === 0) {
        setStatus("empty");
      }
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el producto");
    } finally {
      setDeletingId(null);
    }
  };

  //* Loading:
  if (status === "loading") {
    return <p>Loading products...</p>;
  }

  //* Error:
  if (status === "error") {
    return <p>Error loading products.</p>;
  }

  //* Empty:
  if (status === "empty") {
    return (
      <div>
        <h1>Admin Products</h1>

        <button onClick={() => navigate("/admin/products/new")}>
          Create Product
        </button>

        <p
          style={{
            marginTop: "1rem",
          }}
        >
          No products yet.
        </p>
      </div>
    );
  }

  //* Ready:
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h1>Admin Products</h1>

        <button onClick={() => navigate("/admin/products/new")}>
          Create Product
        </button>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              style={{
                opacity: deletingId === product.id ? 0.5 : 1,
              }}
            >
              <td>{product.name}</td>
              <td>${product.price}</td>
              <td>{product.category}</td>
              <td>{product.stock}</td>
              <td>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    onClick={() =>
                      navigate(`/admin/products/${product.id}/edit`)
                    }
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                  >
                    {deletingId === product.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
