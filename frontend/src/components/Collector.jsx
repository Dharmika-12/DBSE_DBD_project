import { useEffect, useState } from "react";

const API_URL =
    "http://localhost:5000/api";

function Collector() {

    // =====================================================
    // AUTH STATE
    // =====================================================

    const [collector, setCollectorState] =
        useState(
            JSON.parse(
                localStorage.getItem(
                    "collector"
                )
            ) || null
        );

    const [mode, setMode] =
        useState("login");

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
    });

    const [message, setMessage] =
        useState("");

    // =====================================================
    // INPUT CHANGE
    // =====================================================

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]:
                e.target.value,
        });
    };

    // =====================================================
    // LOGIN / SIGNUP
    // =====================================================

    const handleAuthSubmit = async (e) => {

        e.preventDefault();

        setMessage("");

        try {

            const endpoint =
                mode === "login"
                    ? "/auth/login"
                    : "/auth/signup";

            const body =
                mode === "login"
                    ? {
                          email:
                              form.email,
                          password:
                              form.password,
                      }
                    : {
                          name:
                              form.name,
                          email:
                              form.email,
                          phone:
                              form.phone,
                          password:
                              form.password,
                      };

            const response =
                await fetch(
                    `${API_URL}${endpoint}`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify(
                                body
                            ),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                        "Something went wrong"
                );
            }

            if (mode === "login") {

                localStorage.setItem(
                    "token",
                    data.token
                );

                localStorage.setItem(
                    "collector",
                    JSON.stringify(
                        data.user
                    )
                );

                setCollectorState(
                    data.user
                );

            } else {

                setMessage(
                    "Collector account created. You can log in now."
                );

                setMode("login");

                setForm({
                    name: "",
                    email: "",
                    phone: "",
                    password: "",
                });
            }

        } catch (error) {

            console.error(error);

            setMessage(
                error.message
            );
        }
    };

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "collector"
        );

        setCollectorState(null);
    };

    // =====================================================
    // LOGGED OUT VIEW
    // =====================================================

    if (!collector) {

        return (
            <div className="collector-page">

                <div className="collector-card">

                    <div className="collector-icon">
                        🩸
                    </div>

                    <h1>
                        {mode === "login"
                            ? "Collector Login"
                            : "Collector Signup"}
                    </h1>

                    <p className="collector-subtitle">

                        {mode === "login"
                            ? "Login to see blood collection requests."
                            : "Create an account to become a blood collector."}

                    </p>

                    <form
                        onSubmit={
                            handleAuthSubmit
                        }
                    >

                        {mode === "signup" && (
                            <>
                                <div className="form-group">

                                    <label>
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter your full name"
                                        value={
                                            form.name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Phone
                                    </label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Enter your phone number"
                                        value={
                                            form.phone
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>
                            </>
                        )}

                        <div className="form-group">

                            <label>
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={
                                    form.email
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Password
                            </label>

                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={
                                    form.password
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                        </div>

                        <button
                            type="submit"
                            className="collector-submit"
                        >
                            {mode === "login"
                                ? "Login"
                                : "Create Collector Account"}
                        </button>

                    </form>

                    {message && (
                        <p className="collector-message">
                            {message}
                        </p>
                    )}

                    <p className="collector-switch">

                        {mode === "login"
                            ? "Don't have a collector account?"
                            : "Already have a collector account?"}

                        <br />

                        <button
                            type="button"
                            onClick={() => {

                                setMode(
                                    mode ===
                                        "login"
                                        ? "signup"
                                        : "login"
                                );

                                setMessage("");
                            }}
                        >
                            {mode === "login"
                                ? "Signup as Collector"
                                : "Login"}
                        </button>

                    </p>

                </div>

            </div>
        );
    }

    // =====================================================
    // LOGGED-IN DASHBOARD
    // =====================================================

    return (
        <CollectorDashboard
            collector={collector}
            onLogout={handleLogout}
        />
    );
}

// =====================================================
// COLLECTOR DASHBOARD
// =====================================================

function CollectorDashboard({
    collector,
    onLogout,
}) {

    const [requests, setRequests] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    // =====================================================
    // LOAD COLLECTION REQUESTS
    // NO LOCATION REQUIRED
    // =====================================================

    const loadRequests = async () => {

        setLoading(true);

        setError("");

        try {

            const token =
                localStorage.getItem(
                    "token"
                );

            const response =
                await fetch(
                    `${API_URL}/requests/nearby`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                if (
                    response.status ===
                    401
                ) {
                    onLogout();
                    return;
                }

                throw new Error(
                    data.message ||
                        "Unable to load requests"
                );
            }

            setRequests(data);

        } catch (err) {

            console.error(err);

            setError(
                err.message
            );

        } finally {

            setLoading(false);
        }
    };

    // =====================================================
    // LOAD REQUESTS WHEN DASHBOARD OPENS
    // =====================================================

    useEffect(() => {

        loadRequests();

    }, []);

    // =====================================================
    // ACCEPT / COMPLETE
    // =====================================================

    const respond = async (
        requestId,
        action
    ) => {

        try {

            const token =
                localStorage.getItem(
                    "token"
                );

            const response =
                await fetch(
                    `${API_URL}/requests/${requestId}/${action}`,
                    {
                        method: "PATCH",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                        "Action failed"
                );

                return;
            }

            alert(data.message);

            loadRequests();

        } catch (err) {

            console.error(err);

            alert(
                "Could not reach the backend."
            );
        }
    };

    // =====================================================
    // DASHBOARD
    // =====================================================

    return (
        <div className="collector-page collector-dashboard">

            <div className="collector-card dashboard-card">

                <div className="dashboard-header">

                    <div>

                        <h1>
                            Welcome,{" "}
                            {collector.name}
                        </h1>

                        <p className="collector-subtitle">
                            Blood collection requests.
                        </p>

                    </div>

                    <button
                        className="location-button"
                        onClick={
                            onLogout
                        }
                    >
                        Logout
                    </button>

                </div>

                {/* NO COLLECTOR LOCATION */}

                {error && (
                    <p className="location-error">
                        {error}
                    </p>
                )}

                {loading && (
                    <p className="loading">
                        Loading collection requests...
                    </p>
                )}

                {!loading &&
                    requests.length ===
                        0 &&
                    !error && (
                        <p className="empty-message">
                            No pending collection
                            requests right now.
                        </p>
                    )}

                {/* REQUEST LIST */}

                <div className="request-list">

                    {requests.map(
                        (req) => (

                            <div
                                className="request-card"
                                key={req.id}
                            >

                                <h3>
                                    {
                                        req.donor_name
                                    }
                                </h3>

                                <p>
                                    <strong>
                                        Blood Group:
                                    </strong>{" "}
                                    {
                                        req.blood_group
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Phone:
                                    </strong>{" "}
                                    {
                                        req.donor_phone
                                    }
                                </p>

                                <p>
                                    <strong>
                                        City:
                                    </strong>{" "}
                                    {req.city}
                                </p>

                                {/* ADDRESS */}

                                {req.address && (
                                    <p>
                                        <strong>
                                            📍 Address:
                                        </strong>{" "}
                                        {
                                            req.address
                                        }
                                    </p>
                                )}

                                {/* BLOOD BANK */}

                                {req.blood_bank_name && (
                                    <p>
                                        <strong>
                                            Preferred Blood Bank:
                                        </strong>{" "}
                                        {
                                            req.blood_bank_name
                                        }

                                        {req.blood_bank_address &&
                                            ` (${req.blood_bank_address})`}
                                    </p>
                                )}

                                {/* STATUS */}

                                <span
                                    className={`request-status status-${req.status.toLowerCase()}`}
                                >
                                    {
                                        req.status
                                    }
                                </span>

                                {/* ACTIONS */}

                                <div className="request-actions">

                                    {/* DIRECTIONS BY ADDRESS */}

                                    {req.address && (
                                        <a
                                            className="direction-button"
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                                req.address
                                            )}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            🗺️ Directions
                                        </a>
                                    )}

                                    {/* ACCEPT */}

                                    {req.status ===
                                        "PENDING" && (
                                        <button
                                            className="choice-button"
                                            onClick={() =>
                                                respond(
                                                    req.id,
                                                    "accept"
                                                )
                                            }
                                        >
                                            ✅ Accept
                                        </button>
                                    )}

                                    {/* COMPLETE */}

                                    {req.status ===
                                        "ACCEPTED" && (
                                        <button
                                            className="choice-button"
                                            onClick={() =>
                                                respond(
                                                    req.id,
                                                    "complete"
                                                )
                                            }
                                        >
                                            🏁 Mark Completed
                                        </button>
                                    )}

                                </div>

                            </div>
                        )
                    )}

                </div>

            </div>

        </div>
    );
}

export default Collector;