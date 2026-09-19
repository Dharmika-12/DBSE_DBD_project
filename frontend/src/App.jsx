import { useState } from "react";

import Home from "./components/Home";
import FindDonor from "./components/FindDonor";
import Donor from "./components/Donor";
import BloodBank from "./components/BloodBank";
import CollectionRequest from "./components/CollectionRequest";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Collector from "./components/Collector";

import "./App.css";


function App() {

    // Current page
    const [activePage, setActivePage] = useState("home");

    // Donor information after registration
    const [donor, setDonor] = useState(
        JSON.parse(localStorage.getItem("donor")) || null
    );

    // Collector login information
    const [collector, setCollector] = useState(
        JSON.parse(localStorage.getItem("collector")) || null
    );


    // =====================================================
    // DONOR REGISTRATION
    // =====================================================

    const handleDonorRegistered = (donorData) => {

        setDonor(donorData);

        localStorage.setItem(
            "donor",
            JSON.stringify(donorData)
        );

    };


    // =====================================================
    // COLLECTOR LOGIN
    // =====================================================

    const handleCollectorLogin = (collectorData) => {

        setCollector(collectorData);

        localStorage.setItem(
            "collector",
            JSON.stringify(collectorData)
        );

        setActivePage("collector");

    };


    // =====================================================
    // COLLECTOR LOGOUT
    // =====================================================

    const handleCollectorLogout = () => {

        setCollector(null);

        localStorage.removeItem("collector");
        localStorage.removeItem("token");

        setActivePage("home");

    };


    // =====================================================
    // NAVIGATION
    // =====================================================

    const goTo = (page) => {

        setActivePage(page);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };


    return (

        <div className="app">


            {/* =================================================
                NAVIGATION BAR
            ================================================= */}

            <header className="navbar">

                <div
                    className="logo"
                    onClick={() => goTo("home")}
                >
                    💧 BloodConnect
                </div>


                <nav>

                    <button
                        onClick={() => goTo("home")}
                    >
                        Home
                    </button>


                    <button
                        onClick={() => goTo("find")}
                    >
                        Find Donor
                    </button>


                    <button
                        onClick={() => goTo("donor")}
                    >
                        Become a Donor
                    </button>


                    <button
                        onClick={() => goTo("bloodbank")}
                    >
                        Blood Banks
                    </button>


                    {/* Collector login */}

                    {!collector && (

                        <button
                            onClick={() => goTo("login")}
                        >
                            Collector Login
                        </button>

                    )}


                    {/* Collector dashboard */}

                    {collector && (

                        <>

                            <button
                                onClick={() =>
                                    goTo("collector")
                                }
                            >
                                Collector Dashboard
                            </button>


                            <button
                                onClick={handleCollectorLogout}
                            >
                                Logout
                            </button>

                        </>

                    )}

                </nav>

            </header>



            {/* =================================================
                PAGE CONTENT
            ================================================= */}

            <main>


                {/* HOME */}

                {activePage === "home" && (

                    <Home
                        setActivePage={setActivePage}
                    />

                )}



                {/* FIND DONOR */}

                {activePage === "find" && (

                    <FindDonor />

                )}



                {/* =================================================
                    BECOME A DONOR

                    NO DONOR LOGIN REQUIRED
                ================================================= */}

                {activePage === "donor" && (

                    <Donor
                        onRegistered={handleDonorRegistered}
                        setActivePage={setActivePage}
                    />

                )}



                {/* =================================================
                    BLOOD BANKS
                ================================================= */}

                {activePage === "bloodbank" && (

                    <BloodBank />

                )}



                {/* =================================================
                    COLLECTION REQUEST

                    Donor can access this after registration.
                    No donor login required.
                ================================================= */}

                {activePage === "collection" && (

                    <CollectionRequest
                        donor={donor}
                        setActivePage={setActivePage}
                    />

                )}



                {/* =================================================
                    COLLECTOR LOGIN

                    Only collectors use login.
                ================================================= */}

                {activePage === "login" && (

                    <Login
                        setActivePage={setActivePage}
                        setCollector={handleCollectorLogin}
                    />

                )}



                {/* =================================================
                    COLLECTOR SIGNUP
                ================================================= */}

                {activePage === "signup" && (

                    <Signup
                        setActivePage={setActivePage}
                    />

                )}



                {/* =================================================
                    COLLECTOR DASHBOARD
                ================================================= */}

                {activePage === "collector" && (

                    collector ? (

                        <Collector
                            collector={collector}
                            onLogout={handleCollectorLogout}
                        />

                    ) : (

                        <div className="message-box">

                            <h2>Collector Login Required</h2>

                            <p>
                                Please login as a blood collector
                                to access this page.
                            </p>

                            <button
                                onClick={() => goTo("login")}
                            >
                                Collector Login
                            </button>

                        </div>

                    )

                )}

            </main>


            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="footer">

                <h3>💧 BloodConnect</h3>

                <p>
                    Every Drop Counts. Every Donor Matters.
                </p>

                <p>
                    © 2026 BloodConnect
                </p>

            </footer>

        </div>

    );

}


export default App;