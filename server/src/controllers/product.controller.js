const productRepository = require('../repositories/product.repository');

class ProductController {
  async getCompanyProducts(req, res) {
    const products = await productRepository.findByCompany(req.companyId);
    return res.json(products);
  }

  async createProduct(req, res) {
    const { name, category, basePrice, unit, description, sku, minMargin } = req.body;
    if (!name || !basePrice) {
      return res.status(400).json({ error: 'Product name and base price are required' });
    }
    const newProduct = await productRepository.create(req.companyId, { name, category, basePrice, unit, description, sku, minMargin });
    return res.status(201).json(newProduct);
  }
}

module.exports = new ProductController();
