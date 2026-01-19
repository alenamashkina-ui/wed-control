export const formatDate = (dateStr) => { 
  if (!dateStr) return ''; 
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }); 
};

export const toInputDate = (dateStr) => { 
  if (!dateStr) return ''; 
  return new Date(dateStr).toISOString().split('T')[0]; 
};

export const getDaysUntil = (dateStr) => { 
  const diff = new Date(dateStr) - new Date(); 
  return Math.ceil(diff / (1000 * 60 * 60 * 24)); 
};

export const formatCurrency = (val) => { 
  if (val === undefined || val === null || val === '') return '0'; 
  return new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(val); 
};

export const downloadCSV = (data, filename) => { 
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + data.map(e => e.join(";")).join("\n"); 
  const encodedUri = encodeURI(csvContent); 
  const link = document.createElement("a"); 
  link.setAttribute("href", encodedUri); 
  link.setAttribute("download", filename); 
  document.body.appendChild(link); 
  link.click(); 
  document.body.removeChild(link); 
};
