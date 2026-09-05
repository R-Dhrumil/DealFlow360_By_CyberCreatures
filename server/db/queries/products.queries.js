const productRepository = require('../../src/repositories/product.repository');

module.exports = {
  getProductsByCompany: (companyId) => productRepository.findByCompany(companyId)
};
