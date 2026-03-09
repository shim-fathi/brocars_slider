/**
 * server.js — BroCars REST API (SQLite edition)
 *
 * ┌─────────────────────────────────────────────────────────┐
 *  CARS
 *   GET    /api/cars                  list  (filter: ?category= ?status=)
 *   GET    /api/cars/:id              read
 *   POST   /api/cars                  create   [admin]
 *   PUT    /api/cars/:id              update   [admin]
 *   DELETE /api/cars/:id              delete   [admin]
 *
 *  CONTACTS
 *   POST   /api/contact               create (public — website form)
 *   GET    /api/admin/contacts        list   [admin]  (?status=new|read|replied)
 *   GET    /api/admin/contacts/:id    read   [admin]
 *   PATCH  /api/admin/contacts/:id    update status  [admin]
 *   DELETE /api/admin/contacts/:id    delete [admin]
 *
 *  ORDERS
 *   POST   /api/orders                create (public — website checkout)
 *   GET    /api/orders/:ref           read by reference (public)
 *   GET    /api/admin/orders          list   [admin]  (?status=pending|confirmed|cancelled)
 *   GET    /api/admin/orders/:id      read   [admin]
 *   PATCH  /api/admin/orders/:id      update status  [admin]
 *   DELETE /api/admin/orders/:id      delete [admin]
 * └─────────────────────────────────────────────────────────┘
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const db      = require('./db');
const { sendContactEmail, sendOrderConfirmEmail } = require('./mailer');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ─────────────────────────────────────────── */
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());

/* ── Admin auth middleware ──────────────────────────────── */
function adminAuth (req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

/* ── Validation helpers ─────────────────────────────────── */
function validEmail (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validPhone (v) { return /^[\d\s\+\-\(\)]{7,16}$/.test(v); }

/* ══════════════════════════════════════════════════════════
   CARS
══════════════════════════════════════════════════════════ */

// GET /api/cars  — public
app.get('/api/cars', (req, res) => {
  const { category, status } = req.query;
  const cars = db.getAllCars({ category, status });
  res.json({ success: true, count: cars.length, data: cars });
});

// GET /api/cars/:id  — public
app.get('/api/cars/:id', (req, res) => {
  const car = db.getCarById(Number(req.params.id));
  if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
  res.json({ success: true, data: car });
});

// POST /api/cars  — admin only
app.post('/api/cars', adminAuth, (req, res) => {
  const { name, year, type, category } = req.body;
  if (!name || !year || !type || !category) {
    return res.status(400).json({ success: false, message: 'name, year, type and category are required' });
  }
  const car = db.createCar(req.body);
  res.status(201).json({ success: true, data: car });
});

// PUT /api/cars/:id  — admin only (full or partial update)
app.put('/api/cars/:id', adminAuth, (req, res) => {
  const car = db.updateCar(Number(req.params.id), req.body);
  if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
  res.json({ success: true, data: car });
});

// DELETE /api/cars/:id  — admin only
app.delete('/api/cars/:id', adminAuth, (req, res) => {
  const deleted = db.deleteCar(Number(req.params.id));
  if (!deleted) return res.status(404).json({ success: false, message: 'Car not found' });
  res.json({ success: true, message: 'Car deleted' });
});

/* ══════════════════════════════════════════════════════════
   CONTACTS
══════════════════════════════════════════════════════════ */

// POST /api/contact  — public (website form)
app.post('/api/contact', async (req, res) => {
  const { name, phone, email, subject, message } = req.body;

  if (!name || !email || !message)
    return res.status(400).json({ success: false, message: 'name, email and message are required' });
  if (!validEmail(email))
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  if (phone && !validPhone(phone))
    return res.status(400).json({ success: false, message: 'Invalid phone number' });

  const entry = db.createContact({ name, phone, email, subject, message });
  sendContactEmail(entry).catch(e => console.error('[mailer]', e.message));

  res.status(201).json({
    success: true,
    message: 'Thank you! We will get back to you shortly.',
    data: { id: entry.id, createdAt: entry.created_at }
  });
});

// GET /api/admin/contacts  — admin
app.get('/api/admin/contacts', adminAuth, (req, res) => {
  const contacts = db.getAllContacts({ status: req.query.status });
  res.json({ success: true, count: contacts.length, data: contacts });
});

// GET /api/admin/contacts/:id  — admin
app.get('/api/admin/contacts/:id', adminAuth, (req, res) => {
  const contact = db.getContactById(Number(req.params.id));
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
  res.json({ success: true, data: contact });
});

// PATCH /api/admin/contacts/:id  — update status
app.patch('/api/admin/contacts/:id', adminAuth, (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ success: false, message: 'status is required' });
  const contact = db.updateContactStatus(Number(req.params.id), status);
  if (!contact) return res.status(400).json({ success: false, message: 'Invalid id or status. Allowed: new | read | replied' });
  res.json({ success: true, data: contact });
});

// DELETE /api/admin/contacts/:id  — admin
app.delete('/api/admin/contacts/:id', adminAuth, (req, res) => {
  const deleted = db.deleteContact(Number(req.params.id));
  if (!deleted) return res.status(404).json({ success: false, message: 'Contact not found' });
  res.json({ success: true, message: 'Contact deleted' });
});

/* ══════════════════════════════════════════════════════════
   ORDERS
══════════════════════════════════════════════════════════ */

// POST /api/orders  — public (website checkout)
app.post('/api/orders', async (req, res) => {
  const { carId, paymentMethod, name, phone, email, nic,
          address, notes, leaseDetails, tradeInDetails } = req.body;

  if (!carId || !paymentMethod || !name || !phone || !email || !nic)
    return res.status(400).json({ success: false, message: 'carId, paymentMethod, name, phone, email and nic are required' });
  if (!['full','lease','tradein'].includes(paymentMethod))
    return res.status(400).json({ success: false, message: 'paymentMethod must be: full | lease | tradein' });

  const car = db.getCarById(Number(carId));
  if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
  if (car.status !== 'available')
    return res.status(409).json({ success: false, message: 'This vehicle is no longer available' });

  const order = db.createOrder({
    carId: car.id, carName: car.name, carYear: car.year,
    carColor: car.color, carPrice: car.price,
    paymentMethod, name, phone, email, nic,
    address, notes, leaseDetails, tradeInDetails
  });

  sendOrderConfirmEmail(order, car).catch(e => console.error('[mailer]', e.message));

  res.status(201).json({
    success: true,
    message: `Order placed! Our team will contact you within 2 hours.`,
    data: { ref: order.ref, createdAt: order.created_at }
  });
});

// GET /api/orders/:ref  — public order lookup
app.get('/api/orders/:ref', (req, res) => {
  const order = db.getOrderByRef(req.params.ref.toUpperCase());
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  const { nic, ...safe } = order;          // hide NIC from public
  res.json({ success: true, data: safe });
});

// GET /api/admin/orders  — admin
app.get('/api/admin/orders', adminAuth, (req, res) => {
  const orders = db.getAllOrders({ status: req.query.status });
  res.json({ success: true, count: orders.length, data: orders });
});

// GET /api/admin/orders/:id  — admin
app.get('/api/admin/orders/:id', adminAuth, (req, res) => {
  const order = db.getOrderById(Number(req.params.id));
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, data: order });
});

// PATCH /api/admin/orders/:id  — update status
app.patch('/api/admin/orders/:id', adminAuth, (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ success: false, message: 'status is required' });
  const order = db.updateOrderStatus(Number(req.params.id), status);
  if (!order) return res.status(400).json({ success: false, message: 'Invalid id or status. Allowed: pending | confirmed | cancelled' });
  res.json({ success: true, data: order });
});

// DELETE /api/admin/orders/:id  — admin
app.delete('/api/admin/orders/:id', adminAuth, (req, res) => {
  const deleted = db.deleteOrder(Number(req.params.id));
  if (!deleted) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, message: 'Order deleted' });
});

/* ── 404 ────────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

/* ── Start ──────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`🚗  BroCars API  →  http://localhost:${PORT}`);
  console.log(`📦  Database     →  ${process.env.DB_PATH || './brocars.db'}`);
});

module.exports = app;
