# 🚗 BroCars Backend — SQLite CRUD API

Full REST API for the BroCars dealership. Persists all data to a local **SQLite** file (`brocars.db`).

---

## Setup

```bash
npm install
cp .env.example .env      # edit ADMIN_KEY at minimum
node seed.js              # load initial car data from cars.html
npm start                 # → http://localhost:3000
```

For development with auto-restart:
```bash
npm run dev
```

---

## Authentication

Public routes — no key needed:
- `GET /api/cars*`
- `POST /api/contact`
- `POST /api/orders`
- `GET /api/orders/:ref`

Admin routes — require header:
```
X-Admin-Key: your_secret_key
```

---

## CARS

### List all cars
```
GET /api/cars
GET /api/cars?category=suv
GET /api/cars?status=available
GET /api/cars?category=suv&status=available
```
Category values: `suv` `sedan` `electric`
Status values: `available` `sold` `coming_soon`

### Get one car
```
GET /api/cars/1
```

### Create a car  `[admin]`
```bash
curl -X POST http://localhost:3000/api/cars \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your_secret_key" \
  -d '{
    "name": "Honda Vezel",
    "year": 2022,
    "type": "SUV",
    "category": "suv",
    "price": 850000,
    "price_usd": 28000,
    "badge": "AVAILABLE",
    "status": "available",
    "engine": "1.5L Hybrid",
    "transmission": "CVT",
    "mileage": "18,000 km",
    "color": "Pearl White",
    "description": "Latest hybrid compact SUV with Honda Sensing safety suite.",
    "images": ["images/vezel_1.jpeg"],
    "features": ["Honda Sensing", "Apple CarPlay", "Heated Seats", "LED Headlights"]
  }'
```

### Update a car  `[admin]`
Send only the fields you want to change:
```bash
curl -X PUT http://localhost:3000/api/cars/1 \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your_secret_key" \
  -d '{ "status": "sold", "badge": "SOLD" }'
```

### Delete a car  `[admin]`
```bash
curl -X DELETE http://localhost:3000/api/cars/1 \
  -H "X-Admin-Key: your_secret_key"
```

---

## CONTACTS

### Submit enquiry (public — website form)
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kasun Perera",
    "email": "kasun@example.com",
    "phone": "+94 77 123 4567",
    "subject": "Peugeot 2008 enquiry",
    "message": "I am interested in the Peugeot 2008. Is it still available?"
  }'
```

### List all contacts  `[admin]`
```bash
curl http://localhost:3000/api/admin/contacts \
  -H "X-Admin-Key: your_secret_key"

# Filter by status:
curl "http://localhost:3000/api/admin/contacts?status=new" \
  -H "X-Admin-Key: your_secret_key"
```
Status values: `new` `read` `replied`

### Get one contact  `[admin]`
```bash
curl http://localhost:3000/api/admin/contacts/1 \
  -H "X-Admin-Key: your_secret_key"
```

### Update contact status  `[admin]`
```bash
curl -X PATCH http://localhost:3000/api/admin/contacts/1 \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your_secret_key" \
  -d '{ "status": "replied" }'
```

### Delete a contact  `[admin]`
```bash
curl -X DELETE http://localhost:3000/api/admin/contacts/1 \
  -H "X-Admin-Key: your_secret_key"
```

---

## ORDERS

### Place an order (public — website checkout)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "carId": 1,
    "paymentMethod": "lease",
    "name": "Nimali Fernando",
    "phone": "+94 71 234 5678",
    "email": "nimali@example.com",
    "nic": "199512345678",
    "address": "45 Galle Road, Colombo 03",
    "leaseDetails": {
      "downPercent": 0.3,
      "tenure": 48,
      "rate": 0.11,
      "monthlyPayment": 14200
    }
  }'
```
`paymentMethod` values: `full` `lease` `tradein`

### Look up order by reference (public)
```bash
curl http://localhost:3000/api/orders/BRC-K4M9XZ
```

### List all orders  `[admin]`
```bash
curl http://localhost:3000/api/admin/orders \
  -H "X-Admin-Key: your_secret_key"

# Filter:
curl "http://localhost:3000/api/admin/orders?status=pending" \
  -H "X-Admin-Key: your_secret_key"
```
Status values: `pending` `confirmed` `cancelled`

### Get one order  `[admin]`
```bash
curl http://localhost:3000/api/admin/orders/1 \
  -H "X-Admin-Key: your_secret_key"
```

### Update order status  `[admin]`
```bash
curl -X PATCH http://localhost:3000/api/admin/orders/1 \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your_secret_key" \
  -d '{ "status": "confirmed" }'
```

### Delete an order  `[admin]`
```bash
curl -X DELETE http://localhost:3000/api/admin/orders/1 \
  -H "X-Admin-Key: your_secret_key"
```

---

## File Structure

```
brocars-backend/
├── server.js        — All Express routes
├── db.js            — SQLite layer (better-sqlite3)
├── mailer.js        — Email notifications
├── seed.js          — Populate initial car data
├── .env.example     — Environment template
├── package.json
└── brocars.db       — Auto-created SQLite database file
```

---

## Upgrading to PostgreSQL / MongoDB

Only `db.js` needs to change. All routes in `server.js` call the same functions:
- `getAllCars()`, `getCarById()`, `createCar()`, `updateCar()`, `deleteCar()`
- `getAllContacts()`, `getContactById()`, `createContact()`, `updateContactStatus()`, `deleteContact()`
- `getAllOrders()`, `getOrderById()`, `getOrderByRef()`, `createOrder()`, `updateOrderStatus()`, `deleteOrder()`
