import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function BloodBank() {
    const [bloodBanks, setBloodBanks] = useState([]);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`${API_URL}/bloodbanks`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch blood banks");
                }
                return response.json();
            })
            .then((data) => {
                setBloodBanks(data);
            })
            .catch((err) => {
                console.error(err);
                setError("Unable to load blood banks.");
            });
    }, []);

    const getCurrentLocation = () => {
        setLoading(true);
        setError("");

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLoading(false);
            },
            (error) => {
                console.error(error);
                setError(
                    "Unable to get your location. Please allow location access."
                );
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    return (
        <div className="blood-bank-page">
            <div className="page-header">
                <h1>Nearby Blood Banks</h1>
                <p>Find blood banks and hospitals near your current location.</p>
            </div>

            {/* Location Section */}
            <div className="location-box">
                <h2>Your Location</h2>

                <button className="location-button" onClick={getCurrentLocation}>
                    📍 Use My Current Location
                </button>

                {loading && (
                    <p className="location-message">
                        Getting your current location...
                    </p>
                )}

                {location && (
                    <p className="location-success">✓ Current location captured</p>
                )}

                {error && <p className="location-error">{error}</p>}
            </div>

            {/* Blood Banks */}
            <div className="blood-bank-list">
                <h2>Blood Banks &amp; Hospitals</h2>

                {bloodBanks.length === 0 && !error && (
                    <p>Loading blood banks...</p>
                )}

                <div className="blood-bank-grid">
                    {bloodBanks.map((bank) => {
                        let distance = null;

                        if (location && bank.latitude && bank.longitude) {
                            distance = calculateDistance(
                                location.latitude,
                                location.longitude,
                                Number(bank.latitude),
                                Number(bank.longitude)
                            );
                        }

                        const mapUrl = location
                            ? `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${bank.latitude},${bank.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  `${bank.name}, ${bank.address}, ${bank.city}`
                              )}`;

                        return (
                            <div className="blood-bank-card" key={bank.id}>
                                <div className="bank-icon">🏥</div>

                                <h3>{bank.name}</h3>

                                <p>
                                    📍 {bank.address}
                                    {bank.city ? `, ${bank.city}` : ""}
                                </p>

                                <p>📞 {bank.phone}</p>

                                <span className="blood-bank-tag">
                                    🩸 {bank.blood_groups_available || "All Blood Groups"}
                                </span>

                                {distance !== null && (
                                    <p className="distance">
                                        📏 Distance: {distance.toFixed(2)} km
                                    </p>
                                )}

                                <a
                                    href={mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="direction-button"
                                >
                                    🗺️ Get Directions
                                </a>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default BloodBank;
