# CHANGES

Extract into the repository root; files replace existing ones at the same paths.

| Status | File | Purpose |
|---|---|---|
| MODIFIED | `server/index.js` | Runs metric registry sync at startup |
| NEW | `server/modules/analytics/data/metricDefinitions.js` | Code-defined registry of all 61 analytics metrics |
| MODIFIED | `server/modules/analytics/exporters/excelExporter.js` | Six-sheet assessment workbook |
| MODIFIED | `server/modules/analytics/exporters/pdfExporter.js` | Assessment PDF layout |
| MODIFIED | `server/modules/analytics/routes/analyticsV2.js` | Pass payload to exporters |
| MODIFIED | `server/modules/analytics/routes/analyticsV3.js` | Pass payload to exporters |
| MODIFIED | `server/modules/analytics/services/analyticsService.js` | parseAmount; no fabricated zeros |
| NEW | `server/modules/analytics/services/assessmentReportService.js` | Institutional assessment report builder |
| MODIFIED | `server/modules/analytics/services/benchmarkCatalogueService.js` | metricOptions returns all metrics with criterion/unit |
| MODIFIED | `server/modules/analytics/services/benchmarkPdfParser.js` | Unit mismatch warning |
| MODIFIED | `server/modules/analytics/services/benchmarkService.js` | Unit guard, absolute mode, insufficient reasons |
| NEW | `server/modules/analytics/services/metricRegistry.js` | Idempotent upsert of metric definitions |
| NEW | `server/modules/analytics/services/metricUnits.js` | Unit kinds, compatibility, rupee-to-lakh conversion |
| MODIFIED | `server/modules/analytics/services/reportService.js` | Benchmark report shows unit and reasons |
| MODIFIED | `server/modules/analytics/services/reportServiceV3.js` | Registers institutional-assessment; fixes awards report |
| MODIFIED | `server/seeders/analyticsV3MetricSeeder.js` | Imports definitions from metricDefinitions.js |
| MODIFIED | `server/seeders/benchmarkComputedFieldUpdater.js` | Dropped four unit-mismatched proxy mappings |
| MODIFIED | `server/seeders/benchmarkSeeder.js` | Corrected computedField for 3.2.2, 3.4.2, 3.4.4 |
| NEW | `server/tests/phase8-metric-registry/test.js` | Backend tests for registry, units, exporters |
| NEW | `src/components/admin/MetricMappingSelect.tsx` | Criterion-grouped mapping picker |
| MODIFIED | `src/lib/benchmarkImportApi.ts` | MetricOption type |
| MODIFIED | `src/pages/admin/BenchmarkCatalogue.tsx` | Uses MetricMappingSelect |
| MODIFIED | `src/pages/admin/BenchmarkImport.tsx` | Uses MetricMappingSelect |
| MODIFIED | `src/pages/analytics/benchmark/BenchmarkPage.tsx` | New insufficient-data reason texts |

No package.json or package-lock.json changes were needed. No new dependencies. No documentation files were changed.

After extracting: restart the server (metric registry syncs on start). Run `node server/tests/phase8-metric-registry/test.js` from `server/`.
