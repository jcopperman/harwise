# harwise

A CLI tool for processing HAR (HTTP Archive) files to generate functional tests, HTML reports, Insomnia collections, curl suites, and perform regression analysis.

[![npm version](https://img.shields.io/npm/v/harwise.svg)](https://www.npmjs.com/package/harwise)
[![CI](https://github.com/jcopperman/harwise/actions/workflows/ci.yml/badge.svg)](https://github.com/jcopperman/harwise/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub last commit](https://img.shields.io/github/last-commit/jcopperman/harwise)](https://github.com/jcopperman/harwise/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/jcopperman/harwise)](https://github.com/jcopperman/harwise/issues)
[![GitHub stars](https://img.shields.io/github/stars/jcopperman/harwise)](https://github.com/jcopperman/harwise/stargazers)

<<<<<<< HEAD
> **Status Badges**: CI build status • Node.js compatibility • License • Last commit • Open issues • GitHub stars
>
> *Note: npm and CI badges will show proper status after publishing to npm and pushing to GitHub.*

=======
>>>>>>> 14069fb11000aa63efa632208a4fb09d3c2cb43d
## ✨ Features

- **Functional Test Generation** - Generate Node.js/TypeScript tests with assertions, timing validation, and variable extraction
- **HTML Reports** - Self-contained reports with performance metrics and comparison views
- **HAR Comparison** - Detect performance regressions with configurable thresholds
- **Insomnia Collections** - Export API requests to Insomnia v4 format with environment variables
- **Curl Suites** - Generate shell scripts for manual testing with masked headers
- **CI/CD Ready** - Static outputs, no external dependencies, perfect for automated workflows

## 🚀 Quick Start

### Installation

```bash
npm install -g harwise
# or
npx harwise --help
```

### Basic Usage

```bash
# Generate functional tests from HAR file
harwise gen tests my-api.har --out tests/

# Run tests with HTML report
harwise test --report report.html

# Compare HAR files for regressions
harwise compare baseline.har new.har

# Generate Insomnia collection
harwise gen insomnia my-api.har --out collection.json

# Create curl suite
harwise gen curl my-api.har --out suite.sh --strict
```

## 📖 Commands

### `harwise stats <harFile>`

Get a quick summary of HAR file contents.

```bash
harwise stats my-api.har
```

**Output:**
```
HAR Stats: my-api.har
Total API requests: 24
Average time: 145.67ms
Average size: 2.3 KB
Status codes: { '200': 22, '201': 2 }
```

### `harwise gen tests <harFile>`

Generate functional tests from HAR file.

```bash
harwise gen tests my-api.har --out tests/ --config hw.config.json
```

**Options:**
- `--out <dir>` - Output directory (default: `tests/`)
- `--config <file>` - Configuration file path

**Generated Files:**
- `tests/test_0.spec.js`, `tests/test_1.spec.js`, ... - Individual test files
- `tests/.harwise.manifest.json` - Test execution manifest
- `tests/.harwise.env.json` - Extracted variables (after running tests)

### `harwise test`

Run generated functional tests.

```bash
harwise test --env .env --report report.html --tag "build-123"
```

**Options:**
- `--env <file>` - Environment variables file
- `--report <file>` - Generate HTML report
- `--tag <label>` - Tag for report labeling

**Features:**
- ✅ Status code validation
- ✅ Content-type assertions
- ✅ Timing performance assertions
- ✅ JSON schema validation
- ✅ Variable extraction and chaining
- ✅ Environment variable support
- ✅ HTML reports generated even when tests fail

### `harwise compare <baselineHar> <newHar>`

Compare two HAR files for performance regressions.

```bash
harwise compare baseline.har new.har --time-regress 10 --size-regress 15 --out comparison.md
```

**Options:**
- `--time-regress <pct>` - Time regression threshold (default: 10%)
- `--size-regress <pct>` - Size regression threshold (default: 15%)
- `--out <file>` - Output file for Markdown report
- `--report <file>` - Generate HTML comparison report

**Exit Codes:**
- `0` - No regressions
- `2` - Regressions detected

### `harwise gen insomnia <harFile>`

Generate Insomnia v4 collection.

```bash
harwise gen insomnia my-api.har --out collection.json --env staging.env.json
```

**Options:**
- `--out <file>` - Output file
- `--env <file>` - Environment file for additional variables

**Features:**
- Auto-extracts Bearer tokens into `{{ auth_token }}`
- Normalizes URLs with `{{ base_url }}`
- Masks sensitive headers
- Handles JSON and form-encoded bodies

### `harwise gen curl <harFile>`

Generate curl suite for manual testing.

```bash
harwise gen curl my-api.har --out suite.sh --strict
```

**Options:**
- `--out <file>` - Output file (default: `suite.sh`)
- `--strict` - Add `set -euo pipefail` for strict error handling

**Features:**
- Masks authorization and cookie headers
- Includes original timing/size as comments
- Supports all HTTP methods and body types

## ⚙️ Configuration

Create a `hw.config.json` file for advanced configuration:

```json
{
  "baseUrl": "https://api.example.com",
  "maskHeaders": ["authorization", "cookie", "x-api-key"],
  "assertions": {
    "global": {
      "statusRange": [200, 399],
      "maxTimePctOverSample": 25
    },
    "byUrl": [
      {
        "match": "/v1/users$",
        "jsonpath": [
          { "path": "$.data[*].id", "exists": true },
          { "path": "$.data", "minLength": 1 }
        ]
      }
    ]
  },
  "extract": [
    { "match": "/login$", "from": "$.access_token", "to": "auth_token" },
    { "match": "/v1/users/(\\d+)", "from": "$.id", "to": "last_user_id" }
  ],
  "substitute": [
    { "match": "/v1/users/\\d+", "pattern": "(\\d+)", "var": "last_user_id" }
  ]
}
```

## 🌍 Global Options

All commands support these global options:

- `--include <regex>` - Include only URLs matching regex
- `--exclude <regex>` - Exclude URLs matching regex
- `--mask-headers <list>` - Comma-separated list of headers to mask
- `--base-url <url>` - Base URL for origin normalization
- `--tag <label>` - Tag for report labeling

## 📊 HTML Reports

Generated reports include:

- **Summary Tiles** - Total/passed/failed tests, P50/P95 latency
- **Test Results Table** - Sortable by name, status, time, assertions
- **Performance Comparison** - When comparing HARs, shows regressions
- **Embedded Assets** - No external dependencies, CI/CD safe

## 🔧 Development

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn

### Setup

```bash
git clone https://github.com/jcopperman/harwise.git
cd harwise
npm install
npm run build
```

### Testing

```bash
npm test
```

### Building

```bash
npm run build
```

## 📋 CI/CD Integration

### GitHub Actions Example

See the complete workflow file: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

The workflow includes:
- **Multi-Node testing** (Node 20.x and 22.x)
- **CLI command testing** with fixture files
- **Artifact uploads** for reports and generated files
- **Release automation** for the main branch

### Basic CI/CD Setup

```yaml
name: API Testing
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }

      - name: Install harwise
        run: npm install -g harwise

      - name: Generate Tests
        run: harwise gen tests ./artifacts/api.har --out tests/ --config hw.config.json

      - name: Run Tests
        run: harwise test --env .env --report test-report.html

      - name: Compare Performance
        run: harwise compare ./artifacts/baseline.har ./artifacts/api.har --time-regress 10

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: test-report
          path: test-report.html
```

## 🔒 Security & Privacy

- **Header Masking** - Automatically masks `authorization`, `cookie`, `set-cookie` headers
- **Body Size Limits** - Respects `--keep-bodies` flag (default: omit bodies >1MB)
- **No External Calls** - Pure static analysis, no network requests during generation
- **CI/CD Safe** - All outputs are static files with no external dependencies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -am 'Add my feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Commander.js](https://github.com/tj/commander.js) for CLI framework
- Uses [undici](https://github.com/nodejs/undici) for HTTP testing
- JSON Schema validation with [AJV](https://ajv.js.org/)
- JSONPath queries with [jsonpath-plus](https://github.com/JSONPath-Plus/JSONPath)

---

**harwise** - Making API testing from HAR files simple and powerful.
