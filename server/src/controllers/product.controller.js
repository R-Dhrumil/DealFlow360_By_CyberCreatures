const productRepository = require('../repositories/product.repository');

class ProductController {
  async getCompanyProducts(req, res) {
    if (!req.companyId || req.user?.role === 'customer' || req.user?.role === 'super_admin') {
      const products = await productRepository.findMarketplaceProducts({});
      return res.json(products);
    }
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

  async updateProduct(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    const updated = await productRepository.update(req.companyId, id, updateData);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found or access denied' });
    }
    return res.json(updated);
  }

  async deleteProduct(req, res) {
    const { id } = req.params;
    const deleted = await productRepository.delete(req.companyId, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found or access denied' });
    }
    return res.json({ success: true, message: 'Product deleted successfully', id });
  }

  async updateStock(req, res) {
    const { id } = req.params;
    const { stock, delta } = req.body;
    const result = await productRepository.updateStock(req.companyId, id, { stock, delta });
    return res.json(result);
  }
}

module.exports = new ProductController();
