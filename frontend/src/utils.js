export const fmtKRW = n => '₩' + (Number(n)||0).toLocaleString('en-US', {maximumFractionDigits:0});
export const fmtNum = n => (Number(n)||0).toLocaleString('en-US', {maximumFractionDigits:0});
export const todayISO = () => new Date().toISOString().slice(0,10);
export const ym = d => (d||todayISO()).slice(0,7);
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

export function chartColors(){
  const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return {
    text: dark ? '#d1d5db' : '#4b5563',
    grid: dark ? '#374151' : '#e5e7eb',
    palette: ['#1e40af','#047857','#b45309','#6d28d9','#0f766e','#b91c1c','#db2777','#0891b2']
  };
}
