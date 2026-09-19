import { useState } from "react";

function Login({ setActivePage, setCollector }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      /* ONLY COLLECTORS CAN LOGIN */

      if (data.user.role !== "COLLECTOR") {

        alert(
          "Only registered blood collectors can login."
        );

        return;
      }

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "collector",
        JSON.stringify(data.user)
      );

      setCollector(data.user);

      alert("Collector login successful!");

      setActivePage("collector");

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
          🔐
        </div>

        <h1>Collector Login</h1>

        <p className="form-description">
          Login to view nearby blood collection requests.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

          </div>

          <button
            type="submit"
            className="submit-button"
          >
            Login as Collector
          </button>

        </form>

        <p className="auth-link">

          Don't have a collector account?

          <button
            type="button"
            className="link-btn"
            onClick={() => setActivePage("signup")}
          >
            Signup
          </button>

        </p>

      </div>

    </div>
  );
}

export default Login;