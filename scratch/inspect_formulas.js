const xlsx = require('../frontend/node_modules/xlsx');
const path = '/Users/danishraza/Desktop/mobile_hub/Ledger_sheet_from_image_request-Genspark_AI_Sheets-20260504_0448.xlsx';

function inspectFormulas() {
  const wb = xlsx.readFile(path, { cellFormula: true, cellHTML: false, cellText: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  
  console.log('--- CELL VALUES AND FORMULAS ---');
  for (let key in ws) {
    if (key[0] === '!') continue;
    const cell = ws[key];
    if (cell.f || cell.v !== undefined) {
      console.log(`${key}: Val = ${cell.v}, Formula = ${cell.f || 'none'}`);
    }
  }
}

inspectFormulas();
