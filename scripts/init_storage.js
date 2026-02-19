/* eslint-disable no-undef */
/* eslint-env node */
const fs = require('fs');
const path = require('path');

// Define the storage path
const storagePath = path.join(__dirname, '..', 'storage');
const documentsPath = path.join(storagePath, 'documents');

// Create directories if they don't exist
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath);
  console.log('Created storage directory');
}

if (!fs.existsSync(documentsPath)) {
  fs.mkdirSync(documentsPath);
  console.log('Created documents directory');
}

console.log('Storage initialization complete');
