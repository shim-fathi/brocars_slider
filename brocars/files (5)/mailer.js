/**
 * mailer.js — Nodemailer transporter for BroCars
 *
 * Reads credentials from environment variables.
 * If EMAIL_USER is not set, email sending is silently skipped
 * so the app still works without email configured.
 */

const nodemailer = require('nodemailer');

function createTransporter () {
  if (!process.env.EMAIL_USER) return null;

  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',   // true for 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

/* ── Contact enquiry email ───────────────────────────────── */
async function sendContactEmail (entry) {
  const transporter = createTransporter();
  if (!transporter) return;

  const to = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  await transporter.sendMail({
    from:    `"BroCars Website" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New Enquiry from ${entry.name}${entry.subject ? ' — ' + entry.subject : ''}`,
    html: `
      <h2 style="color:#111">New Contact Enquiry — BroCars</h2>
      <table style="border-collapse:collapse;width:100%;max-width:560px;font-family:sans-serif">
        <tr><td style="padding:8px;font-weight:bold;background:#f4f4f4">Name</td>
            <td style="padding:8px">${esc(entry.name)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f4f4f4">Email</td>
            <td style="padding:8px">${esc(entry.email)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f4f4f4">Phone</td>
            <td style="padding:8px">${esc(entry.phone || '—')}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f4f4f4">Subject</td>
            <td style="padding:8px">${esc(entry.subject || '—')}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f4f4f4;vertical-align:top">Message</td>
            <td style="padding:8px;white-space:pre-wrap">${esc(entry.message)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f4f4f4">Received</td>
            <td style="padding:8px">${entry.createdAt}</td></tr>
      </table>
    `
  });
}

/* ── Order confirmation email (sent to customer) ─────────── */
async function sendOrderConfirmEmail (order, car) {
  const transporter = createTransporter();
  if (!transporter) return;

  const methodLabels = {
    full:    'Full Cash Payment',
    lease:   'Bank Leasing Finance',
    tradein: 'Trade-In + Cash'
  };

  // Email to customer
  await transporter.sendMail({
    from:    `"BroCars" <${process.env.EMAIL_USER}>`,
    to:      order.email,
    subject: `Your BroCars Order Confirmation — ${order.ref}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px">
        <h2 style="background:#111;color:#FFD700;padding:1rem;margin:0">🚗 BroCars Order Confirmed</h2>
        <div style="padding:1.5rem;border:1px solid #eee">
          <p>Hi <strong>${esc(order.name)}</strong>,</p>
          <p>Thank you for your order! Our team will contact you within <strong>2 hours</strong> to confirm your purchase.</p>

          <h3 style="margin-top:1.5rem">Order Summary</h3>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:6px 0;color:#555">Reference</td>
                <td style="padding:6px 0;font-weight:bold">${order.ref}</td></tr>
            <tr><td style="padding:6px 0;color:#555">Vehicle</td>
                <td style="padding:6px 0">${order.carYear} ${esc(order.carName)} · ${esc(order.carColor)}</td></tr>
            <tr><td style="padding:6px 0;color:#555">Payment</td>
                <td style="padding:6px 0">${methodLabels[order.paymentMethod]}</td></tr>
            <tr><td style="padding:6px 0;color:#555">Price</td>
                <td style="padding:6px 0">Rs. ${order.carPrice ? order.carPrice.toLocaleString() : '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#555">Contact</td>
                <td style="padding:6px 0">${esc(order.phone)}</td></tr>
          </table>

          <p style="margin-top:1.5rem;font-size:0.9rem;color:#555">
            Keep your reference number safe. You can track your order at any time.
          </p>
          <p style="font-size:0.9rem;color:#555">
            — The BroCars Team
          </p>
        </div>
      </div>
    `
  });

  // Notify admin too
  const adminTo = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  await transporter.sendMail({
    from:    `"BroCars Website" <${process.env.EMAIL_USER}>`,
    to:      adminTo,
    subject: `New Order ${order.ref} — ${order.carName}`,
    html: `
      <h2>New Purchase Order — BroCars</h2>
      <p><strong>Ref:</strong> ${order.ref}</p>
      <p><strong>Car:</strong> ${order.carYear} ${esc(order.carName)}</p>
      <p><strong>Customer:</strong> ${esc(order.name)} / ${esc(order.phone)} / ${esc(order.email)}</p>
      <p><strong>NIC:</strong> ${esc(order.nic)}</p>
      <p><strong>Payment:</strong> ${order.paymentMethod}</p>
      <p><strong>Address:</strong> ${esc(order.address || '—')}</p>
      <p><strong>Notes:</strong> ${esc(order.notes || '—')}</p>
    `
  });
}

/* ── Simple HTML escaping ────────────────────────────────── */
function esc (str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { sendContactEmail, sendOrderConfirmEmail };
