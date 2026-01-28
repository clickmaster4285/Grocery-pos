const bcrypt = require('bcryptjs');

/**
 * Hashes a plain-text password using bcrypt.
 * @param {string} password - The plain-text password to hash.
 * @returns {Promise<string>} The hashed password.
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

/**
 * Compares a plain-text password with a hashed password.
 * @param {string} candidatePassword - The plain-text password from user input.
 * @param {string} hashedPassword - The hashed password stored in the database.
 * @returns {Promise<boolean>} True if the passwords match, false otherwise.
 */
const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
