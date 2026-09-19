import { useEffect, useState } from "react";

function Donor({ onRegistered, setActivePage }) {
    const [form, setForm] = useState({
        name: "",
        age: "",
        blood_group: "",
        phone: "",
        city: "",
        blood_bank_id: "",

        infection: "",
        antibiotics: "",
        surgery: "",
        chronic_illness: "",
        feeling_well: "",
    });

    const [bloodBanks, setBloodBanks] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/api/bloodbanks")
            .then((res) => res.json())
            .then((data) => setBloodBanks(data))
            .catch((err) => console.error("Failed to load blood banks", err));
    }, []);

    const [location, setLocation] = useState(null);
    const [result, setResult] = useState(null);
    const [showChoice, setShowChoice] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [failReason, setFailReason] = useState("");

    // =====================================================
    // INPUT CHANGE
    // =====================================================

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    // =====================================================
    // CURRENT LOCATION
    // =====================================================

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Location is not supported by your browser.");
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
                alert("Please allow location access.");
            }
        );
    };

    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (submitting) {
            return;
        }

        for (const key in form) {
            if (!form[key]) {
                alert("Please answer all questions.");
                return;
            }
        }

        if (!location) {
            alert("Please click 'Use My Current Location' before submitting.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/donors",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...form,
                        latitude: location.latitude,
                        longitude: location.longitude,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Unable to register donor.");
                setSubmitting(false);
                return;
            }

            onRegistered(data.donor);

            // -------------------------------------------------
            // HEALTH SCREENING FAILED -> show notification only
            // -------------------------------------------------

            if (data.donor.eligibility_status === "NOT_ELIGIBLE") {
                setResult("failed");
                setShowChoice(false);
                setFailReason(data.reason || "");
                setSubmitting(false);
                return;
            }

            // -------------------------------------------------
            // HEALTH SCREENING PASSED -> show donation choice
            // -------------------------------------------------

            setResult("passed");
            setShowChoice(true);
            setSubmitting(false);
        } catch (error) {
            console.error(error);
            alert(
                `Could not reach the backend (${error.message}). ` +
                    "Make sure the server is running on http://localhost:5000 " +
                    "and that its CORS origin matches this page's URL."
            );
            setSubmitting(false);
        }
    };

    // =====================================================
    // FAILED SCREEN — NOTIFICATION
    // =====================================================

    if (result === "failed") {
        return (
            <div className="form-page">
                <div className="form-container">
                    <div className="notification error">
                        <h2>❌ You cannot donate at this time</h2>

                        <p>
                            Based on the answers in your preliminary health
                            screening, you should not proceed with blood
                            donation at this time.
                        </p>

                        {failReason && (
                            <p>
                                <strong>Reason:</strong> {failReason}
                            </p>
                        )}

                        <p>
                            This is only a preliminary screening. Please
                            consult qualified blood-bank medical staff for
                            final eligibility.
                        </p>

                        <button
                            className="submit-button"
                            onClick={() => setActivePage("home")}
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // =====================================================
    // PASSED SCREEN — CHOICE: BLOOD BANK OR COLLECTOR
    // =====================================================

    if (result === "passed" && showChoice) {
        return (
            <div className="form-page">
                <div className="form-container">
                    <div className="notification success">
                        <h2>✅ Preliminary screening passed</h2>

                        <p>
                            Your answers indicate that you may be able to
                            donate.
                        </p>

                        <p className="small-note">
                            Final eligibility will be confirmed by qualified
                            blood-bank medical staff.
                        </p>
                    </div>

                    <div className="choice-section">
                        <h2>How would you like to donate?</h2>

                        <p>
                            Choose whether you can travel to a blood bank or
                            need a collector to come to your location.
                        </p>

                        <button
                            className="choice-button"
                            onClick={() => setActivePage("bloodbank")}
                        >
                            🏥 I can go to a Blood Bank
                        </button>

                        <button
                            className="choice-button"
                            onClick={() => setActivePage("collection")}
                        >
                            🚗 I need a Blood Collector
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // =====================================================
    // DONOR FORM
    // =====================================================

    return (
        <div className="form-page">
            <div className="form-container">
                <h1>Become a Blood Donor</h1>

                <p className="form-subtitle">
                    Register as a donor and complete the health
                    pre-screening.
                </p>

                <div className="section-title">
                    <h2>Personal Details</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="two-column">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter your full name"
                                value={form.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Age (must be 18–65 to donate)</label>
                            <input
                                type="number"
                                name="age"
                                min="18"
                                max="65"
                                placeholder="Enter your age"
                                value={form.age}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="two-column">
                        <div className="form-group">
                            <label>Blood Group</label>
                            <select
                                name="blood_group"
                                value={form.blood_group}
                                onChange={handleChange}
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

                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Enter phone number"
                                value={form.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>City</label>
                        <input
                            type="text"
                            name="city"
                            placeholder="Enter your city"
                            value={form.city}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Preferred Blood Bank</label>
                        <select
                            name="blood_bank_id"
                            value={form.blood_bank_id}
                            onChange={handleChange}
                        >
                            <option value="">
                                Select the blood bank you'd like to donate at
                            </option>

                            {bloodBanks.map((bank) => (
                                <option key={bank.id} value={bank.id}>
                                    {bank.name} — {bank.address}, {bank.city}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="location-section">
                        <h2>Your Current Location</h2>

                        <button
                            type="button"
                            className="location-button"
                            onClick={getCurrentLocation}
                        >
                            📍 Use My Current Location
                        </button>

                        {location && (
                            <p className="location-success">
                                ✓ Current location captured
                            </p>
                        )}
                    </div>

                    <div className="section-title">
                        <h2>Health Pre-Screening</h2>
                    </div>

                    <div className="health-warning">
                        Please answer honestly. This is only a preliminary
                        screening. Final eligibility will be decided by
                        qualified medical staff.
                    </div>

                    <div className="form-group">
                        <label>Do you currently have an infection?</label>
                        <select
                            name="infection"
                            value={form.infection}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Are you currently taking antibiotics?</label>
                        <select
                            name="antibiotics"
                            value={form.antibiotics}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Have you had major surgery recently?</label>
                        <select
                            name="surgery"
                            value={form.surgery}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Do you have a chronic illness?</label>
                        <select
                            name="chronic_illness"
                            value={form.chronic_illness}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Are you currently feeling well?</label>
                        <select
                            name="feeling_well"
                            value={form.feeling_well}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <button type="submit" className="submit-button" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Donor Registration"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Donor;
