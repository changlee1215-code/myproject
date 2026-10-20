const fs = require('fs');

let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(/import \{ ArrowUp(.*?) \} from 'lucide-react';/, "import { ArrowUp$1 } from 'lucide-react';\nimport html2canvas from 'html2canvas';");

// Fix bg-white without dark mode (multiple places)
code = code.replace(/bg-white p-4 rounded-xl shadow-sm border border-gray-100/g, 'bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700');
code = code.replace(/bg-white p-6 rounded-xl shadow-sm border border-gray-100/g, 'bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700');

// Fix text colors in headers
code = code.replace(/text-gray-900/g, 'text-gray-900 dark:text-white');
code = code.replace(/dark:text-white dark:text-white/g, 'dark:text-white');

// Recharts colors
code = code.replace(/stroke="#f3f4f6"/g, 'stroke="var(--chart-grid)"');
code = code.replace(/fill: '#6b7280'/g, "fill: 'var(--chart-text)'");
code = code.replace(/fill: '#374151'/g, "fill: 'var(--chart-text)'");
code = code.replace(/cursor=\{\{ fill: '#f3f4f6' \}\}/g, "cursor={{ fill: 'var(--chart-grid)' }}");

// Tooltip contentStyle
code = code.replace(/contentStyle=\{\{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb\(0 0 0 \/ 0.1\)' \}\}/g, "contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--chart-bg)', color: 'var(--chart-tooltip-text)' }}");
code = code.replace(/labelStyle=\{\{ color: '#374151', fontWeight: 'bold', marginBottom: '4px' \}\}/g, "labelStyle={{ color: 'var(--chart-tooltip-text)', fontWeight: 'bold', marginBottom: '4px' }}");

// Add PNG Export
code = code.replace(/<div className="h-72">/, '<div id="trend-chart-container" className="h-72 bg-white dark:bg-gray-800 pt-2 pb-2 pl-2 pr-2">');
code = code.replace(/<div className="flex bg-gray-100 rounded-lg p-1">/g, 
  '<div className="flex gap-2"><button onClick={() => { const el = document.getElementById(\'trend-chart-container\'); if(el) html2canvas(el, { backgroundColor: null }).then(c => { const a = document.createElement(\'a\'); a.href = c.toDataURL(); a.download=\'chart.png\'; a.click(); }) }} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"><Download className="w-4 h-4"/> 내보내기</button><div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">');

fs.writeFileSync('src/pages/Dashboard.tsx', code);

// Now Layout.tsx footer dark mode
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
layout = layout.replace(/<footer className="bg-white border-t border-gray-200 py-8">/, '<footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 transition-colors duration-200">');
layout = layout.replace(/text-gray-500 text-sm/g, 'text-gray-500 dark:text-gray-400 text-sm');
fs.writeFileSync('src/components/Layout.tsx', layout);
