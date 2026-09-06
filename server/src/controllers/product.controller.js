const productRepository = require('../repositories/product.repository');
const { broadcastInventoryUpdate } = require('../services/socket.service');

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
    const { name, category, basePrice, unit, description, sku, minMargin, stock } = req.body;
    if (!name || !basePrice) {
      return res.status(400).json({ error: 'Product name and base price are required' });
    }
    const newProduct = await productRepository.create(req.companyId, { name, category, basePrice, unit, description, sku, minMargin, stock });
    broadcastInventoryUpdate(req.companyId, { productId: newProduct.id, type: 'product_created' });
    return res.status(201).json(newProduct);
  }

  async updateProduct(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    const updated = await productRepository.update(req.companyId, id, updateData);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found or access denied' });
    }
    broadcastInventoryUpdate(req.companyId, { productId: id, type: 'product_updated' });
    return res.json(updated);
  }

  async deleteProduct(req, res) {
    const { id } = req.params;
    const deleted = await productRepository.delete(req.companyId, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found or access denied' });
    }
    broadcastInventoryUpdate(req.companyId, { productId: id, type: 'product_deleted' });
    return res.json({ success: true, message: 'Product deleted successfully', id });
  }

  async updateStock(req, res) {
    const { id } = req.params;
    const { stock, delta } = req.body;
    const result = await productRepository.updateStock(req.companyId, id, { stock, delta });
    broadcastInventoryUpdate(req.companyId, { productId: id, type: 'stock_updated' });
    return res.json(result);
  }

  // --- Variants ---
  async getProductVariants(req, res) {
    const { id } = req.params;
    const variants = await productRepository.getProductVariants(id);
    return res.json(variants);
  }

  async addProductVariant(req, res) {
    const { id } = req.params;
    const variantData = req.body;
    const variant = await productRepository.addProductVariant(id, variantData);
    if (!variant) return res.status(400).json({ error: 'Failed to add variant' });
    return res.status(201).json(variant);
  }

  // --- Price Lists ---
  async getPriceLists(req, res) {
    const lists = await productRepository.getPriceLists(req.companyId);
    return res.json(lists);
  }

  async createPriceList(req, res) {
    const priceListData = req.body;
    const list = await productRepository.createPriceList(req.companyId, priceListData);
    if (!list) return res.status(400).json({ error: 'Failed to create price list' });
    return res.status(201).json(list);
  }
}

module.exports = new ProductController();
