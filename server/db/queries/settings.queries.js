const pool = require('../pool');

async function getGlobalSettings() {
  const result = await pool.query('SELECT * FROM global_settings LIMIT 1');
  if (result.rows.length === 0) {
    // Insert default if none exists
    const insertResult = await pool.query(`
      INSERT INTO global_settings (site_name, tagline) 
      VALUES ('DealFlow360', 'B2B Sales Operations Platform') 
      RETURNING *
    `);
    return insertResult.rows[0];
  }
  return result.rows[0];
}

async function updateGlobalSettings(data) {
  // Ensure a row exists first
  await getGlobalSettings();

  const { site_name, tagline, logo_url, favicon_url, google_analytics_id, google_search_console_id, meta_pixel_id, custom_meta_tags } = data;
  
  const result = await pool.query(`
    UPDATE global_settings 
    SET 
      site_name = COALESCE($1, site_name),
      tagline = COALESCE($2, tagline),
      logo_url = $3,
      favicon_url = $4,
      google_analytics_id = $5,
      google_search_console_id = $6,
      meta_pixel_id = $7,
      custom_meta_tags = COALESCE($8, custom_meta_tags),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [
    site_name, 
    tagline, 
    logo_url, 
    favicon_url, 
    google_analytics_id, 
    google_search_console_id, 
    meta_pixel_id, 
    custom_meta_tags ? JSON.stringify(custom_meta_tags) : null
  ]);

  return result.rows[0];
}

module.exports = {
  getGlobalSettings,
  updateGlobalSettings
};
