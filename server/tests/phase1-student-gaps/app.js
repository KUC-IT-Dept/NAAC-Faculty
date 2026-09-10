process.env.JWT_SECRET = process.env.JWT_SECRET || 'harness-secret';
const express = require('express');
const app = express();
app.use(express.json());

app.use('/api/dropdowns', require('./modules/student/routes/dropdown.routes'));
app.use('/api/notifications', require('./modules/student/routes/notification.routes'));
app.use('/api/profile-update-request', require('./modules/student/routes/profileUpdateRequest.routes'));
app.use('/api/forgot-password-request', require('./modules/student/routes/forgotPasswordRequest.routes'));
app.use('/api/student', require('./modules/student/routes/studentProfile.routes'));

module.exports = app;
