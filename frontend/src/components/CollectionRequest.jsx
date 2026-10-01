import { useState } from "react";

function CollectionRequest({
    donor,
    setActivePage,
}) {

    const [address, setAddress] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    // Prefer donor passed from App.jsx.
    // Otherwise use localStorage.
    const currentDonor =
        donor ||
        JSON.parse(
            localStorage.getItem("donor") ||
                "null"
        );

    // =====================================================
    // GET CURRENT ADDRESS
    // =====================================================

    const getLocation = () => {

        if (!navigator.geolocation) {

            alert(
                "Location is not supported by this browser."
            );

            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {

                try {

                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;

                    /*
                     * Convert the current location
                     * into a readable address.
                     *
                     * We do NOT save latitude
                     * or longitude.
                     */

                    const response = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                    );

                    if (!response.ok) {
                        throw new Error(
                            "Unable to get address"
                        );
                    }

                    const data =
                        await response.json();

                    const readableAddress =
                        data.localityInfo
                            ? [
                                  data.locality,
                                  data.city,
                                  data.principalSubdivision,
                                  data.countryName,
                              ]
                                  .filter(Boolean)
                                  .join(", ")
                            : data.locality ||
                              data.city ||
                              data.principalSubdivision ||
                              data.countryName ||
                              "";

                    if (!readableAddress) {

                        alert(
                            "Unable to determine your address. Please enter it manually."
                        );

                        return;
                    }

                    setAddress(
                        readableAddress
                    );

                } catch (error) {

                    console.error(error);

                    alert(
                        "Unable to convert your current location into an address. Please enter your address manually."
                    );
                }
            },

            () => {

                alert(
                    "Please allow location access."
                );
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    // =====================================================
    // SUBMIT REQUEST
    // =====================================================

    const submitRequest = async () => {

        if (
            !currentDonor ||
            !currentDonor.id
        ) {

            alert(
                "Donor information not found. Please register as a donor first."
            );

            return;
        }

        if (!address.trim()) {

            alert(
                "Please enter your address or use 'Use My Current Location'."
            );

            return;
        }

        setSubmitting(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/requests",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        donor_id:
                            currentDonor.id,

                        address:
                            address.trim(),
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                        "Unable to create request."
                );

                return;
            }

            alert(data.message);

            localStorage.removeItem(
                "donor"
            );

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

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="page-container">

            <div className="form-card">

                <div className="form-icon">
                    🚑
                </div>

                <h1>
                    Request Blood Collection
                </h1>

                <p className="form-description">
                    Can't travel to the blood bank?
                    Request a registered collector
                    to visit your location.
                </p>

                <h2>
                    Collection Location
                </h2>

                {/* ADDRESS */}

                <div className="form-group">

                    <label>
                        Address / Landmark
                    </label>

                    <input
                        type="text"
                        placeholder="Enter your address or use current location"
                        value={address}
                        onChange={(e) =>
                            setAddress(
                                e.target.value
                            )
                        }
                    />

                </div>

                {/* CURRENT LOCATION */}

                <button
                    className="secondary-btn"
                    onClick={getLocation}
                    type="button"
                >
                    📍 Use My Current Location
                </button>

                {address && (
                    <div className="location-success">

                        ✅ Current Address

                        <br />

                        📍 {address}

                    </div>
                )}

                {/* SUBMIT */}

                <button
                    className="submit-button"
                    onClick={submitRequest}
                    disabled={submitting}
                    style={{
                        marginTop: "25px",
                    }}
                >
                    {submitting
                        ? "Sending request..."
                        : "🚑 Request Collector"}
                </button>

            </div>

        </div>
    );
}

export default CollectionRequest;