import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config";

export default function Login() {
  const navigate = useNavigate();

  const [userValues, setUserValues] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState("");
  const [success, setSuccess] = useState("");

  // 🔹 تحديث القيم عند الكتابة
  const handleChange = (e) => {
    setUserValues({
      ...userValues,
      [e.target.name]: e.target.value,
    });
  };

  // 🔹 التحقق من الإدخال
  const validate = () => {
    let newErrors = {};

    if (!userValues.email) {
      newErrors.email = "Email is required";
    } else if (
      !/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]/.test(userValues.email)
    ) {
      newErrors.email = "Invalid email format";
    }

    if (!userValues.password) {
      newErrors.password = "Password is required";
    } else if (userValues.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  };

  // 🔹 عند الضغط على زر تسجيل الدخول
  /// Noor Update
 const handleUserLogin = async (e) => {
  e.preventDefault();

  const validationErrors = validate();
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  console.log("Login data:", userValues); // للتأكد من البيانات

  try {
    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      userValues,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true, // ✅ مهم جداً للكوكيز والجلسة
      }
    );

    if (response.status === 200 && response.data.success) {
      setSuccess("Login successful, Redirecting...");
      setErrors("");

      setTimeout(() => navigate("/home"), 1500);
    }
  } catch (err) {
    console.error("Login error:", err);

    if (err.response) {
      setErrors(err.response.data.message || "Login failed");
    } else {
      setErrors("Network error");
    }
  }
};


  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "22rem" }}>
        <h3 className="text-center mb-4 text-success">Welcome Back!</h3>
        <form onSubmit={handleUserLogin}>
          {success && (
            <div className="alert alert-success py-2 text-center">{success}</div>
          )}
          {errors && typeof errors === "string" && (
            <div className="alert alert-danger py-2 text-center">{errors}</div>
          )}

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className={`form-control ${
                errors.email ? "is-invalid" : ""
              }`}
              placeholder="Enter your email"
              value={userValues.email}
              onChange={handleChange}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className={`form-control ${
                errors.password ? "is-invalid" : ""
              }`}
              placeholder="Enter your password"
              value={userValues.password}
              onChange={handleChange}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div>

          <button type="submit" className="btn btn-success w-100">
            Login
          </button>
        </form>

        <p className="text-center mt-3 mb-0">
          Don't have an account?{" "}
          <a href="/register" className="text-decoration-none">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
