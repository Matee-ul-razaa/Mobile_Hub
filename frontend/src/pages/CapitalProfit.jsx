import React from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, ym, chartColors } from '../utils';
import { Bar, Doughnut } from 'react-chartjs-2';

const CapitalProfit = () => {
  const { data } = useData();

  // Calculations
  const ownerCap = data.ownerInvestment.reduce((a,x) => a + (x.amount||0), 0);
  const investorCap = data.investors.reduce((a,x) => a + (x.capital||0), 0);
  const totalCapital = ownerCap + investorCap;

  const salesRev = data.sales.reduce((a,x) => a + x.qty * x.pricePerUnit, 0);
  const salesCOGS = data.sales.reduce((a,x) => {
    const item = data.inventory.find(i => i.model===x.model);
    return a + x.qty * (item ? item.costPerUnit : 0);
  }, 0);
  const grossProfit = salesRev - salesCOGS;
  const totalExp = data.expenses.reduce((a,x) => a + x.amount, 0);
  const netProfit = grossProfit - totalExp;

  const totalPaid = data.payouts.reduce((a,x) => a + (x.amount||0), 0);
  const businessValue = totalCapital + netProfit - totalPaid;

  const cTheme = chartColors();
  
  const capData = {
    labels: ['My Capital', 'Investor Capital'],
    datasets: [{
      data: [ownerCap, investorCap],
      backgroundColor: ['#6d28d9', '#1e40af']
    }]
  };

  const profitGrowth = {
    labels: ['Rev', 'COGS', 'Gross', 'Exp', 'Net'],
    datasets: [{
      label: 'Financials (KRW)',
      data: [salesRev, salesCOGS, grossProfit, totalExp, netProfit],
      backgroundColor: ['#1e40af', '#6b7280', '#047857', '#b91c1c', '#0f766e']
    }]
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total Working Capital</div><div className="kpi-value">{fmtKRW(totalCapital)}</div>
          <div className="kpi-sub">My Investment + All Investors</div></div>
        <div className="kpi"><div className="kpi-label">Net Profit (Lifetime)</div><div className={`kpi-value ${netProfit>=0?'pos':'neg'}`}>{fmtKRW(netProfit)}</div>
          <div className="kpi-sub">Gross Profit − Expenses</div></div>
        <div className="kpi"><div className="kpi-label">Total Payouts</div><div className="kpi-value neg">{fmtKRW(totalPaid)}</div>
          <div className="kpi-sub">Profit split shared with investors</div></div>
        <div className="kpi"><div className="kpi-label">Current Net Worth</div><div className="kpi-value brand">{fmtKRW(businessValue)}</div>
          <div className="kpi-sub">Capital + Profit − Payouts</div></div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Capital Distribution</h3></div>
          <div className="chart-box" style={{height:'300px'}}>
            <Doughnut data={capData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Profit Breakdown (Lifetime)</h3></div>
          <div className="chart-box" style={{height:'300px'}}>
            <Bar data={profitGrowth} options={{ 
              responsive: true, maintainAspectRatio: false, 
              scales: { y: { ticks: { callback: v => '₩'+(v/1e6).toFixed(1)+'M' } } } 
            }} />
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:'14px'}}>
        <div className="card-header"><h3 className="card-title">Investment Summary</h3></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Source</th><th className="num">Initial Capital</th><th className="num">Share %</th><th className="num">Paid (Returns)</th></tr></thead>
            <tbody>
              <tr>
                <td><strong>Owner (Me)</strong></td>
                <td className="num">{fmtKRW(ownerCap)}</td>
                <td className="num">{totalCapital?((ownerCap/totalCapital)*100).toFixed(1):0}%</td>
                <td className="num">—</td>
              </tr>
              {data.investors.map(i => {
                const paid = data.payouts.filter(p => p.investorId===i._id).reduce((a,x) => a+(+x.amount||0), 0);
                return (
                  <tr key={i._id}>
                    <td>{i.name}</td>
                    <td className="num">{fmtKRW(i.capital)}</td>
                    <td className="num">{totalCapital?((i.capital/totalCapital)*100).toFixed(1):0}%</td>
                    <td className="num text-green">{fmtKRW(paid)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
export default CapitalProfit;
