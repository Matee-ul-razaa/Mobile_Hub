const xlsx = require('../frontend/node_modules/xlsx');
const path = '/Users/danishraza/Desktop/mobile_hub/Ledger_sheet_from_image_request-Genspark_AI_Sheets-20260504_0448.xlsx';

function inspect() {
  console.log('--- DETAILED GENSPARK EXCEL SHEET ---');
  try {
    const wb = xlsx.readFile(path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
    
    data.forEach((row, i) => {
      // Print row elements clearly, replacing empty items with empty string
      const cols = row.map(cell => cell === undefined || cell === null ? '' : String(cell));
      console.log(`Row ${i+1}: ${cols.join(' | ')}`);
    });
  } catch (err) {
    console.error('Error reading statement:', err.message);
  }
}

inspect();
