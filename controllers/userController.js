const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const transporter = require("../utils/transporter");
const { EMAIL_ID, SECRET_KEY } = require("../utils/config");
// Importing the user helper function to generate an auth string
const { generateRandomString } = require("../helpers/useHelper");
const userController = {
  // API for registering users
  register: async (req, res) => {
    try {
      // Extracting user data from the request body
      const { firstName, lastName, email, password, salaryPerMonth } = req.body;

      // Checking if a user with the same email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists." });
      }

      // Hashing the password for security
      const hashedPassword = await bcrypt.hash(password, 10);

      // Creating a new user object
      const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        salaryPerMonth,
      });

      // Saving the new user to the database
      await user.save();

      // Sending an activation email to the new user
      await transporter.sendMail({
        from: EMAIL_ID,
        to: email,
        subject: "Activate your account",
        text: `Welcome to our service! Please activate your account by clicking the link: http://localhost:3004/users/activate/${user._id}`,
      });

      // Sending a success response with the new user details
      res.status(201).json({
        message: "Account created successfully. Please check your email to activate your account.",
        user,
      });
    } catch (error) {
      // Handling errors and sending an error response
      res.status(500).json({ message: "An error occurred while registering the user. Please try again later." });
    }
  },

  // API to activate the user profile
  activateUser: async (req, res) => {
    try {
      // Getting the user ID from the request parameters
      const { id } = req.params;

      // Checking if the user exists with the provided ID
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Activating the user account
      user.isActive = true;
      await user.save();

      // Sending a success response
      res.status(200).json({ message: "User activated successfully." });
    } catch (error) {
      // Handling errors and sending an error response
      res.status(500).json({ message: "An error occurred while activating the user. Please try again later." });
    }
  },
  // API for user login
  login: async (req, res) => {
    try {
      // getting the user email and password from the request body
      const { email, password } = req.body;

      // checking if the user exists in the database
      const user = await User.findOne({ email });

      // if the user does not exist, return an error response
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      // if the user is not active, return an error response
      if (!user.isActive) {
        return res.status(403).send({ message: "User account is not active" });
      }

      // if the user exists check the password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      // if the password is invalid, return an error response
      if (!isPasswordValid) {
        return res.status(400).send({ message: "Invalid password" });
      }

      // generating a JWT token
      const token = jwt.sign({ id: user._id }, SECRET_KEY);

      // setting the token as a cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: new Date(Date.now() + 24 * 3600000), // 24 hours from login
      });

      // sending a success response
      res.status(200).json({ message: "Login successful" });
    } catch (error) {
      // sending an error response
      res.status(500).send({ message: error.message });
    }
  },

  // API for user logout
  logout: async (req, res) => {
    try {
      // clearing the cookie
      res.clearCookie("token");

      // sending a success response
      res.status(200).send({ message: "Logged out successfully" });
    } catch (error) {
      // Sending an error response
      res.status(500).send({ message: error.message });
    }
  },
  // API for sending email for the user when user wants to reset password
  forgotPassword: async (req, res) => {
    try {
      // Extracting values from request body
      const { email } = req.body;

      // Checking if this email is of a valid user
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(404)
          .json({ message: "User with this email does not exist" });
      }

      // Generating auth string
      const authString = generateRandomString();

      // Update user
      user.authString = authString;
      await user.save();

      // Send email
      transporter.sendMail({
        from: EMAIL_ID,
        to: email,
        subject: "Password Reset",
        text: `Click here to reset your password: http://localhost:3004/users/verify/${authString}`,
      });

      // Sending a success response
      res.status(200).json({
        message: "Password reset link has been sent to your email address",
      });
    } catch (error) {
      // Sending an error response
      res.status(500).json({ message: error.message });
    }
  },

  // API for verifying the user auth string
  authVerify: async (req, res) => {
    try {
      // Extracting values from request params
      const { authString } = req.params;

      // Checking if this auth string is of a valid user
      const user = await User.findOne({ authString });
      if (!user) {
        return res.status(404).json({ message: "Auth string does not match!" });
      }

      // Sending a success response
      res.status(200).json({
        message: "Auth String verified successfully",
        email: user.email,
      });
    } catch (error) {
      // Sending an error response
      res.status(500).json({ message: error.message });
    }
  },

  // API for resetting password
  resetPassword: async (req, res) => {
    try {
      // Extracting values from request body
      const { email, password } = req.body;

      // Checking if this email is of a valid user
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(404)
          .json({ message: "User with this email does not exist" });
      }

      // Encrypting the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user
      user.password = hashedPassword;
      user.authString = "";
      await user.save();

      // Sending a success response
      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      // Sending an error response
      res.status(500).json({ message: error.message });
    }
  },
};
module.exports = userController;