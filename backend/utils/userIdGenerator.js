const crypto = require('crypto');

/**
 * Generates a unique, formatted user ID.
 * Format: [INITIALS]-[ROLE_INITIAL]-[RANDOM_HEX]-[TIMESTAMP]
 * Example: JD-A-E4B7-1706023312
 */
const generateUserId = ({ firstName, lastName, role }) => {
  // 1. Initials
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : 'X';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : 'X';
  const initials = `${firstInitial}${lastInitial}`;

  // 2. Role Initial
  const roleInitial = role ? role.charAt(0).toUpperCase() : 'U';

  // 3. Random Hex
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();

  // 4. Timestamp
  const timestamp = Math.floor(Date.now() / 1000);

  return `${initials}-${roleInitial}-${randomHex}-${timestamp}`;
};

module.exports = {
  generateUserId,
};
