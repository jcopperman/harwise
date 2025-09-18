import { TestResult } from './runner/index.js';

export interface ReportData {
  meta: {
    tag?: string;
    when: string;
    environment?: string;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    p50: number;
    p95: number;
  };
  cases: Array<{
    name: string;
    status: 'pass' | 'fail';
    time: number;
    assertions: number;
    error?: string;
  }>;
  perfDiff?: Array<{
    endpoint: string;
    status_old: number;
    status_new: number;
    time_old: number;
    time_new: number;
    size_old: number;
    size_new: number;
    delta_pct: number;
    regression: boolean;
  }>;
}

export function generateHtmlReport(data: ReportData): string {
  const { meta, summary, cases, perfDiff } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harwise Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .tile { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .tile h3 { font-size: 2em; margin-bottom: 5px; }
        .tile p { color: #666; }
        .tile.pass { border-left: 4px solid #28a745; }
        .tile.fail { border-left: 4px solid #dc3545; }
        .tile.time { border-left: 4px solid #007bff; }
        table { width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; font-weight: 600; cursor: pointer; }
        th:hover { background: #e9ecef; }
        tr:hover { background: #f8f9fa; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 0.9em; font-weight: 500; }
        .status.pass { background: #d4edda; color: #155724; }
        .status.fail { background: #f8d7da; color: #721c24; }
        .sparkline { width: 100px; height: 20px; }
        .error { color: #dc3545; font-size: 0.9em; }
        .compare-section { margin-top: 40px; }
        .regression { background: #fff3cd; }
        .regression td { border-left: 4px solid #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Harwise Test Report</h1>
            <p><strong>Tag:</strong> ${meta.tag || 'N/A'} | <strong>Date:</strong> ${new Date(meta.when).toLocaleString()} | <strong>Environment:</strong> ${meta.environment || 'N/A'}</p>
        </div>

        <div class="summary">
            <div class="tile tile-pass">
                <h3>${summary.passed}</h3>
                <p>Passed</p>
            </div>
            <div class="tile tile-fail">
                <h3>${summary.failed}</h3>
                <p>Failed</p>
            </div>
            <div class="tile tile-time">
                <h3>${summary.p50}ms</h3>
                <p>P50 Latency</p>
            </div>
            <div class="tile tile-time">
                <h3>${summary.p95}ms</h3>
                <p>P95 Latency</p>
            </div>
        </div>

        <table id="results-table">
            <thead>
                <tr>
                    <th onclick="sortTable(0)">Test Name</th>
                    <th onclick="sortTable(1)">Status</th>
                    <th onclick="sortTable(2)">Time (ms)</th>
                    <th onclick="sortTable(3)">Assertions</th>
                    <th>Error</th>
                </tr>
            </thead>
            <tbody>
                ${cases.map(test => `
                    <tr>
                        <td>${test.name}</td>
                        <td><span class="status ${test.status}">${test.status.toUpperCase()}</span></td>
                        <td>${test.time}</td>
                        <td>${test.assertions}</td>
                        <td class="error">${test.error || ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        ${perfDiff ? `
        <div class="compare-section">
            <h2>Performance Comparison</h2>
            <table>
                <thead>
                    <tr>
                        <th>Endpoint</th>
                        <th>Status</th>
                        <th>Time (ms)</th>
                        <th>Size (bytes)</th>
                        <th>Δ%</th>
                    </tr>
                </thead>
                <tbody>
                    ${perfDiff.map(diff => `
                        <tr class="${diff.regression ? 'regression' : ''}">
                            <td>${diff.endpoint}</td>
                            <td>${diff.status_old} → ${diff.status_new}</td>
                            <td>${diff.time_old} → ${diff.time_new}</td>
                            <td>${diff.size_old} → ${diff.size_new}</td>
                            <td>${diff.delta_pct > 0 ? '+' : ''}${diff.delta_pct.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div style="margin-top: 20px; text-align: center; color: #666; font-size: 0.9em;">
            Generated by harwise v0.2.0
        </div>
    </div>

    <script>
        const reportData = ${JSON.stringify(data)};

        function sortTable(column) {
            const table = document.getElementById('results-table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));

            rows.sort((a, b) => {
                const aVal = a.cells[column].textContent.trim();
                const bVal = b.cells[column].textContent.trim();

                if (column === 2 || column === 3) { // Time and Assertions columns
                    return parseFloat(aVal) - parseFloat(bVal);
                }

                return aVal.localeCompare(bVal);
            });

            rows.forEach(row => tbody.appendChild(row));
        }

        // Add sparkline visualization (simplified)
        function createSparkline(data, width, height) {
            if (!data || data.length === 0) return '';

            const max = Math.max(...data);
            const min = Math.min(...data);
            const range = max - min || 1;

            const points = data.map((val, i) => {
                const x = (i / (data.length - 1)) * width;
                const y = height - ((val - min) / range) * height;
                return \`\${x},\${y}\`;
            }).join(' ');

            return \`<svg class="sparkline" viewBox="0 0 \${width} \${height}">
                <polyline fill="none" stroke="#007bff" stroke-width="2" points="\${points}" />
            </svg>\`;
        }
    </script>
</body>
</html>`;
}