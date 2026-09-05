const productRepository = require('../repositories/product.repository');

class MarketplaceController {
  async getProducts(req, res) {
    const { category, search } = req.query;
    const products = await productRepository.findMarketplaceProducts({ category, search });
    return res.json(products);
  }
}

module.exports = new MarketplaceController();
