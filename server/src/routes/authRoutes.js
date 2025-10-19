import express from "express";

import {
  register,
  login,
  deleteUser,
  updateUser,
  logout,
} from "../controllers/authController.js"; //add deleteUser //add update

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

//delete route
router.patch("/user/:user_id", deleteUser);

// update rout
router.put("/user/:user_id", updateUser);

// Loug out 
router.post("/logout", logout);

export default router;

/// Done test
