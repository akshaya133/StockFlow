
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

function Products() {
    const { user, logout } = useAuth();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState(null);

    const emptyForm = {
        name: "",
        sku: "",
        description: "",
        quantity: 0,
        cost_price: "",
        selling_price: "",
        low_stock_threshold: ""
    };

    const [formData, setFormData] = useState(emptyForm);

    const fetchProducts = async () => {
        try {
            const response = await API.get("/products");
            setProducts(response.data.products);
            setError("");
        } catch (error) {
            setError(
                error.response?.data?.message || "Unable to fetch products"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const productData = {
            ...formData,
            quantity: Number(formData.quantity),
            cost_price: formData.cost_price === ""
                ? null
                : Number(formData.cost_price),
            selling_price: formData.selling_price === ""
                ? null
                : Number(formData.selling_price),
            low_stock_threshold: formData.low_stock_threshold === ""
                ? null
                : Number(formData.low_stock_threshold)
        };

        try {
            if (editingId) {
                await API.put(`/products/${editingId}`, productData);
            } else {
                await API.post("/products", productData);
            }

            setFormData(emptyForm);
            setEditingId(null);
            fetchProducts();

        } catch (error) {
            setError(
                error.response?.data?.message || "Unable to save product"
            );
        }
    };

    const handleEdit = (product) => {
        setEditingId(product.id);

        setFormData({
            name: product.name,
            sku: product.sku,
            description: product.description || "",
            quantity: product.quantity,
            cost_price: product.cost_price || "",
            selling_price: product.selling_price || "",
            low_stock_threshold: product.low_stock_threshold ?? ""
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this product?"
        );

        if (!confirmed) return;

        try {
            await API.delete(`/products/${id}`);
            fetchProducts();
        } catch (error) {
            setError(
                error.response?.data?.message || "Unable to delete product"
            );
        }
    };

    const handleCancel = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setError("");
    };

    const handleLogout = () => {
        logout();
        window.location.href = "/login";
    };

    return (
        <div className="products-container">
            <header className="dashboard-header">
                <div>
                    <h1>StockFlow</h1>
                    <p>Inventory Management System</p>
                </div>

                <div className="header-actions">
                    <span>{user?.name}</span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="products-content">
                <div className="products-title">
                    <div>
                        <h2>Products</h2>
                        <p>Manage your inventory</p>
                    </div>

                    <Link to="/dashboard" className="primary-link">
                        Back to Dashboard
                    </Link>
                </div>

                {error && <p className="error-message">{error}</p>}

                <section className="product-form-card">
                    <h3>{editingId ? "Edit Product" : "Add New Product"}</h3>

                    <form onSubmit={handleSubmit} className="product-form">
                        <input
                            type="text"
                            name="name"
                            placeholder="Product Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                        <input
                            type="text"
                            name="sku"
                            placeholder="SKU"
                            value={formData.sku}
                            onChange={handleChange}
                            required
                        />

                        <input
                            type="text"
                            name="description"
                            placeholder="Description"
                            value={formData.description}
                            onChange={handleChange}
                        />

                        <input
                            type="number"
                            name="quantity"
                            placeholder="Quantity"
                            min="0"
                            step="1"
                            value={formData.quantity}
                            onChange={handleChange}
                            required
                        />

                        <input
                            type="number"
                            name="cost_price"
                            placeholder="Cost Price"
                            min="0"
                            step="0.01"
                            value={formData.cost_price}
                            onChange={handleChange}
                        />

                        <input
                            type="number"
                            name="selling_price"
                            placeholder="Selling Price"
                            min="0"
                            step="0.01"
                            value={formData.selling_price}
                            onChange={handleChange}
                        />

                        <input
                            type="number"
                            name="low_stock_threshold"
                            placeholder="Low Stock Threshold"
                            min="0"
                            step="1"
                            value={formData.low_stock_threshold}
                            onChange={handleChange}
                        />

                        <div className="form-buttons">
                            <button type="submit">
                                {editingId ? "Update Product" : "Add Product"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                <section className="product-table-card">
                    <h3>Inventory List</h3>

                    {loading ? (
                        <p>Loading products...</p>
                    ) : products.length === 0 ? (
                        <p>No products found. Add your first product.</p>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>SKU</th>
                                        <th>Quantity</th>
                                        <th>Stock Status</th>
                                        <th>Selling Price</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {products.map((product) => {
                                        const threshold =
                                            product.low_stock_threshold ?? 5;

                                        const isLowStock =
                                            product.quantity <= threshold;

                                        return (
                                            <tr key={product.id}>
                                                <td>{product.name}</td>
                                                <td>{product.sku}</td>
                                                <td>{product.quantity}</td>
                                                <td>
                                                    <span className={
                                                        isLowStock
                                                            ? "low-stock"
                                                            : "in-stock"
                                                    }>
                                                        {isLowStock
                                                            ? "Low Stock"
                                                            : "In Stock"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {product.selling_price
                                                        ? `₹${product.selling_price}`
                                                        : "-"}
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(product)
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(product.id)
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default Products;
