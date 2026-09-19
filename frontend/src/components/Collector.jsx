import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

function Collector() {
    // =====================================================
    // AUTH STATE
    // =====================================================

    const [collector, setCollectorState] = useState(
        JSON.parse(localStorage.getItem("collector")) || null
    );

    const [mode, setMode] = useState("login");

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
    });

    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";

            const body =
                mode === "login"
                    ? { email: form.email, password: form.password }
                    : {
                          name: form.name,
                          email: form.email,
                          phone: form.phone,
                          password: form.password,
                      };

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            if (mode === "login") {
                localStorage.setItem("token", data.token);
                localStorage.setItem("collector", JSON.stringify(data.user));
                setCollectorState(data.user);
            } else {
                setMessage("Collector account created. You can log in now.");
                setMode("login");
                setForm({ name: "", email: "", phone: "", password: "" });
            }
        } catch (error) {
            console.error(error);
            setMessage(error.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("collector");
        setCollectorState(null);
    };

    // =====================================================
    // LOGGED-OUT VIEW: LOGIN / SIGNUP
    // =====================================================

    if (!collector) {
        return (
            <div className="collector-page">
                <div className="collector-card">
                    <div className="collector-icon">🩸</div>

                    <h1>
                        {mode === "login" ? "Collector Login" : "Collector Signup"}
                    </h1>

                    <p className="collector-subtitle">
                        {mode === "login"
                            ? "Login to see nearby blood collection requests."
                            : "Create an account to become a blood collector."}
                    </p>

                    <form onSubmit={handleAuthSubmit}>
                        {mode === "signup" && (
                            <>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter your full name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Enter your phone number"
                                        value={form.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button type="submit" className="collector-submit">
                            {mode === "login" ? "Login" : "Create Collector Account"}
                        </button>
                    </form>

                    {message && <p className="collector-message">{message}</p>}

                    <p className="collector-switch">
                        {mode === "login"
                            ? "Don't have a collector account?"
                            : "Already have a collector account?"}
                        <br />
                        <button
                            type="button"
                            onClick={() => {
                                setMode(mode === "login" ? "signup" : "login");
                                setMessage("");
                            }}
                        >
                            {mode === "login" ? "Signup as Collector" : "Login"}
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    // =====================================================
    // LOGGED-IN VIEW: DASHBOARD
    // =====================================================

    return <CollectorDashboard collector={collector} onLogout={handleLogout} />;
}

// =====================================================
// DASHBOARD COMPONENT
// =====================================================

function CollectorDashboard({ collector, onLogout }) {
    const [location, setLocation] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError("Location is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => {
                setError("Please allow location access to see nearby requests.");
            }
        );
    };

    const loadRequests = async () => {
        if (!location) return;

        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_URL}/requests/nearby?latitude=${location.latitude}&longitude=${location.longitude}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    onLogout();
                    return;
                }
                throw new Error(data.message || "Unable to load requests");
            }

            setRequests(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getLocation();
    }, []);

    useEffect(() => {
        if (location) {
            loadRequests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    const respond = async (requestId, action) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${API_URL}/requests/${requestId}/${action}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Action failed");
                return;
            }

            alert(data.message);
            loadRequests();
        } catch (err) {
            console.error(err);
            alert("Could not reach the backend.");
        }
    };

    return (
        <div className="collector-page collector-dashboard">
            <div className="collector-card dashboard-card">
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome, {collector.name}</h1>
                        <p className="collector-subtitle">
                            Nearby donors requesting a blood collector.
                        </p>
                    </div>

                    <button className="location-button" onClick={onLogout}>
                        Logout
                    </button>
                </div>

                <button className="location-button" onClick={getLocation}>
                    📍 Refresh My Location
                </button>

                {location && (
                    <p className="location-success">
                        ✓ Location: {location.latitude.toFixed(4)},{" "}
                        {location.longitude.toFixed(4)}
                    </p>
                )}

                {error && <p className="location-error">{error}</p>}

                {loading && <p className="loading">Loading nearby requests...</p>}

                {!loading && location && requests.length === 0 && !error && (
                    <p className="empty-message">
                        No pending collection requests near you right now.
                    </p>
                )}

                <div className="request-list">
                    {requests.map((req) => (
                        <div className="request-card" key={req.id}>
                            <h3>{req.donor_name}</h3>

                            <p>
                                <strong>Blood Group:</strong> {req.blood_group}
                            </p>

                            <p>
                                <strong>Phone:</strong> {req.donor_phone}
                            </p>

                            <p>
                                <strong>City:</strong> {req.city}
                            </p>

                            {req.address && (
                                <p>
                                    <strong>Address / Landmark:</strong>{" "}
                                    {req.address}
                                </p>
                            )}

                            {req.blood_bank_name && (
                                <p>
                                    <strong>Preferred Blood Bank:</strong>{" "}
                                    {req.blood_bank_name} (
                                    {req.blood_bank_address})
                                </p>
                            )}

                            <p className="distance">
                                📍 Distance:{" "}
                                {req.distance !== null &&
                                req.distance !== undefined
                                    ? `${Number(req.distance).toFixed(1)} km`
                                    : "Distance unavailable"}
                            </p>

                            <p>
                                <strong>Donor Location:</strong>{" "}
                                {Number(req.donor_latitude).toFixed(5)},{" "}
                                {Number(req.donor_longitude).toFixed(5)}
                            </p>

                            <span
                                className={`request-status status-${req.status.toLowerCase()}`}
                            >
                                {req.status}
                            </span>

                            <div className="request-actions">
                                <a
                                    className="direction-button"
                                    href={`https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${req.donor_latitude},${req.donor_longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    🗺️ Directions
                                </a>

                                {req.status === "PENDING" && (
                                    <button
                                        className="choice-button"
                                        onClick={() => respond(req.id, "accept")}
                                    >
                                        ✅ Accept
                                    </button>
                                )}

                                {req.status === "ACCEPTED" && (
                                    <button
                                        className="choice-button"
                                        onClick={() => respond(req.id, "complete")}
                                    >
                                        🏁 Mark Completed
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Collector;
