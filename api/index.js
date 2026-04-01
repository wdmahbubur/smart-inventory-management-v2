// Vercel Serverless Function entry point
// This file is the bridge between Vercel's serverless runtime and the Express app.
// Vercel will route all /api/* requests here, and Express handles the routing internally.
require('dotenv').config();
module.exports = require('../backend/src/app');
