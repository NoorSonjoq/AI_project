import React from 'react';
import logo from './logo.svg';
import './App.css';
import Home from './pages/home/Home';
import Login from './pages/auth/Login';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/auth/Register';


function App() {
  return (
   <BrowserRouter>
   <Routes>

<Route index path="/" element={<Login />}/>
<Route path="/login" element={<Login />}/>
<Route path="/register" element={<Register />}/>
<Route path="/home" element={<Home />}/>

   </Routes>
   </BrowserRouter>
  );
}

export default App;
