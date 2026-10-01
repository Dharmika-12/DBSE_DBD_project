import { useEffect, useState } from "react";

function Donor({ onRegistered, setActivePage }) {
    // =====================================================
    // FORM DATA
    // =====================================================

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

    // =====================================================
    // ADDRESS
    // We store only the readable address.
    // Latitude and longitude are NOT stored.
    // =====================================================

    const [address, setAddress] = useState("");

    // =====================================================
    // BLOOD BANKS
    // =====================================================

    const [bloodBanks, setBloodBanks] = useState([]);

    // =====================================================
    // RESULT / UI STATE
    // =====================================================

    const [result, setResult] = useState(null);
    const [showChoice, setShowChoice] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [gettingAddress, setGettingAddress] = useState(false);
    const [failReason, setFailReason] = useState("");

    // =====================================================
    // LOAD BLOOD BANKS
    // =====================================================

    useEffect(() => {
        fetch("http://localhost:5000/api/bloodbanks")
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to load blood banks");
                }

                return res.json();
            })
            .then((data) => {
                setBloodBanks(data);
            })
            .catch((err) => {
                console.error(
                    "Failed to load blood banks:",
                    err
                );
            });
    }, []);

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
    // GET CURRENT ADDRESS
    //
    // Browser gets location internally.
    // We convert it into a readable address.
    //
    // Latitude and longitude are NOT stored
    // in the database.
    // =====================================================

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert(
                "Location is not supported by your browser."
            );
            return;
        }

        setGettingAddress(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;

                    // Reverse geocoding:
                    // GPS coordinates -> readable address
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

                    const readableAddress = [
                        data.locality,
                        data.city,
                        data.principalSubdivision,
                        data.countryName,
                    ]
                        .filter(Boolean)
                        .join(", ");

                    if (!readableAddress) {
                        alert(
                            "Unable to find your address. Please enter it manually."
                        );

                        return;
                    }

                    setAddress(
                        readableAddress
                    );

                } catch (error) {
                    console.error(
                        "ADDRESS ERROR:",
                        error
                    );

                    alert(
                        "Unable to get your current address. Please enter your address manually."
                    );
                } finally {
                    setGettingAddress(false);
                }
            },

            (error) => {
                console.error(
                    "LOCATION ERROR:",
                    error
                );

                setGettingAddress(false);

                alert(
                    "Please allow location access and try again."
                );
            },

            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            }
        );
    };

    // =====================================================
    // SUBMIT DONOR
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (submitting) {
            return;
        }

        // -------------------------------------------------
        // CHECK PERSONAL DETAILS
        // -------------------------------------------------

        if (!form.name.trim()) {
            alert("Please enter your name.");
            return;
        }

        if (!form.age) {
            alert("Please enter your age.");
            return;
        }

        if (!form.blood_group) {
            alert("Please select your blood group.");
            return;
        }

        if (!form.phone.trim()) {
            alert("Please enter your phone number.");
            return;
        }

        if (!form.city.trim()) {
            alert("Please enter your city.");
            return;
        }

        // -------------------------------------------------
        // CHECK ADDRESS
        // -------------------------------------------------

        if (!address.trim()) {
            alert(
                "Please enter your address or click 'Use My Current Location'."
            );
            return;
        }

        // -------------------------------------------------
        // CHECK BLOOD BANK
        // -------------------------------------------------

        if (!form.blood_bank_id) {
            alert(
                "Please select a preferred blood bank."
            );
            return;
        }

        // -------------------------------------------------
        // CHECK HEALTH QUESTIONS
        // -------------------------------------------------

        if (!form.infection) {
            alert(
                "Please answer the infection question."
            );
            return;
        }

        if (!form.antibiotics) {
            alert(
                "Please answer the antibiotics question."
            );
            return;
        }

        if (!form.surgery) {
            alert(
                "Please answer the surgery question."
            );
            return;
        }

        if (!form.chronic_illness) {
            alert(
                "Please answer the chronic illness question."
            );
            return;
        }

        if (!form.feeling_well) {
            alert(
                "Please answer the feeling-well question."
            );
            return;
        }

        // -------------------------------------------------
        // DATA SENT TO BACKEND
        // NO LATITUDE
        // NO LONGITUDE
        // -------------------------------------------------

        const donorData = {
            name: form.name.trim(),

            age: form.age,

            blood_group:
                form.blood_group,

            phone: form.phone.trim(),

            city: form.city.trim(),

            address: address.trim(),

            blood_bank_id:
                form.blood_bank_id,

            infection:
                form.infection,

            antibiotics:
                form.antibiotics,

            surgery:
                form.surgery,

            chronic_illness:
                form.chronic_illness,

            feeling_well:
                form.feeling_well,
        };

        // Useful for checking browser console
        console.log(
            "DONOR DATA BEING SENT:",
            donorData
        );

        setSubmitting(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/donors",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(
                        donorData
                    ),
                }
            );

            const data =
                await response.json();

            console.log(
                "BACKEND RESPONSE:",
                data
            );

            // -------------------------------------------------
            // BACKEND ERROR
            // -------------------------------------------------

            if (!response.ok) {
                alert(
                    data.message ||
                        "Unable to register donor."
                );

                setSubmitting(false);
                return;
            }

            // -------------------------------------------------
            // SAVE DONOR IN APP
            // -------------------------------------------------

            if (onRegistered) {
                onRegistered(data.donor);
            }

            // -------------------------------------------------
            // HEALTH SCREENING FAILED
            // -------------------------------------------------

            if (
                data.donor
                    .eligibility_status ===
                "NOT_ELIGIBLE"
            ) {
                setResult("failed");

                setShowChoice(false);

                setFailReason(
                    data.reason || ""
                );

                setSubmitting(false);

                return;
            }

            // -------------------------------------------------
            // HEALTH SCREENING PASSED
            // -------------------------------------------------

            setResult("passed");

            setShowChoice(true);

            setSubmitting(false);

        } catch (error) {
            console.error(
                "REGISTER ERROR:",
                error
            );

            alert(
                `Could not reach the backend (${error.message}). Make sure the backend is running on http://localhost:5000`
            );

            setSubmitting(false);
        }
    };

    // =====================================================
    // FAILED SCREEN
    // =====================================================

    if (result === "failed") {
        return (
            <div className="form-page">

                <div className="form-container">

                    <div className="notification error">

                        <h2>
                            ❌ You cannot donate at this time
                        </h2>

                        <p>
                            Based on the answers
                            in your preliminary
                            health screening,
                            you should not proceed
                            with blood donation
                            at this time.
                        </p>

                        {failReason && (
                            <p>
                                <strong>
                                    Reason:
                                </strong>{" "}
                                {failReason}
                            </p>
                        )}

                        <p>
                            This is only a
                            preliminary screening.
                            Please consult qualified
                            blood-bank medical staff
                            for final eligibility.
                        </p>

                        <button
                            className="submit-button"
                            onClick={() =>
                                setActivePage(
                                    "home"
                                )
                            }
                        >
                            Back to Home
                        </button>

                    </div>

                </div>

            </div>
        );
    }

    // =====================================================
    // PASSED SCREEN
    // =====================================================

    if (
        result === "passed" &&
        showChoice
    ) {
        return (
            <div className="form-page">

                <div className="form-container">

                    <div className="notification success">

                        <h2>
                            ✅ Preliminary screening passed
                        </h2>

                        <p>
                            Your answers indicate
                            that you may be able
                            to donate.
                        </p>

                        <p className="small-note">
                            Final eligibility will
                            be confirmed by qualified
                            blood-bank medical staff.
                        </p>

                    </div>

                    <div className="choice-section">

                        <h2>
                            How would you like
                            to donate?
                        </h2>

                        <p>
                            Choose whether you can
                            travel to a blood bank
                            or need a collector to
                            come to your location.
                        </p>

                        <button
                            className="choice-button"
                            onClick={() =>
                                setActivePage(
                                    "bloodbank"
                                )
                            }
                        >
                            🏥 I can go to a Blood Bank
                        </button>

                        <button
                            className="choice-button"
                            onClick={() =>
                                setActivePage(
                                    "collection"
                                )
                            }
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

                <h1>
                    Become a Blood Donor
                </h1>

                <p className="form-subtitle">
                    Register as a donor and
                    complete the health
                    pre-screening.
                </p>

                {/* =================================================
                    PERSONAL DETAILS
                ================================================= */}

                <div className="section-title">

                    <h2>
                        Personal Details
                    </h2>

                </div>

                <form onSubmit={handleSubmit}>

                    {/* NAME + AGE */}

                    <div className="two-column">

                        <div className="form-group">

                            <label>
                                Full Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                placeholder="Enter your full name"
                                value={form.name}
                                onChange={
                                    handleChange
                                }
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Age (must be 18–65 to donate)
                            </label>

                            <input
                                type="number"
                                name="age"
                                min="18"
                                max="65"
                                placeholder="Enter your age"
                                value={form.age}
                                onChange={
                                    handleChange
                                }
                            />

                        </div>

                    </div>

                    {/* BLOOD GROUP + PHONE */}

                    <div className="two-column">

                        <div className="form-group">

                            <label>
                                Blood Group
                            </label>

                            <select
                                name="blood_group"
                                value={
                                    form.blood_group
                                }
                                onChange={
                                    handleChange
                                }
                            >

                                <option value="">
                                    Select blood group
                                </option>

                                <option value="A+">
                                    A+
                                </option>

                                <option value="A-">
                                    A-
                                </option>

                                <option value="B+">
                                    B+
                                </option>

                                <option value="B-">
                                    B-
                                </option>

                                <option value="AB+">
                                    AB+
                                </option>

                                <option value="AB-">
                                    AB-
                                </option>

                                <option value="O+">
                                    O+
                                </option>

                                <option value="O-">
                                    O-
                                </option>

                            </select>

                        </div>

                        <div className="form-group">

                            <label>
                                Phone Number
                            </label>

                            <input
                                type="tel"
                                name="phone"
                                placeholder="Enter phone number"
                                value={form.phone}
                                onChange={
                                    handleChange
                                }
                            />

                        </div>

                    </div>

                    {/* CITY */}

                    <div className="form-group">

                        <label>
                            City
                        </label>

                        <input
                            type="text"
                            name="city"
                            placeholder="Enter your city"
                            value={form.city}
                            onChange={
                                handleChange
                            }
                        />

                    </div>

                    {/* ADDRESS */}

                    <div className="form-group">

                        <label>
                            Address
                        </label>

                        <input
                            type="text"
                            placeholder="Enter your address"
                            value={address}
                            onChange={(e) =>
                                setAddress(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    {/* CURRENT LOCATION BUTTON */}

                    <div className="location-section">

                        <button
                            type="button"
                            className="location-button"
                            onClick={
                                getCurrentLocation
                            }
                            disabled={
                                gettingAddress
                            }
                        >
                            {gettingAddress
                                ? "Getting address..."
                                : "📍 Use My Current Location"}
                        </button>

                        {address && (
                            <p className="location-success">
                                ✓ Current address:
                                <br />
                                📍 {address}
                            </p>
                        )}

                    </div>

                    {/* BLOOD BANK */}

                    <div className="form-group">

                        <label>
                            Preferred Blood Bank
                        </label>

                        <select
                            name="blood_bank_id"
                            value={
                                form.blood_bank_id
                            }
                            onChange={
                                handleChange
                            }
                        >

                            <option value="">
                                Select the blood bank
                                you'd like to donate at
                            </option>

                            {bloodBanks.map(
                                (bank) => (
                                    <option
                                        key={
                                            bank.id
                                        }
                                        value={
                                            bank.id
                                        }
                                    >
                                        {bank.name} —
                                        {" "}
                                        {bank.address},
                                        {" "}
                                        {bank.city}
                                    </option>
                                )
                            )}

                        </select>

                    </div>

                    {/* =================================================
                        HEALTH SCREENING
                    ================================================= */}

                    <div className="section-title">

                        <h2>
                            Health Pre-Screening
                        </h2>

                    </div>

                    <div className="health-warning">

                        Please answer honestly.
                        This is only a preliminary
                        screening. Final eligibility
                        will be decided by qualified
                        medical staff.

                    </div>

                    {/* INFECTION */}

                    <div className="form-group">

                        <label>
                            Do you currently have
                            an infection?
                        </label>

                        <select
                            name="infection"
                            value={
                                form.infection
                            }
                            onChange={
                                handleChange
                            }
                        >

                            <option value="">
                                Select
                            </option>

                            <option value="Yes">
                                Yes
                            </option>

                            <option value="No">
                                No
                            </option>

                        </select>

                    </div>

                    {/* ANTIBIOTICS */}

                    <div className="form-group">

                        <label>
                            Are you currently
                            taking antibiotics?
                        </label>

                        <select
                            name="antibiotics"
                            value={
                                form.antibiotics
                            }
                            onChange={
                                handleChange
                            }
                        >

                            <option value="">
                                Select
                            </option>

                            <option value="Yes">
                                Yes
                            </option>

                            <option value="No">
                                No
                            </option>

                        </select>

                    </div>

                    {/* SURGERY */}

                    <div className="form-group">

                        <label>
                            Have you had major
                            surgery recently?
                        </label>

                        <select
                            name="surgery"
                            value={
                                form.surgery
                            }
                            onChange={
                                handleChange
                            }
                        >

                            <option value="">
                                Select
                            </option>

                            <option value="Yes">
                                Yes
                            </option>

                            <option value="No">
                                No
                            </option>

                        </select>

                    </div>

                    {/* CHRONIC ILLNESS */}

                    <div className="form-group">

                        <label>
                            Do you have a
                            chronic illness?
                        </label>

                        <select
                            name="chronic_illness"
                            value={
                                form.chronic_illness
                            }
                            onChange={
                                handleChange
                            }
                        >

                            <option value="">
                                Select
                            </option>

                            <option value="Yes">
                                Yes
                            </option>

                            <option value="No">
                                No
                            </option>

                        </select>

                    </div>

                    {/* FEELING WELL */}

                    <div className="form-group">

                        <label>
                            Are you currently
                            feeling well?
                        </label>

                        <select
                            name="feeling_well"
                            value={
                                form.feeling_well
                            }
                            onChange={
                                handleChange
                            }
                        >

                            <option value="">
                                Select
                            </option>

                            <option value="Yes">
                                Yes
                            </option>

                            <option value="No">
                                No
                            </option>

                        </select>

                    </div>

                    {/* SUBMIT */}

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={submitting}
                    >
                        {submitting
                            ? "Submitting..."
                            : "Submit Donor Registration"}
                    </button>

                </form>

            </div>

        </div>
    );
}

export default Donor;