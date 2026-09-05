const customerRepository = require('../../src/repositories/customer.repository');

module.exports = {
  getCustomerByEmail: (email) => customerRepository.findByEmail(email),
  createCustomer: (name, email, passwordHash) => customerRepository.create(name, email, passwordHash)
};
