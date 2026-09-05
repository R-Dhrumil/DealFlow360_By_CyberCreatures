function attachCompanyScope(req, res, next) {
  if (req.user && req.user.companyId) {
    req.companyId = req.user.companyId;
    next();
  } else {
    res.status(403).json({ error: 'Company scope required' });
  }
}

module.exports = attachCompanyScope;
