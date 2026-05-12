const xlsx = require('../frontend/node_modules/xlsx');
const path = '/Users/danishraza/Desktop/mobile_hub/MobileHub_Statement_2000-01-01_to_2026-05-12 (1).xlsx';

function inspect() {
  console.log('--- MANUAL ENTRIES ---');
  try {
    const wb = xlsx.readFile(path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws);
    
    const manualOut = data.filter(r => r['Category (Origin)'] === 'Manual' && r['Type'] === 'WITHDRAWAL');
    const manualIn = data.filter(r => r['Category (Origin)'] === 'Manual' && r['Type'] === 'DEPOSIT');
    
    console.log('--- MANUAL WITHDRAWALS (CASH OUT) ---');
    manualOut.forEach((row, i) => {
      console.log(`${i+1}. Date: ${row['Date']} | Amount: ${row['Amount (KRW)'].toLocaleString()} | Source: ${row['Source / Detail']} | Note: ${row['Note'] || 'none'}`);
    });

    console.log('\n--- MANUAL DEPOSITS (CASH IN) ---');
    manualIn.forEach((row, i) => {
      console.log(`${i+1}. Date: ${row['Date']} | Amount: ${row['Amount (KRW)'].toLocaleString()} | Source: ${row['Source / Detail']} | Note: ${row['Note'] || 'none'}`);
    });
    
  } catch (err) {
    console.error('Error reading statement:', err.message);
  }
}

inspect();
