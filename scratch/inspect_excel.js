const xlsx = require('../frontend/node_modules/xlsx');

const statementPath = '/Users/danishraza/Desktop/mobile_hub/MobileHub_Statement_2000-01-01_to_2026-05-12.xlsx';
const inventoryPath = '/Users/danishraza/Desktop/mobile_hub/inventory-export-2026-05-12.xlsx';

function inspect() {
  console.log('--- CASHFLOW STATEMENT ---');
  try {
    const wb = xlsx.readFile(statementPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws);
    
    let totalIn = 0;
    let totalOut = 0;
    
    // Calculate sums by origin
    const sumsByOrigin = {};
    
    data.forEach(row => {
      const type = row['Type'];
      const origin = row['Category (Origin)'];
      const amount = Number(row['Amount (KRW)']) || 0;
      
      if (!sumsByOrigin[origin]) sumsByOrigin[origin] = { in: 0, out: 0 };
      
      if (type === 'DEPOSIT') {
        totalIn += amount;
        sumsByOrigin[origin].in += amount;
      } else {
        totalOut += amount;
        sumsByOrigin[origin].out += amount;
      }
    });
    
    console.log('Total IN:', totalIn.toLocaleString());
    console.log('Total OUT:', totalOut.toLocaleString());
    console.log('NET:', (totalIn - totalOut).toLocaleString());
    
    console.log('\nBreakdown by Origin:');
    for (const [origin, sums] of Object.entries(sumsByOrigin)) {
      console.log(`- ${origin}: IN=${sums.in.toLocaleString()}, OUT=${sums.out.toLocaleString()}, NET=${(sums.in - sums.out).toLocaleString()}`);
    }
  } catch (err) {
    console.error('Error reading statement:', err.message);
  }

  console.log('\n--- INVENTORY ---');
  try {
    const wb = xlsx.readFile(inventoryPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws);
    
    let totalCost = 0;
    let inStockCost = 0;
    
    data.forEach(row => {
      // Find cost column (could be Purchase Price (KRW) or similar)
      const costKey = Object.keys(row).find(k => k.toLowerCase().includes('purchase') || k.toLowerCase().includes('cost'));
      const statusKey = Object.keys(row).find(k => k.toLowerCase().includes('status'));
      
      const cost = costKey ? (Number(row[costKey]) || 0) : 0;
      const status = statusKey ? row[statusKey] : '';
      
      totalCost += cost;
      if (status === 'In Stock') {
        inStockCost += cost;
      }
    });
    
    console.log(`Total Cost of ALL Inventory: ${totalCost.toLocaleString()}`);
    console.log(`Total Cost of IN STOCK Inventory: ${inStockCost.toLocaleString()}`);
    
  } catch (err) {
    console.error('Error reading inventory:', err.message);
  }
}

inspect();
