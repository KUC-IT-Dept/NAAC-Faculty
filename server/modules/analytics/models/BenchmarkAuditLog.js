/**
 * BenchmarkAuditLog.js - append-only audit trail for the benchmark import
 * workflow. Entries are only ever created, never updated or deleted by the app
 * (deleting a version or a record writes a NEW 'version_delete' / 'record_delete' entry and leaves the old ones).
 */

'use strict';

const mongoose = require('mongoose');

const ACTIONS = [
  'upload', 'upload_rejected', 'extract', 'extract_failed', 'manual_create',
  'row_edit', 'row_add', 'approve', 'approve_rejected',
  'activate', 'activate_failed', 'replace', 'rollback', 'reject', 'baseline_snapshot',
  'upload_reused', 'source_download', 'record_change',
  'record_create', 'record_update', 'record_deactivate', 'record_reactivate',
  'version_delete', 'record_delete', 'delete_rejected',
];

const benchmarkAuditLogSchema = new mongoose.Schema({
  action:   { type: String, enum: ACTIONS, required: true, index: true },
  importId: { type: String, default: null, index: true },
  metricId: { type: String, default: null, index: true },   // set for entries about one benchmark record
  actor: {
    id:   { type: String, default: null },
    name: { type: String, default: null },
    role: { type: String, default: null },
  },
  at:      { type: Date, default: Date.now, index: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { collection: 'benchmarkauditlogs' });

benchmarkAuditLogSchema.statics.ACTIONS = ACTIONS;

module.exports = mongoose.models.BenchmarkAuditLog || mongoose.model('BenchmarkAuditLog', benchmarkAuditLogSchema);
