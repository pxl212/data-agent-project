/**
 * Export data rows to CSV and trigger download
 * @param {string[]} columns
 * @param {Object[]} rows
 * @param {string} filename
 */
export function exportCSV(columns, rows, filename = 'data_export.csv') {
  const header = columns.join(',')
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const val = row[col] ?? ''
          // Escape quotes and wrap in quotes if contains comma/quote/newline
          const str = String(val)
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(',')
    )
    .join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + header + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Copy table data to clipboard as TSV (pasteable to Excel)
 * @param {string[]} columns
 * @param {Object[]} rows
 */
export async function copyToClipboard(columns, rows) {
  const header = columns.join('\t')
  const body = rows.map((row) => columns.map((col) => row[col] ?? '').join('\t')).join('\n')
  await navigator.clipboard.writeText(header + '\n' + body)
}
