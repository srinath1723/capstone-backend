const bcrypt = require("bcrypt");
const User = require("../models/user");
const transporter = require("../utils/transporter");
const { EMAIL_ID } = require("../utils/config");

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
        text: `Welcome to our service! Please activate your account by clicking the link: http://localhost:3005/users/activate/${user._id}`,
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
};

module.exports = userController;