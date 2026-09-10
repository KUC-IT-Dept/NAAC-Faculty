process.env.JWT_SECRET = process.env.JWT_SECRET || 'harness5-secret';
const express = require('express');
const app = express();
app.use(express.json());
app.use('/api/library', require('./modules/library/routes/library.routes'));
module.exports = app;
