# HAR Comparison Report

**Baseline:** fixtures/test.har
**New:** fixtures/test2.har
**Time Regression Threshold:** 10%
**Size Regression Threshold:** 15%

## Summary

- **Total Endpoints:** 2
- **Regressions:** 0
- **Clean:** 2

## Results

| Endpoint | Status | Time (ms) | Size (bytes) | Δ% | Regression |
|----------|--------|-----------|--------------|----|------------|
| GET https://api.example.com/v1/users?limit=10&sort=name | 200 | 150 | 512 | - | ✅ |
| POST https://api.example.com/v1/login | 200 | 200 | 256 | - | ✅ |
