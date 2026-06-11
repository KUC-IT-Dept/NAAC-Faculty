# Analytics Engine Phase 1 - Supported Metrics

## Overview

The Analytics Engine calculates IQAC metrics dynamically using metadata stored in the `metrics` collection. Each metric defines:

* Metric ID
* Metric Name
* Source Collection
* Field Path
* Formula Type

The engine reads these definitions and computes values automatically.

---

## Supported Metrics

### 3.4.4 - Research Publications

**Criterion:** Research & Publications

**Source Collection:** faculties

**Field Path:** publications

**Formula Type:** count

**Calculation Logic:**

* For each faculty record, count the number of publication entries.
* Sum all publication counts across faculty members.

**Example Result:**

```json
{
  "metricId": "3.4.4",
  "metricName": "Research Publications",
  "value": 6
}
```

---

### 3.2.2 - Research Projects

**Criterion:** Research Projects

**Source Collection:** faculties

**Field Path:** projects

**Formula Type:** count

**Calculation Logic:**

* Count project entries for each faculty.
* Sum all project counts.

**Example Result:**

```json
{
  "metricId": "3.2.2",
  "metricName": "Research Projects",
  "value": 3
}
```

---

### 3.4.5 - Patents

**Criterion:** Innovation & Intellectual Property

**Source Collection:** faculties

**Field Path:** patents

**Formula Type:** count

**Calculation Logic:**

* Count patent entries for each faculty.
* Sum all patent counts.

**Example Result:**

```json
{
  "metricId": "3.4.5",
  "metricName": "Patents",
  "value": 1
}
```

---

### 3.2.1 - Research Funding

**Criterion:** Research Funding

**Source Collection:** faculties

**Field Path:** projects

**Formula Type:** sum

**Sum Field:** amountSanctioned

**Calculation Logic:**

* Read the `amountSanctioned` value from each project.
* Convert comma-separated values into numbers.
* Sum all sanctioned amounts.

**Example Result:**

```json
{
  "metricId": "3.2.1",
  "metricName": "Research Funding",
  "value": 5500000
}
```

---

## Implemented API Endpoints

### Get Metric Registry

```http
GET /api/analytics/metrics
```

Returns all configured metrics.

---

### Coverage Analysis

```http
GET /api/analytics/coverage
```

Returns metric coverage and availability.

---

### Calculate Single Metric

```http
GET /api/analytics/metric/:metricId
```

Example:

```http
GET /api/analytics/metric/3.4.4
```

---

### Analytics Dashboard

```http
GET /api/analytics/dashboard
```

Returns all supported metric values in a single response.

---

## Supported Formula Types

### count

Counts records inside an array field.

Examples:

* publications
* projects
* patents

---

### sum

Adds numeric values from a specified field.

Examples:

* amountSanctioned

---

## Future Phase 2 Enhancements

* average formula
* percentage formula
* weighted score formula
* NAAC score mapping
* Criterion-wise dashboards
* Department-wise analytics
* Trend analysis
* Year-wise filtering
* Data quality scoring
* Automated IQAC report generation
