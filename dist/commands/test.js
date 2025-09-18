import { TestRunner } from '../runner/index.js';
import { generateHtmlReport } from '../report-html.js';
import { writeFileSync } from 'fs';
export function testCommand(options) {
    const runner = new TestRunner(options.env);
    runner.runTests(options.tests || 'tests')
        .then(results => {
        const summary = runner.getSummary();
        console.log(`Test Results:`);
        console.log(`Total: ${summary.total}`);
        console.log(`Passed: ${summary.passed}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`Total Time: ${summary.totalTime}ms`);
        console.log(`Average Time: ${summary.avgTime}ms`);
        console.log(`P50: ${summary.p50}ms`);
        console.log(`P95: ${summary.p95}ms`);
        if (summary.failed > 0) {
            console.log('\nFailed tests:');
            results.filter(r => r.status === 'fail').forEach(result => {
                console.log(`- ${result.name}: ${result.error}`);
            });
        }
        // Generate HTML report if --report is specified
        if (options.report) {
            const reportData = {
                meta: {
                    tag: options.tag || process.env.CI_COMMIT_TAG || 'local',
                    when: new Date().toISOString(),
                    environment: options.env || 'test'
                },
                summary: {
                    total: summary.total,
                    passed: summary.passed,
                    failed: summary.failed,
                    p50: summary.p50,
                    p95: summary.p95
                },
                cases: results.map(r => ({
                    name: r.name,
                    status: r.status,
                    time: r.time,
                    assertions: r.assertions,
                    error: r.error
                }))
            };
            const html = generateHtmlReport(reportData);
            writeFileSync(options.report, html);
            console.log(`\nHTML report generated: ${options.report}`);
        }
        if (summary.failed > 0) {
            process.exit(1);
        }
    })
        .catch(error => {
        console.error('Error running tests:', error);
        process.exit(1);
    });
}
