import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'
import { API_URL } from "../../config";


export default function Register() {
  // ==========================================================================
  
const navigate = useNavigate();
  const[userValues, setUserValues] = useState({
  full_name:'',
  email:'',
  password:'',
    confirmPassword: '',
});

const [error, setError]= useState('');
const [success, setSuccess]= useState('');
// ########################
const handleUserChanges = (e) =>{
  
setUserValues({ ...userValues, [e.target.name]: e.target.value });

}
// ########################

const handleSubmitRegisterForm = async (e) => {
  e.preventDefault();

  setError('');
  setSuccess('');

  // ✅ تحقق من الحقول المطلوبة
  if (!userValues.full_name || !userValues.email 
      || !userValues.password || !userValues.confirmPassword) {
    setError('All fields are required.');
    return;
  }

  // ✅ التحقق من طول الباسورد
  if (userValues.password.length < 6) {
    setError('Password must be at least 6 characters.');
    return;
  }

  // ✅ التأكد من تطابق الباسورد
  if (userValues.password !== userValues.confirmPassword) {
    setError('Passwords do not match.');
    return;
  }

  try {
    // ✅ التسجيل على السيرفر
    const response = await axios.post(
      `${API_URL}/api/auth/register`,
      userValues,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true, // 👈 مهم إذا السيرفر يستخدم session
      }
    );

    // إذا التسجيل ناجح
    if (response.status === 201 || response.data.success) {
      setSuccess("User registered successfully!");

      // 🔹 خيار: تسجيل دخول المستخدم مباشرة بعد التسجيل
      // إذا السيرفر يرجع session أو token في الكوكي
      // يمكن إعادة التوجيه مباشرة
      setTimeout(() => navigate("/home"), 1500);
    }

  } catch (error) {
    console.error("Error registering user:", error.response?.data || error.message);
    setError("Error registering user: " + (error.response?.data?.message || error.message));
  }
};








  // ==========================================================================
  return (
    <>
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
    <h3>Hello From Register Page</h3>
      <div className="card shadow p-4" style={{ width: '400px', borderRadius: '15px' }}>
        <h3 className="text-center mb-4 text-success">Create Account</h3>

        {error && <div className="alert alert-danger text-center">{error}</div>}
        {success && <div className="alert alert-success text-center">{success}</div>}


        <form onSubmit={handleSubmitRegisterForm}>
          <div className="mb-3">
            <label htmlFor="full_name" className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              id="full_name"
              name="full_name"
              placeholder="Enter username"
              // required
onChange={handleUserChanges}

            />
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              placeholder="Enter email"
              // required
              onChange={handleUserChanges}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              placeholder="Enter password"
              // required
              onChange={handleUserChanges}
            />
          </div>

           <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm password"
              // required
              onChange={handleUserChanges}
            />
          </div>

          <button type="submit" className="btn btn-success w-100">
            Register
          </button>
        </form>

        <p className="text-center mt-3 mb-0">
          Already have an account?{' '}
          {/* <a href="/login" className="text-decoration-none text-primary">
            Login
          </a> */}

            <Link to='/login' className='text-blue-500'>Login</Link>
        </p>
      </div>
    </div>
    </>
  );
}
