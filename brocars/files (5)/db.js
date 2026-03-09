/**
 * db.js — SQLite database layer for BroCars
 *
 * Uses better-sqlite3 (synchronous, no callback hell).
 * Database file: ./brocars.db  (auto-created on first run)
 */

const Database = require('better-sqlite3');
const path     = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'brocars.db');
const db      = new Database(DB_PATH);

// Performance: enable WAL mode
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ══════════════════════════════════════════════════════════
   SCHEMA
══════════════════════════════════════════════════════════ */
db.exec(`
  CREATE TABLE IF NOT EXISTS cars (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    year         INTEGER NOT NULL,
    type         TEXT    NOT NULL,
    category     TEXT    NOT NULL,           -- suv | sedan | electric | etc.
    emoji        TEXT    DEFAULT '🚗',
    price        INTEGER,                    -- Rs. (NULL = not listed yet)
    price_usd    INTEGER,
    badge        TEXT    DEFAULT 'AVAILABLE',
    status       TEXT    DEFAULT 'available',-- available | sold | coming_soon
    engine       TEXT,
    transmission TEXT,
    mileage      TEXT,
    color        TEXT,
    description  TEXT,
    images       TEXT    DEFAULT '[]',       -- JSON array of image paths
    features     TEXT    DEFAULT '[]',       -- JSON array of feature strings
    created_at   TEXT    DEFAULT (datetime('now')),
    updated_at   TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    phone      TEXT,
    email      TEXT NOT NULL,
    subject    TEXT,
    message    TEXT NOT NULL,
    status     TEXT DEFAULT 'new',           -- new | read | replied
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ref             TEXT    UNIQUE NOT NULL,
    car_id          INTEGER REFERENCES cars(id),
    car_name        TEXT,
    car_year        INTEGER,
    car_color       TEXT,
    car_price       INTEGER,
    payment_method  TEXT    NOT NULL,        -- full | lease | tradein
    status          TEXT    DEFAULT 'pending', -- pending | confirmed | cancelled
    name            TEXT    NOT NULL,
    phone           TEXT    NOT NULL,
    email           TEXT    NOT NULL,
    nic             TEXT    NOT NULL,
    address         TEXT,
    notes           TEXT,
    lease_details   TEXT,                    -- JSON
    tradein_details TEXT,                    -- JSON
    created_at      TEXT    DEFAULT (datetime('now')),
    updated_at      TEXT    DEFAULT (datetime('now'))
  );
`);

/* ══════════════════════════════════════════════════════════
   HELPERS — JSON parse/stringify for array columns
══════════════════════════════════════════════════════════ */
function parseCar (row) {
  if (!row) return null;
  return {
    ...row,
    images:   JSON.parse(row.images   || '[]'),
    features: JSON.parse(row.features || '[]')
  };
}

/* ══════════════════════════════════════════════════════════
   CARS CRUD
══════════════════════════════════════════════════════════ */

/** List all cars. Optional filter: { category, status } */
function getAllCars ({ category, status } = {}) {
  let sql    = 'SELECT * FROM cars WHERE 1=1';
  const args = [];
  if (category && category !== 'all') { sql += ' AND category = ?'; args.push(category); }
  if (status)                          { sql += ' AND status = ?';   args.push(status);   }
  sql += ' ORDER BY id DESC';
  return db.prepare(sql).all(...args).map(parseCar);
}

/** Get single car by ID */
function getCarById (id) {
  return parseCar(db.prepare('SELECT * FROM cars WHERE id = ?').get(id));
}

/** Create a new car listing */
function createCar (data) {
  const stmt = db.prepare(`
    INSERT INTO cars
      (name, year, type, category, emoji, price, price_usd,
       badge, status, engine, transmission, mileage, color,
       description, images, features)
    VALUES
      (@name, @year, @type, @category, @emoji, @price, @price_usd,
       @badge, @status, @engine, @transmission, @mileage, @color,
       @description, @images, @features)
  `);
  const result = stmt.run({
    ...data,
    emoji:    data.emoji        || '🚗',
    badge:    data.badge        || 'AVAILABLE',
    status:   data.status       || 'available',
    images:   JSON.stringify(data.images   || []),
    features: JSON.stringify(data.features || [])
  });
  return getCarById(result.lastInsertRowid);
}

/** Update a car (partial update — only provided fields change) */
function updateCar (id, data) {
  const car = getCarById(id);
  if (!car) return null;

  const fields = [];
  const values = {};

  const allowed = [
    'name','year','type','category','emoji','price','price_usd',
    'badge','status','engine','transmission','mileage','color','description'
  ];

  allowed.forEach(k => {
    if (data[k] !== undefined) { fields.push(`${k} = @${k}`); values[k] = data[k]; }
  });

  // Array fields
  if (data.images   !== undefined) { fields.push('images = @images');     values.images   = JSON.stringify(data.images);   }
  if (data.features !== undefined) { fields.push('features = @features'); values.features = JSON.stringify(data.features); }

  if (fields.length === 0) return car;   // nothing to update

  fields.push("updated_at = datetime('now')");
  values.id = id;

  db.prepare(`UPDATE cars SET ${fields.join(', ')} WHERE id = @id`).run(values);
  return getCarById(id);
}

/** Delete a car */
function deleteCar (id) {
  const result = db.prepare('DELETE FROM cars WHERE id = ?').run(id);
  return result.changes > 0;
}

/* ══════════════════════════════════════════════════════════
   CONTACTS CRUD
══════════════════════════════════════════════════════════ */

function getAllContacts ({ status } = {}) {
  let sql    = 'SELECT * FROM contacts WHERE 1=1';
  const args = [];
  if (status) { sql += ' AND status = ?'; args.push(status); }
  sql += ' ORDER BY id DESC';
  return db.prepare(sql).all(...args);
}

function getContactById (id) {
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) || null;
}

function createContact ({ name, phone, email, subject, message }) {
  const result = db.prepare(`
    INSERT INTO contacts (name, phone, email, subject, message)
    VALUES (@name, @phone, @email, @subject, @message)
  `).run({ name, phone: phone || null, email, subject: subject || null, message });
  return getContactById(result.lastInsertRowid);
}

function updateContactStatus (id, status) {
  const allowed = ['new', 'read', 'replied'];
  if (!allowed.includes(status)) return null;
  db.prepare("UPDATE contacts SET status = ? WHERE id = ?").run(status, id);
  return getContactById(id);
}

function deleteContact (id) {
  const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  return result.changes > 0;
}

/* ══════════════════════════════════════════════════════════
   ORDERS CRUD
══════════════════════════════════════════════════════════ */

function generateRef () {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = 'BRC-';
  for (let i = 0; i < 6; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

function getAllOrders ({ status } = {}) {
  let sql    = 'SELECT * FROM orders WHERE 1=1';
  const args = [];
  if (status) { sql += ' AND status = ?'; args.push(status); }
  sql += ' ORDER BY id DESC';
  return db.prepare(sql).all(...args).map(parseOrder);
}

function getOrderById (id) {
  return parseOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
}

function getOrderByRef (ref) {
  return parseOrder(db.prepare('SELECT * FROM orders WHERE ref = ?').get(ref));
}

function parseOrder (row) {
  if (!row) return null;
  return {
    ...row,
    lease_details:   row.lease_details   ? JSON.parse(row.lease_details)   : null,
    tradein_details: row.tradein_details ? JSON.parse(row.tradein_details) : null
  };
}

function createOrder (data) {
  let ref;
  // ensure unique ref
  do { ref = generateRef(); } while (getOrderByRef(ref));

  const result = db.prepare(`
    INSERT INTO orders
      (ref, car_id, car_name, car_year, car_color, car_price,
       payment_method, name, phone, email, nic,
       address, notes, lease_details, tradein_details)
    VALUES
      (@ref, @car_id, @car_name, @car_year, @car_color, @car_price,
       @payment_method, @name, @phone, @email, @nic,
       @address, @notes, @lease_details, @tradein_details)
  `).run({
    ref,
    car_id:          data.carId,
    car_name:        data.carName,
    car_year:        data.carYear,
    car_color:       data.carColor,
    car_price:       data.carPrice,
    payment_method:  data.paymentMethod,
    name:            data.name,
    phone:           data.phone,
    email:           data.email,
    nic:             data.nic,
    address:         data.address  || null,
    notes:           data.notes    || null,
    lease_details:   data.leaseDetails   ? JSON.stringify(data.leaseDetails)   : null,
    tradein_details: data.tradeInDetails ? JSON.stringify(data.tradeInDetails) : null
  });
  return getOrderById(result.lastInsertRowid);
}

function updateOrderStatus (id, status) {
  const allowed = ['pending', 'confirmed', 'cancelled'];
  if (!allowed.includes(status)) return null;
  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  return getOrderById(id);
}

function deleteOrder (id) {
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  return result.changes > 0;
}

/* ══════════════════════════════════════════════════════════
   EXPORTS
══════════════════════════════════════════════════════════ */
module.exports = {
  // Cars
  getAllCars, getCarById, createCar, updateCar, deleteCar,
  // Contacts
  getAllContacts, getContactById, createContact, updateContactStatus, deleteContact,
  // Orders
  getAllOrders, getOrderById, getOrderByRef, createOrder, updateOrderStatus, deleteOrder
};
