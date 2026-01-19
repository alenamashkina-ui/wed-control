import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { MoneyInput, AutoHeightTextarea } from '../ui/Forms';
import { DownloadMenu } from '../ui/DownloadMenu';
import { formatCurrency } from '../../utils';

export const BudgetView = ({ expenses, updateProject, downloadCSV }) => {
  const totals = expenses.reduce((acc, item) => ({ plan: acc.plan + Number(item.plan), fact: acc.fact + Number(item.fact), paid: acc.paid + Number(item.paid) }), { plan: 0, fact: 0, paid: 0 });
  const updateExpense = (index, field, val) => { const newExpenses = [...expenses]; newExpenses[index][field] = val; updateProject('expenses', newExpenses); };
  const addExpense = () => updateProject('expenses', [...expenses, { category: 'Новое', name: 'Новая статья', plan: 0, fact: 0, paid: 0, note: '' }]);
  const removeExpense = (index) => { const newExpenses = [...expenses]; newExpenses.splice(index, 1); updateProject('expenses', newExpenses); };
  const handleExport = (type) => { if (type === 'pdf') window.print(); else downloadCSV([["Наименование", "План", "Факт", "Внесено", "Остаток", "Комментарий"], ...expenses.map(e => [e.name, e.plan, e.fact, e.paid, e.fact - e.paid, e.note || '']), ["ИТОГО", totals.plan, totals.fact, totals.paid, totals.fact - totals.paid, ""]], "budget.csv"); };
  
  return ( 
    <div className="animate-fadeIn pb-24 md:pb-0">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:hidden">
        {['План', 'Факт', 'Внесено', 'Остаток'].map((label, i) => (
          <Card key={label} className={`p-4 md:p-6 text-center ${i===3 ? 'bg-[#414942] text-white' : ''}`}>
            <p className={`${i===3 ? 'text-white/60' : 'text-[#AC8A69]'} text-[10px] md:text-xs uppercase tracking-widest mb-2`}>{label}</p>
            <p className={`text-lg md:text-2xl font-medium ${i===3 ? 'text-white' : i===2 ? 'text-[#936142]' : 'text-[#414942]'}`}>
              {formatCurrency(i===0?totals.plan:i===1?totals.fact:i===2?totals.paid:totals.fact-totals.paid)}
            </p>
          </Card>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-[#EBE5E0] overflow-hidden print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px] print:min-w-0">
            <thead>
              <tr className="bg-[#F9F7F5] text-[#936142] text-xs md:text-sm uppercase tracking-wider print:bg-transparent print:border-b print:border-[#414942]">
                <th className="p-2 md:p-4 font-semibold w-[200px] min-w-[200px]">Статья</th>
                <th className="p-2 md:p-4 font-semibold w-[120px] min-w-[120px]">План</th>
                <th className="p-2 md:p-4 font-semibold w-[120px] min-w-[120px]">Факт</th>
                <th className="p-2 md:p-4 font-semibold w-[120px] min-w-[120px]">Внесено</th>
                <th className="p-2 md:p-4 font-semibold w-[120px] min-w-[120px]">Остаток</th>
                <th className="p-2 md:p-4 font-semibold w-[200px] min-w-[200px]">Комментарии</th>
                <th className="p-2 md:p-4 font-semibold w-10 print:hidden"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE5E0] print:divide-[#CCBBA9]">
              {expenses.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#F9F7F5]/50 group print:break-inside-avoid">
                  <td className="p-2 md:p-4 align-top"><AutoHeightTextarea className="w-full bg-transparent outline-none font-medium text-[#414942] text-sm md:text-base whitespace-normal min-h-[1.5rem]" value={item.name} onChange={(e) => updateExpense(idx, 'name', e.target.value)} /></td>
                  <td className="p-2 md:p-4 align-top"><MoneyInput value={item.plan} onChange={(val) => updateExpense(idx, 'plan', val)} className="w-full text-[#414942] text-sm md:text-base" /></td>
                  <td className="p-2 md:p-4 align-top"><MoneyInput value={item.fact} onChange={(val) => updateExpense(idx, 'fact', val)} className="w-full text-[#414942] text-sm md:text-base" /></td>
                  <td className="p-2 md:p-4 align-top"><MoneyInput value={item.paid} onChange={(val) => updateExpense(idx, 'paid', val)} className="w-full text-[#414942] text-sm md:text-base" /></td>
                  <td className="p-2 md:p-4 align-top text-[#AC8A69] text-sm md:text-base">{formatCurrency(item.fact - item.paid)}</td>
                  <td className="p-2 md:p-4 align-top"><AutoHeightTextarea className="w-full bg-transparent outline-none text-xs text-[#AC8A69] placeholder-[#CCBBA9] min-h-[1.5rem]" placeholder="..." value={item.note || ''} onChange={(e) => updateExpense(idx, 'note', e.target.value)} /></td>
                  <td className="p-2 md:p-4 align-top print:hidden">
                    <button onClick={() => removeExpense(idx)} className="text-red-300 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-6 print:hidden">
        <Button onClick={addExpense} variant="primary"><Plus size={18}/> Добавить статью</Button>
        <DownloadMenu onSelect={handleExport} />
      </div>
    </div> 
  );
};