const pool = require('../db/pool');

/**
 * Logs an action to the audit_log table.
 * 
 * @param {string} entityType - The type of entity being modified (e.g. 'quotation', 'settings', 'user')
 * @param {string} entityId - The UUID of the entity being modified
 * @param {string} userId - The UUID of the user performing the action
 * @param {string} action - Description of the action (e.g. 'created', 'approved', 'updated')
 * @param {object} details - Any additional JSON data to store about the change
 */
const logAction = async (entityType, entityId, userId, action, details = {}) => {
  try {
    await pool.query(
      `INSERT INTO audit_log (entity_type, entity_id, user_id, action, details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [entityType, entityId, userId, action, details]
    );
  } catch (err) {
    // We log to console but do not throw to prevent breaking the main transaction flow.
    console.error(`[AuditService Error] Failed to log action '${action}' for ${entityType} ${entityId}:`, err);
  }
};

module.exports = {
  logAction
};
