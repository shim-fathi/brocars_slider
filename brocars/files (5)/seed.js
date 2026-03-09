/**
 * seed.js — Populate the database with initial car data from cars.html
 *
 * Run once:  node seed.js
 */

require('dotenv').config();
const db = require('./db');

console.log('🌱  Seeding database...\n');

const cars = [
  {
    name:         'Peugeot 2008',
    year:         2013,
    type:         'SUV',
    category:     'suv',
    emoji:        '🚘',
    price:        620000,
    price_usd:    20700,
    badge:        'AVAILABLE',
    status:       'available',
    engine:       '1.6L Diesel',
    transmission: 'Manual',
    mileage:      '95,000 km',
    color:        'Brown',
    description:  'Stylish compact SUV with modern features, comfortable interior and excellent fuel efficiency.',
    images:  ['images/peugo_1.jpeg','images/peugo_2.jpeg','images/peugo_3.jpeg','images/peugo_4.jpeg','images/peugo_5.jpeg'],
    features: [
      'Touchscreen Infotainment','Bluetooth Connectivity','Cruise Control',
      'Rear Parking Sensors','Alloy Wheels','LED Daytime Running Lights',
      'Roof Rails','Air Conditioning','Multi-function Steering Wheel','ABS Braking System'
    ]
  },
  {
    name:         'BMW X5 M Sport',
    year:         2024,
    type:         'SUV',
    category:     'suv',
    emoji:        '🏎️',
    price:        null,
    price_usd:    96700,
    badge:        'COMING SOON',
    status:       'coming_soon',
    engine:       '3.0T',
    transmission: 'AWD',
    mileage:      '9,800 km',
    color:        'White',
    description:  'xDrive AWD · Panoramic roof · Harman Kardon · 360° cameras · Apple CarPlay.',
    images:  ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=700&q=80'],
    features: ['xDrive AWD','Panoramic Roof','Harman Kardon Audio','360° Cameras','Apple CarPlay']
  },
  {
    name:         'Tesla Model 3 LR',
    year:         2023,
    type:         'Electric',
    category:     'electric',
    emoji:        '⚡',
    price:        null,
    price_usd:    null,
    badge:        'COMING SOON',
    status:       'coming_soon',
    engine:       'Dual Motor Electric',
    transmission: 'AWD',
    mileage:      '14,200 km',
    color:        'White',
    description:  '560km range · Full Self-Driving · Over-the-air updates · White premium interior.',
    images:  ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=700&q=80'],
    features: ['560km Range','Full Self-Driving','Over-the-Air Updates','White Premium Interior','Dual Motor AWD']
  },
  {
    name:         'Mercedes E300',
    year:         2019,
    type:         'Sedan',
    category:     'sedan',
    emoji:        '🚗',
    price:        null,
    price_usd:    null,
    badge:        'SOLD',
    status:       'sold',
    engine:       '2.0T',
    transmission: 'Automatic',
    mileage:      '42,000 km',
    color:        'Black',
    description:  'Luxury executive sedan with panoramic roof and Burmester sound system.',
    images:  ['images/sold_1.jpeg'],
    features: ['Panoramic Roof','Burmester Sound','AMG Line','Widescreen Cockpit']
  },
  {
    name:         'Toyota Prado',
    year:         2021,
    type:         'SUV',
    category:     'suv',
    emoji:        '🚙',
    price:        null,
    price_usd:    null,
    badge:        'SOLD',
    status:       'sold',
    engine:       '2.8L Diesel',
    transmission: 'Automatic',
    mileage:      '28,000 km',
    color:        'Silver',
    description:  'Full-size 4WD SUV with 7 seats, perfect for family adventures.',
    images:  ['images/sold_2.jpeg'],
    features: ['7 Seats','4WD','Leather Interior','Roof Rails','Tow Bar']
  }
];

cars.forEach(car => {
  const created = db.createCar(car);
  console.log(`  ✅  [${created.id}] ${created.name} (${created.status})`);
});

console.log('\n✨  Seed complete!');
process.exit(0);
