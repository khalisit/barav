export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) return '0';
  const num = Number(value);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function parseKurdishNumbers(str: string): string {
  if (!str) return str;
  const easternNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.split(easternNumbers[i]).join(i.toString());
    result = result.split(persianNumbers[i]).join(i.toString());
  }
  return result;
}

export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  const num = value === null || value === undefined || isNaN(Number(value)) ? 0 : Number(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatCompactCurrency(value: number | null | undefined, currency = 'USD'): string {
  const num = value === null || value === undefined || isNaN(Number(value)) ? 0 : Number(value);
  if (num >= 1_000_000)
    return `${currency === 'USD' ? '$' : ''}${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)
    return `${currency === 'USD' ? '$' : ''}${(num / 1_000).toFixed(1)}K`;
  return formatCurrency(num, currency);
}

export function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const clean = dateStr.trim().replace(' ', 'T').replace('Z', '').split('.')[0];
  return new Date(clean);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  let d: Date;
  if (typeof date === 'string') {
    d = parseDate(date);
  } else {
    d = date;
  }
  if (isNaN(d.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  let d: Date;
  if (typeof date === 'string') {
    d = parseDate(date);
  } else {
    d = date;
  }
  if (isNaN(d.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? parseDate(date) : date;
  if (isNaN(d.getTime())) return 'N/A';
  const seconds = Math.floor(
    (Date.now() - d.getTime()) / 1000
  );
  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function exportToCsv(
  filename: string,
  rows: Record<string, unknown>[]
): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val === null || val === undefined ? '' : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\n');
  downloadFile(`${filename}.csv`, csvContent, 'text/csv');
}

export function exportToExcel(
  filename: string,
  rows: Record<string, unknown>[]
): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const xml = generateExcelXml(headers, rows);
  downloadFile(
    `${filename}.xls`,
    xml,
    'application/vnd.ms-excel'
  );
}

export function exportToPdf(
  filename: string,
  rows: Record<string, unknown>[],
  language: string,
  filters?: { startDate?: string; endDate?: string; type?: string }
): void {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const isKu = language === 'ku';

  // Calculate totals
  let revenueUsd = 0;
  let revenueIqd = 0;
  let expenseUsd = 0;
  let expenseIqd = 0;

  for (const row of rows) {
    const amt = Number(row.amount || 0);
    if (row.type === 'revenue') {
      if (row.currency === 'IQD') revenueIqd += amt;
      else revenueUsd += amt;
    } else {
      if (row.currency === 'IQD') expenseIqd += amt;
      else expenseUsd += amt;
    }
  }

  const netUsd = revenueUsd - expenseUsd;
  const netIqd = revenueIqd - expenseIqd;

  const rowsHtml = rows
    .map((row) => {
      const typeLabel = row.type === 'revenue'
        ? (isKu ? 'داهات' : 'Revenue')
        : (isKu ? 'خەرجی' : 'Expense');

      const typeColor = row.type === 'revenue' ? '#10b981' : '#ef4444';

      const amountVal = Number(row.amount || 0);
      const currencyStr = row.currency === 'IQD'
        ? (isKu ? 'د.ع' : 'IQD')
        : '$';

      const amountStr = row.currency === 'IQD'
        ? `${amountVal.toLocaleString()} ${currencyStr}`
        : `${currencyStr}${amountVal.toLocaleString()}`;

      const dateStr = row.date ? String(row.date) : '';
      const noteStr = row.note ? String(row.note) : '-';
      const categoryStr = row.category ? String(row.category) : '';
      const titleStr = row.title ? String(row.title) : '';

      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 12px; font-weight: 600; color: ${typeColor};">${typeLabel}</td>
          <td style="padding: 8px 12px; font-weight: 500;">${titleStr}</td>
          <td style="padding: 8px 12px; color: #64748b;">${categoryStr}</td>
          <td style="padding: 8px 12px; font-weight: 600; color: ${typeColor};">
            ${row.type === 'revenue' ? '+' : '-'}${amountStr}
          </td>
          <td style="padding: 8px 12px; color: #64748b;">${dateStr}</td>
          <td style="padding: 8px 12px; color: #64748b; font-size: 11px; max-width: 180px; word-wrap: break-word;">${noteStr}</td>
        </tr>
      `;
    })
    .join('');

  // Prepare active filters metadata html
  let filtersHtml = '';
  if (filters) {
    const typeText = filters.type === 'all'
      ? (isKu ? 'هەموو جۆرەکان' : 'All Transactions')
      : filters.type === 'revenue'
        ? (isKu ? 'تەنها داهات' : 'Revenue Only')
        : (isKu ? 'تەنها خەرجییەکان' : 'Expenses Only');

    const dateRangeText = filters.startDate || filters.endDate
      ? `${filters.startDate || '*'} ${isKu ? 'بۆ' : 'to'} ${filters.endDate || '*'}`
      : (isKu ? 'هەموو کاتێک' : 'All Time');

    filtersHtml = `
      <div class="meta-item" style="display: flex; gap: 8px; justify-content: ${isKu ? 'flex-start' : 'flex-end'}; flex-wrap: wrap; margin-top: 1px;">
        <span>${isKu ? 'جۆر:' : 'Type:'} <strong>${typeText}</strong></span>
        <span style="color: #cbd5e1;">|</span>
        <span>${isKu ? 'بەروار:' : 'Date:'} <strong>${dateRangeText}</strong></span>
      </div>
    `;
  }

  // Format currency helper for the summary
  const formatSum = (usd: number, iqd: number) => {
    const prefix = usd < 0 || iqd < 0 ? '-' : '';
    const absUsd = Math.abs(usd);
    const absIqd = Math.abs(iqd);
    return `$${absUsd.toLocaleString()} / ${absIqd.toLocaleString()} ${isKu ? 'د.ع' : 'IQD'}`;
  };

  const html = `
    <!DOCTYPE html>
    <html lang="${isKu ? 'ku' : 'en'}" dir="${isKu ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <title>${isKu ? 'ڕاپۆرتی داهات و خەرجییەکان' : 'Revenue & Expenses Report'}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'Outfit', system-ui, -apple-system, sans-serif;
          padding: 1.5cm 1.5cm 2cm 1.5cm;
          color: #0f172a;
          background-color: #ffffff;
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 8px;
          margin-bottom: 12px;
          margin-top:8px;
        }
        .logo-area {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .logo-img {
          width: 22px;
          height: 22px;
          border-radius: 4px;
          object-fit: cover;
        }
        .project-name {
          font-size: 14px;
          font-weight: 700;
          color: #1e3a8a;
          letter-spacing: -0.3px;
        }
        .report-info {
          text-align: ${isKu ? 'left' : 'right'};
        }
        .title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 3px;
        }
        .meta-item {
          font-size: 10px;
          color: #64748b;
          margin-top: 1px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 10px;
        }
        th {
          background-color: #f8fafc;
          padding: 6px 10px;
          text-align: center;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
          color: #475569;
          text-transform: uppercase;
          font-size: 9px;
          letter-spacing: 0.5px;
        }
        td {
          text-align: center;
        }
        @page {
          margin: 0;
        }
        .footer {
          position: fixed;
          bottom: 1cm;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 8px;
          color: #94a3b8;
          display: none;
        }
        @media print {
          body {
            counter-reset: page 0;
          }
          .footer {
            display: block;
          }
          .page-number::after {
            counter-increment: page 1;
            content: counter(page);
          }
        }
        .summary-title {
          font-size: 10px;
          font-weight: 700;
          margin-top: 15px;
          margin-bottom: 5px;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary-container {
          display: flex;
          gap: 8px;
          margin-top: 5px;
        }
        .summary-card {
          flex: 1;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background-color: #f8fafc;
        }
        .summary-card.revenue {
          background-color: #f0fdf4;
          border-color: #bbf7d0;
        }
        .summary-card.expense {
          background-color: #fef2f2;
          border-color: #fecaca;
        }
        .summary-card.net {
          background-color: #eff6ff;
          border-color: #bfdbfe;
        }
        .card-label {
          font-size: 8px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }
        .summary-card.revenue .card-label { color: #166534; }
        .summary-card.expense .card-label { color: #991b1b; }
        .summary-card.net .card-label { color: #1e40af; }
        
        .card-val {
          font-size: 10px;
          font-weight: 700;
          margin-top: 2px;
          color: #0f172a;
        }
        .summary-card.revenue .card-val { color: #15803d; }
        .summary-card.expense .card-val { color: #b91c1c; }
        .summary-card.net .card-val { color: #1d4ed8; }

        @media print {
          body {
            padding: 0;
          }
          .summary-card {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-area">
          <img class="logo-img" src="/logo.png" alt="Barav Quiz Logo" />
          <span class="project-name">Barav Quiz</span>
        </div>
        <div class="report-info">
          <div class="title">${isKu ? 'ڕاپۆرتی داهات و خەرجییەکان' : 'Revenue & Expenses Report'}</div>
          <div class="meta-item">
            <span>${isKu ? 'ڕێکەوتی چاپ:' : 'Print Date:'}</span> <strong>${new Date().toLocaleDateString(isKu ? 'ku-IQ' : 'en-US')}</strong>
          </div>
          ${filtersHtml}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>${isKu ? 'جۆر' : 'Type'}</th>
            <th>${isKu ? 'ناونیشان' : 'Title'}</th>
            <th>${isKu ? 'جۆری بابەت' : 'Category'}</th>
            <th>${isKu ? 'بڕ' : 'Amount'}</th>
            <th>${isKu ? 'ڕێکەوت' : 'Date'}</th>
            <th>${isKu ? 'تێبینی' : 'Note'}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="summary-title">${isKu ? 'کورتەی دارایی ڕاپۆرت' : 'Financial Summary'}</div>
      <div class="summary-container">
        <div class="summary-card revenue">
          <div class="card-label">${isKu ? 'کۆی داهات' : 'Total Revenue'}</div>
          <div class="card-val">${formatSum(revenueUsd, revenueIqd)}</div>
        </div>
        <div class="summary-card expense">
          <div class="card-label">${isKu ? 'کۆی خەرجییەکان' : 'Total Expenses'}</div>
          <div class="card-val">${formatSum(expenseUsd, expenseIqd)}</div>
        </div>
        <div class="summary-card net">
          <div class="card-label">${isKu ? 'هاوسەنگیی گشتی' : 'Net Balance'}</div>
          <div class="card-val">${formatSum(netUsd, netIqd)}</div>
        </div>
      </div>

      <div class="footer">
        <span class="page-number"></span>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }, 250);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

function generateExcelXml(
  headers: string[],
  rows: Record<string, unknown>[]
): string {
  const headerRow = `<Row>${headers
    .map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join('')}</Row>`;
  const dataRows = rows
    .map(
      (row) =>
        `<Row>${headers
          .map((h) => {
            const val = row[h];
            const isNum = typeof val === 'number';
            return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${isNum ? val : escapeXml(String(val ?? ''))
              }</Data></Cell>`;
          })
          .join('')}</Row>`
    )
    .join('');
  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Sheet1"><Table>${headerRow}${dataRows}</Table></Worksheet>
</Workbook>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadFile(
  filename: string,
  content: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
