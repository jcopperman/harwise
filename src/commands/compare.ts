import { readFileSync, writeFileSync } from 'fs';
import { parseHar, ApiSample } from '../har.js';
import { generateHtmlReport, ReportData } from '../report-html.js';

export interface ComparisonResult {
  endpoint: string;
  status_old: number;
  status_new: number;
  time_old: number;
  time_new: number;
  size_old: number;
  size_new: number;
  delta_pct: number;
  regression: boolean;
}

export function compareCommand(baselineHar: string, newHar: string, options: any) {
  try {
    // Parse HAR files
    const baselineContent = readFileSync(baselineHar, 'utf-8');
    const baselineHarData = JSON.parse(baselineContent);
    const baselineSamples = parseHar(baselineHarData, options);

    const newContent = readFileSync(newHar, 'utf-8');
    const newHarData = JSON.parse(newContent);
    const newSamples = parseHar(newHarData, options);

    // Create lookup maps by key
    const baselineMap = new Map<string, ApiSample>();
    baselineSamples.forEach(sample => {
      baselineMap.set(sample.key, sample);
    });

    const newMap = new Map<string, ApiSample>();
    newSamples.forEach(sample => {
      newMap.set(sample.key, sample);
    });

    // Compare samples
    const results: ComparisonResult[] = [];
    let hasRegression = false;

    // Check all baseline samples
    for (const [key, baselineSample] of baselineMap) {
      const newSample = newMap.get(key);

      if (!newSample) {
        // Endpoint missing in new HAR
        results.push({
          endpoint: key,
          status_old: baselineSample.status,
          status_new: 0,
          time_old: baselineSample.time,
          time_new: 0,
          size_old: baselineSample.size,
          size_new: 0,
          delta_pct: -100,
          regression: true
        });
        hasRegression = true;
        continue;
      }

      const timeThreshold = parseFloat(options.timeRegress || '10') / 100;
      const sizeThreshold = parseFloat(options.sizeRegress || '15') / 100;

      const timeRegression = newSample.time > baselineSample.time * (1 + timeThreshold);
      const sizeRegression = newSample.size > baselineSample.size * (1 + sizeThreshold);
      const statusRegression = newSample.status !== baselineSample.status;

      const regression = timeRegression || sizeRegression || statusRegression;
      if (regression) hasRegression = true;

      const delta_pct = baselineSample.time > 0 ?
        ((newSample.time - baselineSample.time) / baselineSample.time) * 100 : 0;

      results.push({
        endpoint: key,
        status_old: baselineSample.status,
        status_new: newSample.status,
        time_old: baselineSample.time,
        time_new: newSample.time,
        size_old: baselineSample.size,
        size_new: newSample.size,
        delta_pct,
        regression
      });
    }

    // Check for new endpoints in new HAR
    for (const [key, newSample] of newMap) {
      if (!baselineMap.has(key)) {
        results.push({
          endpoint: key,
          status_old: 0,
          status_new: newSample.status,
          time_old: 0,
          time_new: newSample.time,
          size_old: 0,
          size_new: newSample.size,
          delta_pct: 100,
          regression: false // New endpoints are not regressions
        });
      }
    }

    // Generate output
    if (options.out) {
      const markdown = generateMarkdownReport(results, baselineHar, newHar, options);
      writeFileSync(options.out, markdown);
      console.log(`Comparison report saved to ${options.out}`);
    } else {
      console.log(generateMarkdownReport(results, baselineHar, newHar, options));
    }

    // Generate HTML report if requested
    if (options.report) {
      const htmlData: ReportData = {
        meta: {
          tag: options.tag || 'comparison',
          when: new Date().toISOString(),
          environment: 'comparison'
        },
        summary: {
          total: results.length,
          passed: results.filter(r => !r.regression).length,
          failed: results.filter(r => r.regression).length,
          p50: 0, // Not applicable for comparison
          p95: 0
        },
        cases: [], // Not applicable for comparison
        perfDiff: results
      };

      const html = generateHtmlReport(htmlData);
      writeFileSync(options.report, html);
      console.log(`HTML comparison report saved to ${options.report}`);
    }

    // Exit with appropriate code
    if (hasRegression) {
      console.log('\n⚠️  Regressions detected!');
      process.exit(2);
    } else {
      console.log('\n✅ No regressions detected.');
      process.exit(0);
    }

  } catch (error) {
    console.error('Error comparing HAR files:', error);
    process.exit(3);
  }
}

function generateMarkdownReport(results: ComparisonResult[], baselineHar: string, newHar: string, options: any): string {
  const regressions = results.filter(r => r.regression);
  const timeRegress = options.timeRegress || '10';
  const sizeRegress = options.sizeRegress || '15';

  let markdown = `# HAR Comparison Report

**Baseline:** ${baselineHar}
**New:** ${newHar}
**Time Regression Threshold:** ${timeRegress}%
**Size Regression Threshold:** ${sizeRegress}%

## Summary

- **Total Endpoints:** ${results.length}
- **Regressions:** ${regressions.length}
- **Clean:** ${results.length - regressions.length}

## Results

| Endpoint | Status | Time (ms) | Size (bytes) | Δ% | Regression |
|----------|--------|-----------|--------------|----|------------|
`;

  results.forEach(result => {
    const status = result.status_old === result.status_new ?
      `${result.status_old}` :
      `${result.status_old} → ${result.status_new}`;

    const time = result.time_old === result.time_new ?
      `${result.time_old}` :
      `${result.time_old} → ${result.time_new}`;

    const size = result.size_old === result.size_new ?
      `${result.size_old}` :
      `${result.size_old} → ${result.size_new}`;

    const delta = result.delta_pct === 0 ?
      '-' :
      `${result.delta_pct > 0 ? '+' : ''}${result.delta_pct.toFixed(1)}%`;

    markdown += `| ${result.endpoint} | ${status} | ${time} | ${size} | ${delta} | ${result.regression ? '⚠️' : '✅'} |\n`;
  });

  if (regressions.length > 0) {
    markdown += '\n## Regressions\n\n';
    regressions.forEach(r => {
      markdown += `- **${r.endpoint}**: ${r.delta_pct > 0 ? '+' : ''}${r.delta_pct.toFixed(1)}% change\n`;
    });
  }

  return markdown;
}