const SHEET_NAME = 'Rezervacije';

function doPost(e) {
  const data = JSON.parse(e.postData.contents || '{}');
  const action = data.action;
  try {
    if (action === 'createReservation') return jsonResponse(createReservation(data));
    if (action === 'checkReservation') return jsonResponse(checkReservation(data));
    if (action === 'adminList') return jsonResponse(adminList());
    if (action === 'updateReservationStatus') return jsonResponse(updateReservationStatus(data));
    if (action === 'deleteReservation') return jsonResponse(deleteReservation(data));
    return jsonResponse({ ok: false, message: 'Непозната акција.' });
  } catch (err) {
    return jsonResponse({ ok: false, message: String(err) });
  }
}
function jsonResponse(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['ID', 'Шифра', 'Име', 'Телефон', 'Датум', 'Време', 'Број особа', 'Тип', 'Напомена', 'Статус', 'Креирано']);
  }
  return sheet;
}
function generateCode() { return 'ZEN-' + Math.floor(100000 + Math.random() * 900000); }
function createReservation(data) {
  const sheet = getSheet();
  const row = [String(new Date().getTime()), generateCode(), data.fullName || '', data.phone || '', data.date || '', data.time || '', data.players || '', data.tableType || '', data.note || '', 'на чекању', new Date().toISOString()];
  sheet.appendRow(row);
  return { ok: true, reservation: { id: row[0], code: row[1], fullName: row[2], phone: row[3], date: row[4], time: row[5], players: row[6], tableType: row[7], note: row[8], status: row[9], createdAt: row[10] } };
}
function sheetToObjects() {
  const values = getSheet().getDataRange().getValues();
  return values.slice(1).map(r => ({ id: r[0], code: r[1], fullName: r[2], phone: r[3], date: r[4], time: r[5], players: r[6], tableType: r[7], note: r[8], status: r[9], createdAt: r[10] }));
}
function checkReservation(data) {
  const item = sheetToObjects().find(r => r.code === data.code && String(r.phone) === String(data.phone));
  if (!item) return { ok: false, message: 'Резервација није пронађена.' };
  return { ok: true, reservation: item };
}
function adminList() {
  const items = sheetToObjects().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { ok: true, reservations: items };
}
function updateReservationStatus(data) {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][1] === data.code) {
      sheet.getRange(i + 1, 10).setValue(data.status || 'на чекању');
      break;
    }
  }
  return adminList();
}
function deleteReservation(data) {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  for (let i = values.length - 1; i >= 1; i--) {
    if (values[i][1] === data.code) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return adminList();
}
