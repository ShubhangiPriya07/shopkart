const bcrypt = require("bcrypt");
const Customer = require("../models/customer.model");
const generateToken = require("../utils/generateToken");

const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Check for missing fields
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    // Check if email already exists
    const existingCustomer = await Customer.findOne({ email });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer
    const customer = await Customer.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
    });

    // Return customer without password
    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find customer by email
    const customer = await Customer.findOne({ email });

    // Invalid credentials
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare entered password with hashed password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      customer.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT
    const token = generateToken(customer._id);

    // Store JWT in HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getMyProfile = async (req, res) => {
  return res.status(200).json(req.user);
};

const logoutCustomer = async (req, res) => {
  res.clearCookie("token");

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getMyProfile,
  logoutCustomer,
};