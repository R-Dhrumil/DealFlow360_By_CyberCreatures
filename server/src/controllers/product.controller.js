const productRepository = require('../repositories/product.repository');

class ProductController {
  async getCompanyProducts(req, res) {
    const products = await productRepository.findByCompany(req.companyId);
    return res.json(products);
  }
}

module.exports = new ProductController();
