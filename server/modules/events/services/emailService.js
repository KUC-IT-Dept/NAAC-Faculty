// modules/events/services/emailService.js
// Reuses the existing gmail/nodemailer pattern from
// modules/student/utils/sendEmail.js (same EMAIL_USER / PASSWORD env vars —
// no new credentials needed). Failures are logged, never thrown: email is a
// best-effort channel on top of the in-app notification, which is the
// system of record (Part 11: "Start with in-app notifications... support
// email... if the project infrastructure permits").
const nodemailer = require('nodemailer');

let transporter = null;
function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.PASSWORD },
    });
  }
  return transporter;
}

async function sendEventEmail(toEmail, subject, message) {
  const t = getTransporter();
  if (!t || !toEmail) return false; // email not configured — in-app notification still fired
  try {
    await t.sendMail({
      from: `"NAAC Faculty Dashboard — Campus Events" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html: `<div style="font-family:Arial;line-height:1.5;"><p>${message}</p></div>`,
    });
    return true;
  } catch (error) {
    console.error('[eventEmailService] send failed:', error.message);
    return false;
  }
}

module.exports = { sendEventEmail };
