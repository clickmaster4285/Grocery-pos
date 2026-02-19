// controllers/settings.controller.js
const Settings = require("../models/settings.model");
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { deleteFile } = require('../utils/file.utils');

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        companyName: "Supermarket POS",
        taxPercentage: 0,
        currency: "USD",
        currencySymbol: "$",
        language: "en",
        timezone: "UTC",
        lowStockThreshold: 10
      });
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ companyName: "Supermarket POS" });
    }

    const data = { ...req.body };

    // ✅ If logo file uploaded, save its path and delete old one
    if (req.file) {
      if (settings.logo) {
        deleteFile(settings.logo);
      }
      data.logo = `uploads/settings/${req.file.filename}`;
    }

    const updated = await Settings.findByIdAndUpdate(settings._id, data, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, phone, email, currentPassword, oldPassword, newPassword } = req.body;

    // Fetch user including password
    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update names freely
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    // Check if email or phone is changing
    const wantsToChangeEmail = email && email !== user.email;
    const wantsToChangePhone = phone && phone !== user.phone;

    if (wantsToChangeEmail || wantsToChangePhone) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Password required to change email or phone" });
      }

      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) return res.status(401).json({ message: "Invalid password" });

      if (wantsToChangeEmail) user.email = email;
      if (wantsToChangePhone) user.phone = phone;
    }

    // Password change
    if (newPassword) {
      if (!oldPassword) return res.status(400).json({ message: "Old password required to change password" });

      const isOldMatch = await comparePassword(oldPassword, user.password);
      if (!isOldMatch) return res.status(401).json({ message: "Old password does not match" });

      user.password = await hashPassword(newPassword);
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ message: "Profile updated successfully", user: userResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
