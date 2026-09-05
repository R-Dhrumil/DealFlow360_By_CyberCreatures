const settingsRepository = require('../repositories/settings.repository');

const getSettings = async (req, res) => {
  const settings = await settingsRepository.getGlobalSettings();
  res.json(settings);
};

const updateSettings = async (req, res) => {
  const settings = await settingsRepository.updateGlobalSettings(req.body);
  res.json({ success: true, settings });
};

module.exports = {
  getSettings,
  updateSettings
};
