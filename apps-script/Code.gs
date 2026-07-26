/**
 * Water Supply App — Google Sheets backend (Google Apps Script)
 * ------------------------------------------------------------------
 * Handles every entity used by the app and stores each one in its own
 * tab (sheet). Tabs and columns are created automatically on first use,
 * so you never have to set them up by hand.
 *
 * Tabs used: users, deliveries, returns, products, groups, payments,
 *            expenses, agency
 *
 * HOW TO DEPLOY
 *   1. Open your Google Sheet → Extensions → Apps Script.
 *   2. Replace the contents of Code.gs with this file. Save.
 *   3. Deploy → Manage deployments → (edit the existing Web app) →
 *      Version: "New version" → Deploy.  (Keep the SAME deployment so
 *      the /exec URL in src/api.ts stays valid.)
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   4. Done. The app will start syncing all tables to this Sheet.
 *
 * The client (src/api.ts) calls this over GET with an `action` param and,
 * for writes, a `data` (JSON) and/or `id` param.
 */

var TABS = [
  'users', 'deliveries', 'returns', 'products',
  'groups', 'payments', 'expenses', 'agency'
];

/**
 * Column headers for each tab (must match the field names used by the app).
 * Used by setupSheets() to create empty, ready-to-fill tables.
 */
var SCHEMAS = {
  users:      ['id', 'name', 'phone', 'billingPhone', 'groupId', 'address', 'email', 'gst', 'shift', 'frequency', 'defaultBottles', 'price', 'openingDue', 'securityDeposit', 'active', 'createdAt'],
  deliveries: ['id', 'userId', 'date', 'shift', 'items', 'bottles', 'price', 'amount', 'notes', 'createdAt'],
  returns:    ['id', 'userId', 'date', 'bottles', 'notes', 'createdAt'],
  products:   ['id', 'name', 'supplier', 'capacity', 'rate', 'balanceJar', 'stockBalance', 'createdAt'],
  groups:     ['id', 'name', 'createdBy', 'createdAt'],
  payments:   ['id', 'userId', 'amount', 'mode', 'receiver', 'date', 'remark', 'createdAt'],
  expenses:   ['id', 'title', 'amount', 'category', 'date', 'notes', 'createdAt'],
  agency:     ['name', 'ownerName', 'ownerPhone', 'address', 'email', 'gst', 'bankName', 'accountNumber', 'ifsc', 'upiId']
};

/**
 * Run this ONCE from the Apps Script editor (select "setupSheets" in the
 * function dropdown → Run) to create every tab with its header row, empty.
 * Safe to re-run: it never clears or overwrites a tab that already has a
 * header row, so your existing users/deliveries/returns data is preserved.
 */
function setupSheets() {
  var created = [];
  for (var i = 0; i < TABS.length; i++) {
    var name = TABS[i];
    var sheet = getSheet(name);                 // finds (case-insensitive) or creates
    if (sheet.getLastColumn() === 0 || sheet.getLastRow() === 0) {
      var hdr = SCHEMAS[name];
      sheet.getRange(1, 1, 1, hdr.length).setValues([hdr]);
      sheet.setFrozenRows(1);
      created.push(name);
    }
  }
  Logger.log(created.length
    ? 'Header row added to: ' + created.join(', ')
    : 'All tabs already had headers — nothing changed.');
}

/**
 * DESTRUCTIVE — deletes EVERY tab and rebuilds all 8 tables fresh with the
 * correct lowercase names and header rows (no data). Use this for a clean
 * slate. Run it from the editor: select "resetSheets" → Run → approve.
 *
 * After running, the app will sync to these empty tables (and its own data
 * will be cleared on next load, matching the empty Sheet).
 */
function resetSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // A spreadsheet must always keep >=1 sheet, so park a temp one first.
  var tmp = ss.insertSheet('__tmp__' + new Date().getTime());
  var all = ss.getSheets();
  for (var i = 0; i < all.length; i++) {
    if (all[i].getSheetId() !== tmp.getSheetId()) ss.deleteSheet(all[i]);
  }
  for (var j = 0; j < TABS.length; j++) {
    var name = TABS[j];
    var sheet = ss.insertSheet(name);
    var hdr = SCHEMAS[name];
    sheet.getRange(1, 1, 1, hdr.length).setValues([hdr]);
    sheet.setFrozenRows(1);
  }
  ss.deleteSheet(tmp);
  Logger.log('Reset complete. Created tabs: ' + TABS.join(', '));
}

/**
 * Diagnostic: run this and read the Execution log to see every tab in the
 * Sheet and the header row it currently has. Paste the log to get help.
 */
function diagnose() {
  var all = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  Logger.log('Found ' + all.length + ' tab(s):');
  for (var i = 0; i < all.length; i++) {
    var s = all[i];
    var lastCol = s.getLastColumn();
    var lastRow = s.getLastRow();
    var hdr = lastCol > 0 ? s.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    Logger.log(
      '• "' + s.getName() + '"  rows=' + lastRow + '  cols=' + lastCol +
      '  headers=[' + hdr.join(', ') + ']'
    );
  }
}

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  try { lock.tryLock(30000); } catch (ignore) {}
  try {
    var p = (e && e.parameter) || {};
    var action = p.action || '';
    var data = p.data ? JSON.parse(p.data) : null;
    var id = (p.id !== undefined && p.id !== null) ? String(p.id) : null;
    var out;

    switch (action) {
      case 'getAllData': out = getAllData(); break;

      case 'addUser':        upsert('users', data);        out = ok(); break;
      case 'updateUser':     update('users', id, data);    out = ok(); break;
      case 'deleteUser':     remove('users', id);          out = ok(); break;

      case 'addDelivery':    upsert('deliveries', data);   out = ok(); break;
      case 'deleteDelivery': remove('deliveries', id);     out = ok(); break;

      case 'addReturn':      upsert('returns', data);      out = ok(); break;
      case 'deleteReturn':   remove('returns', id);        out = ok(); break;

      case 'addProduct':     upsert('products', data);     out = ok(); break;
      case 'updateProduct':  update('products', id, data); out = ok(); break;
      case 'deleteProduct':  remove('products', id);       out = ok(); break;

      case 'addGroup':       upsert('groups', data);       out = ok(); break;
      case 'deleteGroup':    remove('groups', id);         out = ok(); break;

      case 'addPayment':     upsert('payments', data);     out = ok(); break;
      case 'deletePayment':  remove('payments', id);       out = ok(); break;

      case 'addExpense':     upsert('expenses', data);     out = ok(); break;
      case 'deleteExpense':  remove('expenses', id);       out = ok(); break;

      case 'saveAgency':     saveAgency(data);             out = ok(); break;

      default: out = { success: false, error: 'Unknown action: ' + action };
    }
    return json(out);
  } catch (err) {
    return json({ success: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/* ------------------------------- reads ---------------------------------- */

function getAllData() {
  return {
    success: true,
    users:      readTab('users'),
    deliveries: readTab('deliveries'),
    returns:    readTab('returns'),
    products:   readTab('products'),
    groups:     readTab('groups'),
    payments:   readTab('payments'),
    expenses:   readTab('expenses'),
    agency:     readAgency()
  };
}

function readTab(name) {
  var sheet = getSheet(name);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return [];
  var hdr = getHeaders(sheet);
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var out = [];
  for (var r = 0; r < rows.length; r++) {
    var obj = {};
    var empty = true;
    for (var c = 0; c < hdr.length; c++) {
      var key = hdr[c];
      if (!key) continue;
      var val = rows[r][c];
      obj[key] = coerce(val);
      if (val !== '' && val !== null) empty = false;
    }
    if (!empty) out.push(obj);
  }
  return out;
}

function readAgency() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('agency');
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() === 0) return null;
  var lastCol = sheet.getLastColumn();
  var hdr = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  var vals = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
  var obj = {};
  for (var c = 0; c < hdr.length; c++) if (hdr[c]) obj[hdr[c]] = coerce(vals[c]);
  return obj;
}

/* ------------------------------- writes --------------------------------- */

function upsert(name, obj) {
  if (!obj) return;
  var sheet = getSheet(name);
  var keys = Object.keys(obj);
  if (keys.indexOf('id') === -1) keys = ['id'].concat(keys);
  var hdr = ensureColumns(sheet, keys);
  var rowIndex = rowForId(sheet, obj.id);
  if (rowIndex === -1) rowIndex = sheet.getLastRow() + 1;
  writeRow(sheet, rowIndex, obj, hdr);
}

function update(name, id, patch) {
  if (id === null) return;
  var sheet = getSheet(name);
  var rowIndex = rowForId(sheet, id);
  if (rowIndex === -1) {           // not found → insert
    patch = patch || {};
    patch.id = id;
    upsert(name, patch);
    return;
  }
  var hdr = getHeaders(sheet);
  var current = sheet.getRange(rowIndex, 1, 1, hdr.length).getValues()[0];
  var obj = {};
  for (var c = 0; c < hdr.length; c++) obj[hdr[c]] = coerce(current[c]);
  for (var k in patch) obj[k] = patch[k];
  hdr = ensureColumns(sheet, Object.keys(obj));
  writeRow(sheet, rowIndex, obj, hdr);
}

function remove(name, id) {
  if (id === null) return;
  var sheet = getSheet(name);
  var rowIndex = rowForId(sheet, id);
  if (rowIndex !== -1) sheet.deleteRow(rowIndex);
}

function saveAgency(obj) {
  if (!obj) return;
  var sheet = getSheet('agency');
  sheet.clear();
  var keys = Object.keys(obj);
  var vals = keys.map(function (k) { return serialize(obj[k]); });
  sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
  sheet.getRange(2, 1, 1, keys.length).setValues([vals]);
}

/* ------------------------------ helpers --------------------------------- */

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    // case-insensitive match against existing tabs before creating a new one
    var all = ss.getSheets();
    for (var i = 0; i < all.length; i++) {
      if (all[i].getName().toLowerCase() === name.toLowerCase()) return all[i];
    }
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function getHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
}

function ensureColumns(sheet, keys) {
  var hdr = getHeaders(sheet);
  var changed = false;
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] && hdr.indexOf(keys[i]) === -1) { hdr.push(keys[i]); changed = true; }
  }
  if (changed) sheet.getRange(1, 1, 1, hdr.length).setValues([hdr]);
  return hdr;
}

function rowForId(sheet, id) {
  var hdr = getHeaders(sheet);
  var idCol = hdr.indexOf('id');
  if (idCol === -1) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
  for (var r = 0; r < ids.length; r++) {
    if (String(ids[r][0]) === String(id)) return r + 2;
  }
  return -1;
}

function writeRow(sheet, rowIndex, obj, hdr) {
  var row = [];
  for (var c = 0; c < hdr.length; c++) row.push(serialize(obj[hdr[c]]));
  sheet.getRange(rowIndex, 1, 1, hdr.length).setValues([row]);
}

function serialize(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return val;
}

function coerce(val) {
  if (typeof val === 'string') {
    var t = val.trim();
    if (t.length && (t.charAt(0) === '[' || t.charAt(0) === '{')) {
      try { return JSON.parse(t); } catch (ignore) {}
    }
  }
  return val;
}

function ok() { return { success: true }; }

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
