import { TestRunner } from '../runner/index.js';

export function testCommand(options: any) {
  const runner = new TestRunner();

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
        process.exit(1);
      }

      // TODO: Generate HTML report if --report is specified
      if (options.report) {
        console.log(`\nHTML report would be generated at: ${options.report}`);
      }
    })
    .catch(error => {
      console.error('Error running tests:', error);
      process.exit(1);
    });
}