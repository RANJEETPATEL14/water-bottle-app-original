// Google Apps Script - Copy this to your Google Sheet's Apps Script editor
// Extensions > Apps Script

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e.parameter;
  const action = params.action;

  let result;

  try {
    switch(action) {
      case 'getUsers':
        result = getUsers();
        break;
      case 'addUser':
        result = addUser(JSON.parse(params.data));
        break;
      case 'updateUser':
        result = updateUser(params.id, JSON.parse(params.data));
        break;
      case 'deleteUser':
        result = deleteUser(params.id);
        break;
      case 'getDeliveries':
        result = getDeliveries();
        break;
      case 'addDelivery':
        result = addDelivery(JSON.parse(params.data));
        break;
      case 'deleteDelivery':
        result = deleteDelivery(params.id);
        break;
      case 'getAllData':
        result = getAllData();
        break;
      case 'getReturns':
        result = getReturns();
        break;
      case 'addReturn':
        result = addReturn(JSON.parse(params.data));
        break;
      case 'deleteReturn':
        result = deleteReturn(params.id);
        break;
      default:
        result = { error: 'Unknown action' };
    }
  } catch(error) {
    result = { error: error.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get all data at once
function getAllData() {
  return {
    success: true,
    users: getUsers().users,
    deliveries: getDeliveries().deliveries,
    returns: getReturns().returns
  };
}

// USER FUNCTIONS
function getUsers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const users = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // if id exists
      const user = {};
      headers.forEach((header, index) => {
        user[header] = row[index];
      });
      // Ensure price is a number
      user.price = parseFloat(user.price) || 20;
      // Ensure active defaults to true for existing users
      if (user.active === undefined || user.active === '') {
        user.active = true;
      }
      users.push(user);
    }
  }

  return { success: true, users: users };
}

function addUser(userData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();

  sheet.appendRow([
    id,
    userData.name,
    userData.phone,
    userData.address,
    userData.defaultBottles || 1,
    userData.price || 20,
    createdAt,
    userData.active !== false ? true : false
  ]);

  return {
    success: true,
    user: {
      id,
      ...userData,
      active: true,
      createdAt
    }
  };
}

function updateUser(id, userData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.getRange(i + 1, 2).setValue(userData.name);
      sheet.getRange(i + 1, 3).setValue(userData.phone);
      sheet.getRange(i + 1, 4).setValue(userData.address);
      sheet.getRange(i + 1, 5).setValue(userData.defaultBottles || 1);
      sheet.getRange(i + 1, 6).setValue(userData.price || 20);
      // Column 8 is 'active' (after createdAt)
      sheet.getRange(i + 1, 8).setValue(userData.active !== false ? true : false);
      return { success: true };
    }
  }

  return { success: false, error: 'User not found' };
}

function deleteUser(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: 'User not found' };
}

// DELIVERY FUNCTIONS
function getDeliveries() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Deliveries');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const deliveries = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // if id exists
      const delivery = {};
      headers.forEach((header, index) => {
        delivery[header] = row[index];
      });
      // Ensure bottles and price are numbers
      delivery.bottles = parseInt(delivery.bottles) || 0;
      delivery.price = parseFloat(delivery.price) || 0;
      deliveries.push(delivery);
    }
  }

  return { success: true, deliveries: deliveries };
}

function addDelivery(deliveryData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Deliveries');
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();

  sheet.appendRow([
    id,
    deliveryData.userId,
    deliveryData.date,
    deliveryData.bottles,
    deliveryData.price || 0,
    deliveryData.notes || '',
    createdAt
  ]);

  return {
    success: true,
    delivery: {
      id,
      ...deliveryData,
      createdAt
    }
  };
}

function deleteDelivery(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Deliveries');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: 'Delivery not found' };
}

// RETURNS FUNCTIONS
function getReturns() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Returns');
  if (!sheet) {
    return { success: true, returns: [] };
  }
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const returns = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // if id exists
      const returnItem = {};
      headers.forEach((header, index) => {
        returnItem[header] = row[index];
      });
      // Ensure bottles is a number
      returnItem.bottles = parseInt(returnItem.bottles) || 0;
      returns.push(returnItem);
    }
  }

  return { success: true, returns: returns };
}

function addReturn(returnData) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Returns');

  // Create Returns sheet if it doesn't exist
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Returns');
    sheet.appendRow(['id', 'userId', 'date', 'bottles', 'notes', 'createdAt']);
  }

  const id = Date.now().toString();
  const createdAt = new Date().toISOString();

  sheet.appendRow([
    id,
    returnData.userId,
    returnData.date,
    returnData.bottles,
    returnData.notes || '',
    createdAt
  ]);

  return {
    success: true,
    return: {
      id,
      ...returnData,
      createdAt
    }
  };
}

function deleteReturn(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Returns');
  if (!sheet) {
    return { success: false, error: 'Returns sheet not found' };
  }
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: 'Return not found' };
}
