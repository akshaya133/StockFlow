
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState({
        total_products: 0,
        total_quantity: 0,
        low_stock_items: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await API.get("/dashboard");
                setDashboard(response.data.dashboard);
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Unable to load dashboard data"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1>StockFlow</h1>
                    <p>Inventory Management System</p>
                </div>

                <div className="header-actions">
                    <span>Welcome, {user?.name}</span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="dashboard-title">
                    <div>
                        <h2>Dashboard</h2>
                        <p>{user?.organizationName}</p>
                    </div>

                    <Link to="/products" className="primary-link">
                        Manage Products
                    </Link>
                </div>

                {loading ? (
                    <p>Loading dashboard...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>Total Products</h3>
                            <p>{dashboard.total_products}</p>
                        </div>

                        <div className="stat-card">
                            <h3>Total Stock Quantity</h3>
                            <p>{dashboard.total_quantity}</p>
                        </div>

                        <div className="stat-card low-stock-card">
                            <h3>Low Stock Items</h3>
                            <p>{dashboard.low_stock_items}</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Dashboard;
