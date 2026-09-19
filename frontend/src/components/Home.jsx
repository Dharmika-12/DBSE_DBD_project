function Home({ setActivePage }) {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Find Blood.
            <br />
            Save Lives.
          </h1>

          <p>
            Connect with nearby blood donors and help someone in need.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={() => setActivePage("find")}
            >
              🔍 Find a Donor
            </button>

            <button
              className="secondary-btn"
              onClick={() => setActivePage("donor")}
            >
              🩸 Become a Donor
            </button>
          </div>
        </div>

        {/* Blood Drop */}
        <div className="hero-image">🩸</div>
      </section>

      {/* Stats */}
      <section className="stats">
        
        <div className="stat-card">
          <h2>8</h2>
          <p>Blood Groups</p>
        </div>

        <div className="stat-card">
          <h2>24/7</h2>
          <p>Emergency Support</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>

        <div className="steps">
          <div className="step">
            <span>1</span>
            <h3>Register</h3>
            <p>
              Create your donor account and complete the health
              pre-screening.
            </p>
          </div>

          <div className="step">
            <span>2</span>
            <h3>Find Nearby</h3>
            <p>Find blood donors and blood banks near your location.</p>
          </div>

          <div className="step">
            <span>3</span>
            <h3>Save Lives</h3>
            <p>Connect with donors and help someone in need.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
