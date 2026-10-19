// Paste this into your Google Sheet: Extensions > Apps Script. Then Deploy > New deployment > Web app
// (Execute as: Me, Who has access: Anyone). Copy the Web app URL into Vercel as APPS_SCRIPT_URL.
const SECRET = 'CHANGE_THIS_TO_A_LONG_RANDOM_TEXT'; // must be identical to ORDER_SECRET in Vercel

function doGet() { return out({ ok: true, msg: 'Order endpoint is running' }); }

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return out({ ok: false, error: 'unauthorized' });

    // Duplicate protection: same phone + device within 10 minutes => return the same order number
    const cache = CacheService.getScriptCache();
    const key = 'o_' + d.phone + '_' + d.device;
    const hit = cache.get(key);
    if (hit) return out({ ok: true, orderNumber: hit, duplicate: true });

    const props = PropertiesService.getScriptProperties();
    const n = Number(props.getProperty('counter') || 0) + 1;
    props.setProperty('counter', String(n));
    const orderNumber = 'ORD-' + String(n).padStart(4, '0');

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1, 1, 8).setNumberFormat('@');
    sheet.getRange(row, 1, 1, 8).setValues([[
      orderNumber, safe(d.device), safe(d.name), String(d.phone), safe(d.address),
      String(d.qty), String(d.delivery), String(d.total)
    ]]);
    cache.put(key, orderNumber, 600);
    return out({ ok: true, orderNumber: orderNumber });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
function safe(v) { v = String(v); return /^[=+\-@]/.test(v) ? "'" + v : v; } // blocks formula injection
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
