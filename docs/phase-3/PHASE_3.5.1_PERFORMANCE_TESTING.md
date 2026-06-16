# Phase 3.5.1: Performance Testing Guide

**Status**: ✅ **READY**  
**Purpose**: Comprehensive guide for performance testing and benchmarking

---

## 🎯 **Overview**

Performance testing ensures the system can handle:
- Expected load
- Peak traffic
- Concurrent users
- High database query volume
- Cache effectiveness

---

## 📊 **Performance Benchmarks**

### **Target Metrics**

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| API Response Time (p95) | < 200ms | < 500ms |
| API Response Time (p99) | < 500ms | < 1000ms |
| Database Query Time (avg) | < 50ms | < 100ms |
| Cache Hit Rate | > 80% | > 70% |
| Concurrent Users | 1000+ | 500+ |
| Requests/Second | 500+ | 200+ |
| Error Rate | < 0.1% | < 1% |

---

## 🧪 **Testing Tools**

### **1. Apache Bench (ab)** (Simple)

```bash
# Install
sudo apt-get install apache2-utils

# Test endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer TOKEN" \
   http://localhost:3000/api/modules

# Parameters:
# -n: Number of requests
# -c: Concurrent requests
# -H: Headers
```

### **2. Artillery** (Recommended)

```bash
# Install
npm install -g artillery

# Run test
artillery run load-test.yml
```

**Load Test Configuration** (`load-test.yml`):
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10  # 10 users/second
      name: "Warm up"
    - duration: 120
      arrivalRate: 50  # 50 users/second
      name: "Ramp up"
    - duration: 300
      arrivalRate: 100 # 100 users/second
      name: "Sustained load"
    - duration: 60
      arrivalRate: 200 # 200 users/second
      name: "Peak load"
  processor: "./artillery-processor.js"
  plugins:
    expect: {}
  
scenarios:
  - name: "Get Modules"
    weight: 40
    flow:
      - get:
          url: "/api/modules"
          headers:
            Authorization: "Bearer {{ token }}"
          expect:
            - statusCode: 200
            - contentType: json
      - think: 2
  
  - name: "Get Module Detail"
    weight: 30
    flow:
      - get:
          url: "/api/modules/{{ moduleId }}"
          headers:
            Authorization: "Bearer {{ token }}"
          expect:
            - statusCode: 200
  
  - name: "Get User Profile"
    weight: 20
    flow:
      - get:
          url: "/api/users/{{ userId }}"
          headers:
            Authorization: "Bearer {{ token }}"
          expect:
            - statusCode: 200
  
  - name: "Get Preparedness Score"
    weight: 10
    flow:
      - get:
          url: "/api/scores/preparedness/{{ userId }}"
          headers:
            Authorization: "Bearer {{ token }}"
          expect:
            - statusCode: 200
```

### **3. k6** (Modern, Recommended)

```bash
# Install
# Linux/Mac: https://k6.io/docs/getting-started/installation/

# Run test
k6 run load-test.js
```

**Load Test Script** (`load-test.js`):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const cacheHitRate = new Rate('cache_hits');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000';
const TOKEN = __ENV.TOKEN || 'your-test-token';

export default function() {
  // Test 1: Get modules
  let res = http.get(`${BASE_URL}/api/modules`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
  });
  
  const isSuccess = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!isSuccess);
  
  // Check cache header
  const cacheStatus = res.headers['X-Cache'];
  cacheHitRate.add(cacheStatus === 'HIT');
  
  sleep(1);
  
  // Test 2: Get module detail
  const moduleId = '507f1f77bcf86cd799439011'; // Example ID
  res = http.get(`${BASE_URL}/api/modules/${moduleId}`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
    },
  });
  
  check(res, {
    'module status is 200': (r) => r.status === 200,
  });
  
  sleep(2);
}
```

---

## 📈 **Performance Test Scenarios**

### **Scenario 1: Baseline Performance**

**Goal**: Establish baseline performance metrics

```bash
# Run baseline test
artillery run baseline-test.yml

# Expected Results:
# - Average response time: < 200ms
# - 95th percentile: < 500ms
# - Error rate: < 0.1%
```

### **Scenario 2: Cache Effectiveness**

**Goal**: Test cache hit rates

```bash
# Run cache test (requests same endpoints multiple times)
artillery run cache-test.yml

# Expected Results:
# - Cache hit rate: > 80%
# - Response time improvement: > 50%
```

### **Scenario 3: Load Testing**

**Goal**: Test system under expected load

```bash
# Simulate 100 concurrent users
artillery run load-test.yml

# Expected Results:
# - System handles load without errors
# - Response times remain acceptable
# - No memory leaks
```

### **Scenario 4: Stress Testing**

**Goal**: Find breaking point

```bash
# Gradually increase load until failure
artillery run stress-test.yml

# Expected Results:
# - Identify max concurrent users
# - Identify bottlenecks
# - Document failure points
```

### **Scenario 5: Endurance Testing**

**Goal**: Test system over extended period

```bash
# Run for 1 hour with steady load
artillery run endurance-test.yml

# Expected Results:
# - No memory leaks
# - Stable performance over time
# - No resource exhaustion
```

---

## 📝 **Test Results Template**

### **Performance Test Report**

```markdown
# Performance Test Report

**Date**: YYYY-MM-DD
**Environment**: Production/Staging
**Test Duration**: X minutes
**Tool**: Artillery/k6/Apache Bench

## Test Configuration
- Target: http://api.example.com
- Concurrent Users: 100
- Test Duration: 30 minutes
- Scenarios: [List scenarios]

## Results

### Response Times
| Endpoint | Average | p50 | p95 | p99 | Max |
|----------|---------|-----|-----|-----|-----|
| GET /api/modules | 150ms | 120ms | 300ms | 500ms | 800ms |
| GET /api/modules/:id | 80ms | 70ms | 150ms | 250ms | 400ms |

### Throughput
- Requests/Second: 450
- Successful Requests: 810,000
- Failed Requests: 50 (0.006%)

### Cache Performance
- Cache Hit Rate: 85%
- Cache Miss Rate: 15%
- Average Cache Hit Time: 50ms
- Average Cache Miss Time: 200ms

### Database Performance
- Average Query Time: 45ms
- Slow Queries (>100ms): 120
- Total Queries: 15,000

### System Resources
- CPU Usage: 65% (avg)
- Memory Usage: 2.5GB / 4GB
- Network I/O: 50MB/s

## Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
1. [Recommendation]
2. [Recommendation]

## Conclusion
[Summary of test results and next steps]
```

---

## 🔍 **Monitoring During Tests**

### **1. Application Metrics**

Monitor via `/api/metrics/performance`:
```bash
# Watch metrics during test
watch -n 1 'curl -s http://localhost:3000/api/metrics/performance | jq'
```

### **2. Database Metrics**

```bash
# MongoDB stats
mongosh --eval "db.serverStatus()"

# Slow queries
mongosh --eval "db.setProfilingLevel(1, { slowms: 100 })"
```

### **3. System Metrics**

```bash
# CPU and Memory
top
htop

# Network
iftop
nethogs

# Disk I/O
iostat -x 1
```

---

## 📊 **Performance Regression Testing**

### **Automated Performance Testing**

Create script to run performance tests in CI/CD:

```javascript
// scripts/performance-test.js
import { execSync } from 'child_process';
import fs from 'fs';

const baseline = JSON.parse(fs.readFileSync('baseline.json'));

// Run test
execSync('artillery run load-test.yml --output results.json');

const results = JSON.parse(fs.readFileSync('results.json'));

// Compare with baseline
const regression = {
  responseTime: results.avgResponseTime > baseline.avgResponseTime * 1.2,
  errorRate: results.errorRate > baseline.errorRate * 1.5,
  throughput: results.throughput < baseline.throughput * 0.9
};

if (regression.responseTime || regression.errorRate || regression.throughput) {
  console.error('Performance regression detected!');
  process.exit(1);
}
```

---

## ✅ **Performance Testing Checklist**

- [ ] Baseline performance established
- [ ] Load testing completed
- [ ] Stress testing completed
- [ ] Cache effectiveness verified
- [ ] Database query performance tested
- [ ] Memory leak testing completed
- [ ] Endurance testing completed
- [ ] Performance regression tests in CI/CD
- [ ] Documentation updated
- [ ] Performance targets met

---

## 🚀 **Running Performance Tests**

### **Quick Test**
```bash
# Simple load test
ab -n 1000 -c 10 http://localhost:3000/api/health
```

### **Comprehensive Test**
```bash
# Full test suite
npm run test:performance
```

### **Continuous Monitoring**
```bash
# Monitor performance metrics
npm run monitor:performance
```

---

**Performance Testing**: ✅ **Documentation Complete**  
**Ready for**: Running tests and establishing baselines

