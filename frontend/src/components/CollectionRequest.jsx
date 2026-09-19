import { useState } from "react";

function CollectionRequest({ donor, setActivePage }) {
    const [location, setLocation] = useState(null);
    const [address, setAddress] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Prefer the donor passed in as a prop right after registration;
    // fall back to what App.jsx saved in localStorage under "donor".
    const currentDonor =
        donor || JSON.parse(localStorage.getItem("donor") || "null");

    // =====================================
    // GET CURRENT LOCATION
    // =====================================

    const getLocation = () => {
        if (!navigator.geolocation) {
            alert("Location is not supported by this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });

                alert("Current location captured.");
            },
            () => {
                alert("Please allow location access.");
            }
        );
    };

    // =====================================
    // SUBMIT REQUEST
    // =====================================

    const submitRequest = async () => {
        if (!currentDonor || !currentDonor.id) {
            alert(
                "Donor information not found. Please register as a donor first."
            );
            return;
        }

        if (!location) {
            alert("Please capture your current location first.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/requests",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        donor_id: currentDonor.id,
                        latitude: location.latitude,
                        longitude: location.longitude,
                        address: address,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message);
                return;
            }

            alert(data.message);

            localStorage.removeItem("donor");

            if (setActivePage) {
                setActivePage("home");
            }
        } catch (error) {
            console.error(error);
            alert(
                `Could not reach the backend (${error.message}). Make sure the server is running.`
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <div className="form-card">
                <div className="form-icon">🚑</div>

                <h1>Request Blood Collection</h1>

                <p className="form-description">
                    Can't travel to the blood bank? Request a registered
                    collector to visit your location.
                </p>

                <h2>Collection Location</h2>

                <div className="form-group">
                    <label>
                        Address / Landmark{" "}
                        {location ? "(optional — location already captured)" : "(optional)"}
                    </label>

                    <input
                        type="text"
                        placeholder={
                            location
                                ? "Not required — your GPS location will be used"
                                : "Enter your address or landmark"
                        }
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={!!location}
                    />
                </div>

                <button className="secondary-btn" onClick={getLocation}>
                    📍 Use My Current Location
                </button>

                {location && (
                    <div className="location-success">
                        ✅ Current location captured
                        <br />
                        Latitude: {location.latitude}
                        <br />
                        Longitude: {location.longitude}
                    </div>
                )}

                <button
                    className="submit-button"
                    onClick={submitRequest}
                    disabled={submitting}
                    style={{ marginTop: "25px" }}
                >
                    {submitting ? "Sending request..." : "🚑 Request Collector"}
                </button>
            </div>
        </div>
    );
}

export default CollectionRequest;
