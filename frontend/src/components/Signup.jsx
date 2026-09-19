import { useState } from "react";

function Signup({ setActivePage }) {

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const response = await fetch(
        "http://localhost:5000/api/auth/signup",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            ...form,
            role: "COLLECTOR"
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Signup failed");
        return;
      }

      alert(
        "Collector account created successfully! Please login."
      );

      setActivePage("login");

    } catch (error) {

      console.error(error);

      alert(
        "Cannot connect to backend. Make sure backend is running."
      );
    }
  };

  return (

    <div className="page-container">

      <div className="form-card auth-card">

        <div className="form-icon">
          🚑
        </div>

        <h1>Blood Collector Signup</h1>

        <p className="form-description">
          Create an account to collect blood from donors
          who cannot travel to a blood bank.
        </p>

        <form onSubmit={handleSubmit}>

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

            <label>Phone Number</label>

            <input
              type="tel"
              name="phone"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={handleChange}
              required
            />

          </div>

          <div className="form-group">

            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
            />

          </div>

          <button
            type="submit"
            className="submit-button"
          >
            Create Collector Account
          </button>

        </form>

        <p className="auth-link">

          Already have an account?

          <button
            type="button"
            className="link-btn"
            onClick={() => setActivePage("login")}
          >
            Login
          </button>

        </p>

      </div>

    </div>
  );
}

export default Signup;