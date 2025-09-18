# Harwise Project TODO

## 🎯 Project Overview
CLI tool for processing HAR files to generate:
- Insomnia collections (✅ COMPLETED)
- Functional tests (Node runner)
- HTML reports for perf + functional results
- Curl suites
- HAR comparison for regressions

## ✅ Completed Features

### 1. Project Setup & Core Infrastructure
- [x] Initialize project structure (src/, templates/, fixtures/)
- [x] Set up TypeScript configuration
- [x] Configure package.json with dependencies
- [x] Create basic CLI framework with Commander.js
- [x] Implement HAR file parsing and normalization
- [x] Add URL filtering and matching logic

### 2. Insomnia Collection Generator
- [x] Generate Insomnia v4 compatible JSON exports
- [x] Create environments with base_url and auth_token variables
- [x] Extract and mask authorization headers
- [x] Normalize URLs with base_url replacement
- [x] Handle JSON and form-encoded request bodies
- [x] Organize requests in folders

## 🚧 In Progress / Next Priority

### 3. Functional Test Generator (`harwise gen tests`)
- [ ] Create test file structure (`tests/<method>_<pathHash>.spec.ts`)
- [ ] Generate manifest file (`tests/.harwise.manifest.json`)
- [ ] Implement auto-assertions (status, content-type, timing)
- [ ] Add heuristic assertions (JSON schema, token extraction)
- [ ] Support config-driven assertions (`hw.config.json`)
- [ ] Implement variable extraction and chaining
- [ ] Add schema validation (JSON Schema, OpenAPI)
- [ ] Handle deterministic replay (header stripping, retry logic)

### 4. Test Runner Framework (`harwise test`)
- [ ] Create test runner with environment loading
- [ ] Implement assertion helpers (status, JSONPath, schema)
- [ ] Add timing and performance assertions
- [ ] Generate JSON results with pass/fail status
- [ ] Support test chaining with extracted variables
- [ ] Add exponential backoff retry logic
- [ ] Implement `.harwise.env.json` for variable persistence

### 5. HTML Report Generator
- [ ] Create HTML template with embedded CSS/JS
- [ ] Generate summary tiles (total/passed/failed, p50/p95 latency)
- [ ] Build sortable test results table
- [ ] Add performance comparison view for `compare` results
- [ ] Implement inline SVG sparklines for latency distribution
- [ ] Ensure CI-safe (no external CDNs)
- [ ] Add build tag, date, and environment metadata

### 6. HAR Comparison (`harwise compare`)
- [ ] Implement baseline vs new HAR comparison
- [ ] Add regression detection (status, time, size)
- [ ] Generate Markdown/HTML reports
- [ ] Support configurable thresholds (`--time-regress`, `--size-regress`)
- [ ] Exit with appropriate codes (0=success, 2=regressions)
- [ ] Integrate with HTML report generation

### 7. Curl Suite Generator (`harwise gen curl`)
- [ ] Generate shell scripts with curl commands
- [ ] Mask sensitive headers in output
- [ ] Add `--strict` mode with `set -euo pipefail`
- [ ] Include original sample timing/size as comments
- [ ] Support header stripping configuration

## 🔧 Configuration & CLI Enhancements

### 8. Global Options & Configuration
- [ ] Implement `--include`/`--exclude` regex filtering
- [ ] Add `--mask-headers` with default sensitive headers
- [ ] Support `--base-url` for origin normalization
- [ ] Add `--tag` for report labeling
- [ ] Create `hw.config.json` schema and validation
- [ ] Support `.env` file loading for environment variables
- [ ] Add precedence handling (CLI > config > inferred)

### 9. Additional Commands
- [ ] Implement `harwise stats` with detailed HAR analysis
- [ ] Add `--keep-bodies` option for large response handling
- [ ] Support `--openapi` for schema validation
- [ ] Add `--report` integration for HTML output

## 🧪 Testing & Quality Assurance

### 10. Test Suite & Fixtures
- [ ] Create comprehensive fixture HAR files
- [ ] Add unit tests for core parsing functions
- [ ] Test edge cases (malformed HAR, missing fields)
- [ ] Add integration tests for generators
- [ ] Create test fixtures for comparison scenarios

### 11. Documentation & Examples
- [ ] Update README.md with usage examples
- [ ] Add GitHub Actions CI example
- [ ] Create example `hw.config.json`
- [ ] Document all CLI options and commands
- [ ] Add troubleshooting guide

## 🎨 Nice-to-Have Features

### 12. Advanced Features
- [ ] Add `--resource-type` filtering for HAR entries
- [ ] Implement request deduplication
- [ ] Add custom assertion plugins
- [ ] Support GraphQL schema validation
- [ ] Add performance profiling integration
- [ ] Implement test result caching

### 13. Developer Experience
- [ ] Add `--verbose` mode with detailed logging
- [ ] Implement `--dry-run` for previewing operations
- [ ] Add progress indicators for long operations
- [ ] Create interactive mode for configuration
- [ ] Add shell completion scripts

## 📊 Implementation Priority

### Phase 1: Core Functionality (Current)
- [x] HAR parsing and filtering
- [x] Insomnia collection generation
- [ ] Functional test generation
- [ ] Basic test runner

### Phase 2: Reporting & Analysis
- [ ] HTML report generation
- [ ] HAR comparison
- [ ] Curl suite generation

### Phase 3: Polish & Advanced Features
- [ ] Configuration system
- [ ] Schema validation
- [ ] Advanced assertions
- [ ] Performance optimizations

### Phase 4: Testing & Documentation
- [ ] Comprehensive test suite
- [ ] CI/CD integration examples
- [ ] Complete documentation

## 🔗 Dependencies Status

### Runtime Dependencies
- [x] `commander` - CLI framework
- [x] `undici` - HTTP client for tests
- [x] `ajv` - JSON schema validation
- [x] `jsonpath-plus` - JSONPath assertions
- [x] `yargs` - CLI argument parsing
- [x] `dotenv` - Environment file loading
- [ ] `openapi-schema-validator` - OpenAPI validation

### Dev Dependencies
- [x] `@types/node` - TypeScript definitions
- [x] `typescript` - TypeScript compiler
- [x] `ts-node` - TypeScript execution
- [x] `jest` - Testing framework

## 📝 Notes

- All features should follow the SPEC.md requirements
- Maintain backward compatibility as features are added
- Focus on CI/CD use cases (static outputs, no external dependencies)
- Prioritize security (header masking, body size limits)
- Keep pure functions where possible for testability