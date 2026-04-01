const { pool } = require('../config/db');

const INSERT_LOG = `
  INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, message, meta)
  VALUES ($1, $2, $3, $4, $5, $6)
`;

// Write a log to the database using the shared pool.
const write = async ({ userId, actionType, entityType, entityId = null, message, meta = null }) => {
  try {
    await pool.query(INSERT_LOG, [
      userId,
      actionType,
      entityType,
      entityId,
      message,
      meta ? JSON.stringify(meta) : null,
    ]);
  } catch (err) {
    console.error('[LogService.write] Failed:', err.message);
  }
};

// Write a log within an active transaction.
const writeWithClient = async ({ client, userId, actionType, entityType, entityId = null, message, meta = null }) => {
  try {
    await client.query(INSERT_LOG, [
      userId,
      actionType,
      entityType,
      entityId,
      message,
      meta ? JSON.stringify(meta) : null,
    ]);
  } catch (err) {
    console.error('[LogService.writeWithClient] Failed:', err.message);
  }
};

const logService = { write, writeWithClient };
module.exports = { logService };
