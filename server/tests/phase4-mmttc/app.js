process.env.JWT_SECRET = process.env.JWT_SECRET || 'harness6-secret';
const express = require('express');
const app = express();
app.use(express.json());
app.use('/api/mmttc', require('./modules/mmttc/routes/mmttc.routes'));
module.exports = app;
