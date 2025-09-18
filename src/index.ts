#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { statsCommand } from './commands/stats.js';
import { compareCommand } from './commands/compare.js';
import { testCommand } from './commands/test.js';
import { parseHar } from './har.js';
import { generateInsomniaCollection } from './insomnia.js';
import { generateTests } from './tests-gen.js';
import { generateCurlSuite } from './curl-gen.js';

const program = new Command();

program
  .name('harwise')
  .description('CLI tool for processing HAR files')
  .version('0.2.0');

program
  .command('stats <harFile>')
  .description('quick summary of HAR file')
  .action(statsCommand);

program
  .command('compare <baselineHar> <newHar>')
  .description('compare two HARs for regressions')
  .option('--time-regress <pct>', 'fail threshold for latency regression', '10')
  .option('--size-regress <pct>', 'fail threshold for size regression', '15')
  .option('--out <file>', 'output file for report')
  .option('--report <file>', 'HTML report output')
  .option('--tag <label>', 'tag for reports')
  .action(compareCommand);

const gen = program.command('gen');

gen
  .command('insomnia <harFile>')
  .description('generate Insomnia collection')
  .option('--out <file>', 'output file')
  .option('--env <file>', 'environment file')
  .action((harFile, options) => {
    try {
      const globalOptions = program.opts();
      const harContent = readFileSync(harFile, 'utf-8');
      const har = JSON.parse(harContent);
      const samples = parseHar(har, globalOptions);

      const collection = generateInsomniaCollection(samples, {
        baseUrl: globalOptions.baseUrl,
        envFile: options.env,
        maskHeaders: globalOptions.maskHeaders ? globalOptions.maskHeaders.split(',') : ['authorization', 'cookie']
      });

      if (options.out) {
        writeFileSync(options.out, collection);
        console.log(`Insomnia collection saved to ${options.out}`);
      } else {
        console.log(collection);
      }
    } catch (error) {
      console.error('Error generating Insomnia collection:', error);
      process.exit(1);
    }
  });

gen
  .command('curl <harFile>')
  .description('generate curl suite')
  .option('--out <file>', 'output file', 'suite.sh')
  .option('--strict', 'add set -euo pipefail to script')
  .action((harFile, options) => {
    try {
      const globalOptions = program.opts();
      const harContent = readFileSync(harFile, 'utf-8');
      const har = JSON.parse(harContent);
      const samples = parseHar(har, globalOptions);

      generateCurlSuite(samples, options.out, {
        strict: options.strict,
        maskHeaders: globalOptions.maskHeaders ? globalOptions.maskHeaders.split(',') : ['authorization', 'cookie'],
        baseUrl: globalOptions.baseUrl
      });
    } catch (error) {
      console.error('Error generating curl suite:', error);
      process.exit(1);
    }
  });

gen
  .command('tests <harFile>')
  .description('generate functional tests')
  .option('--out <dir>', 'output directory', 'tests/')
  .option('--config <file>', 'config file')
  .action((harFile, options) => {
    try {
      const globalOptions = program.opts();
      const harContent = readFileSync(harFile, 'utf-8');
      const har = JSON.parse(harContent);
      const samples = parseHar(har, globalOptions);

      let config = {};
      if (options.config) {
        const configContent = readFileSync(options.config, 'utf-8');
        config = JSON.parse(configContent);
      }

      generateTests(samples, options.out, config);
      console.log(`Generated ${samples.length} test files in ${options.out}`);
    } catch (error) {
      console.error('Error generating tests:', error);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('run functional tests')
  .option('--env <file>', 'environment file')
  .option('--report <file>', 'HTML report output')
  .option('--tag <label>', 'tag for reports')
  .action(testCommand);

// Global options
program
  .option('--include <regex>', 'include URL regex')
  .option('--exclude <regex>', 'exclude URL regex')
  .option('--mask-headers <list>', 'headers to mask', 'authorization,cookie')
  .option('--base-url <url>', 'base URL for normalization')
  .option('--tag <label>', 'tag for reports');

program.parse();