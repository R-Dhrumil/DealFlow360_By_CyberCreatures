const userRepository = require('../../src/repositories/user.repository');

module.exports = {
  getUserByEmail: (email) => userRepository.findByEmail(email),
  getUserById: (id, companyId) => userRepository.findById(id, companyId)
};
