
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";

function App() {
    const { user } = useAuth();

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Navigate to={user ? "/dashboard" : "/login"} />}
                />

                <Route
                    path="/login"
                    element={user ? <Navigate to="/dashboard" /> : <Login />}
                />

                <Route
                    path="/signup"
                    element={user ? <Navigate to="/dashboard" /> : <Signup />}
                />

                <Route
                    path="/dashboard"
                    element={user ? <Dashboard /> : <Navigate to="/login" />}
                />

                <Route
                    path="/products"
                    element={user ? <Products /> : <Navigate to="/login" />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
