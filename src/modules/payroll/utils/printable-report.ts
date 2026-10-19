import { documentHeaderHtml } from '@payroll/utils/save-report-workbook';

export function escapeReportHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface PrintableSection {
  heading?: string;
  lines?: string[];
  rows: Array<Array<string | number | null | undefined>>;
  headerRowCount?: number;
}

export function openPrintableReport(options: {
  title: string;
  lines?: string[];
  sections: PrintableSection[];
}): boolean {
  const header = documentHeaderHtml({
    title: options.title,
    period: (options.lines ?? []).join(' · '),
  });
  const intro = (options.lines ?? [])
    .map((line) => `<p>${escapeReportHtml(line)}</p>`)
    .join('');
  const sections = options.sections.map((section) => {
    const heading = section.heading ? `<h2>${escapeReportHtml(section.heading)}</h2>` : '';
    const lines = (section.lines ?? [])
      .map((line) => `<p>${escapeReportHtml(line)}</p>`)
      .join('');
    const headerRowCount = section.headerRowCount ?? 1;
    const body = section.rows.map((row, index) => {
      const tag = index < headerRowCount ? 'th' : 'td';
      const cells = row.map((cell) => {
        const numeric = typeof cell === 'number';
        const text = cell == null ? '' : String(cell);
        return `<${tag}${numeric ? ' class="num"' : ''}>${escapeReportHtml(text)}</${tag}>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `${heading}${lines}<table><tbody>${body}</tbody></table>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeReportHtml(options.title)}</title>
  <style>
    @page { size: landscape; margin: 0.4in; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #222; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 16px 0 4px; }
    p { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th, td { border: 1px solid #bfbfbf; padding: 3px 4px; vertical-align: top; }
    th { background: #f3f3f3; }
    td.num, th.num { text-align: right; }
  </style>
</head>
<body>
  ${header}
  <h1>${escapeReportHtml(options.title)}</h1>
  ${intro}
  ${sections}
</body>
</html>`;

  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) {
    return false;
  }
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}
