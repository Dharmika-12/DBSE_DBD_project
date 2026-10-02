import { useState } from "react";

function FindDonor() {
    const [bloodGroup, setBloodGroup] = useState("");
    const [locationText, setLocationText] = useState("");
    const [donors, setDonors] = useState([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);

    // =====================================================
    // GET CURRENT LOCATION
    // =====================================================

    const getCurrentLocation = () => {

    if (!navigator.geolocation) {
        alert(
            "Location is not supported by your browser."
        );
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {

            try {

                const response = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
                );

                const data =
                    await response.json();

                const address =
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

                setLocationText(
                    address ||
                        "Current address captured"
                );

            } catch (error) {

                console.error(error);

                alert(
                    "Unable to get current address."
                );
            }
        },

        () => {
            alert(
                "Please allow location access."
            );
        }
    );
};

    // =====================================================
    // SEARCH DONORS
    //
    // IMPORTANT: no distance/radius filtering is applied here.
    // Every donor matching the selected blood group is returned
    // by the backend, along with their distance from the current
    // location (nearest first). Donors farther away are still
    // shown — only their distance value will be larger.
    // =====================================================

    const searchDonors = async () => {
        if (!bloodGroup) {
            alert("Please select a blood group.");
            return;
        }

        if (!location) {
            alert("Please click 'Use My Current Location' first.");
            return;
        }

        setLoading(true);
        setSearched(false);

        try {
            const url =
    `http://localhost:5000/api/donors` +
    `?bloodGroup=${encodeURIComponent(
        bloodGroup
    )}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to search donors");
            }

            setDonors(data);
            setSearched(true);
        } catch (error) {
            console.error(error);
            alert(error.message || "Server error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-page">
            <div className="form-container">
                <h1>Find a Blood Donor</h1>

    

                {/* BLOOD GROUP */}
                <div className="form-group">
                    <label>Blood Group</label>

                    <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                    >
                        <option value="">Select blood group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                    </select>
                </div>


                {/* SEARCH BUTTON */}
                <button
                    className="submit-button"
                    onClick={searchDonors}
                    disabled={loading}
                >
                    {loading ? "Searching..." : "Find Donors"}
                </button>
            </div>

            {/* =====================================================
                RESULTS
            ===================================================== */}

            {searched && (
                <div className="results-container">
                    <h2>Available Donors</h2>

                    {donors.length === 0 ? (
                        <div className="no-results">
                            No available donors found for {bloodGroup}.
                        </div>
                    ) : (
                        <>
                            <p className="result-info">
                                {donors.length} donor(s) found, All matching donors
                                are shown.
                            </p>

                            <div className="donor-results">
                                {donors.map((donor) => (
                                    <div className="donor-card" key={donor.id}>
                                        <h3>{donor.name}</h3>

                                        <p>
                                            <strong>Blood Group:</strong>{" "}
                                            {donor.blood_group}
                                        </p>

                                        <p>
                                            <strong>Age:</strong> {donor.age}
                                        </p>

                                        <p>
                                            <strong>City:</strong> {donor.city}
                                        </p>

                                        <p>
                                            <strong>Phone:</strong>{" "}
                                            {donor.phone}
                                        </p>

                                        {donor.blood_bank_name && (
                                            <p>
                                                <strong>
                                                    Preferred Blood Bank:
                                                </strong>{" "}
                                                {donor.blood_bank_name} (
                                                {donor.blood_bank_address},{" "}
                                                {donor.blood_bank_city})
                                            </p>
                                        )}

                                       
                                        

                                        {donor.latitude &&
                                            donor.longitude &&
                                            location && (
                                                <a
                                                    className="direction-button"
                                                    href={
                                                        `https://www.google.com/maps/dir/?api=1` +
                                                        `&origin=${location.latitude},${location.longitude}` +
                                                        `&destination=${donor.latitude},${donor.longitude}`
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    🗺️ Get Directions
                                                </a>
                                            )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default FindDonor;
