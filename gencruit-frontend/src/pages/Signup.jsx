// src/pages/Signup.jsx
import React, { useState } from "react";
import axios from "axios";

const Signup = () => {
  // Store form inputs in state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate", // default role
  });

  // Store backend response or error
  const [message, setMessage] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData, // keep existing data
      [e.target.name]: e.target.value, // update changed field
    });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault(); // stop page reload
    setMessage(""); // reset message

    try {
      // Send POST request to backend register API
      const res = await axios.post("http://localhost:5000/api/auth/register", formData);

      // Show success message from backend
      setMessage(res.data.msg || "User registered successfully!");
    } catch (err) {
      // Show error message from backend
      setMessage(err.response?.data?.msg || "Something went wrong");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      <h2>Sign Up</h2>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* Password */}
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* Role Dropdown */}
        <div>
          <label>Role:</label>
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>
        </div>

        {/* Submit Button */}
        <button type="submit">Register</button>
      </form>

      {/* Success/Error Message */}
      {message && <p>{message}</p>}
    </div>
  );
};

export default Signup;
