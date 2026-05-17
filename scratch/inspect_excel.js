const xlsx = require('../frontend/node_modules/xlsx');
const path = '/Users/danishraza/Desktop/mobile_hub/MobileHub_Statement_2000-01-01_to_2026-05-12 (1).xlsx';

function listFaziCash() {
  const wb = xlsx.readFile(path);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws);

  const faziCash = data.filter(r => r['Category (Origin)'] === 'Fazi Cash');

  console.log('--- ALL FAZI CASH ENTRIES ---');
  console.log(`Total entries: ${faziCash.length}\n`);

  let grandTotal = 0;
  faziCash.forEach((row, i) => {
    const amount = Number(row['Amount (KRW)']) || 0;
    grandTotal += amount;
    console.log(`${i + 1}. Date: ${row['Date']} | Amount: ₩${amount.toLocaleString()} | Source: ${row['Source / Detail']} | Note: ${row['Note'] || '-'}`);
  });

  console.log(`\n--- GRAND TOTAL FAZI CASH: ₩${grandTotal.toLocaleString()} ---`);
}

listFaziCash();
