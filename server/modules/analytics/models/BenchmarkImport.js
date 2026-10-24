/**
 * BenchmarkImport.js
 *
 * One document per benchmark catalogue VERSION. A version is created as a
 * 'draft' from an uploaded PDF (or manual entry), must be 'approved' by an
 * administrator, and only then can be made 'active'. Rows are an immutable
 * snapshot once approved, so any earlier version can be restored by rollback.
 *
 *   draft -> approved -> active -> superseded -> (rollback) active
 *   draft -> rejected
 *
 * `origin: 'baseline'` is the automatic snapshot of the catalogue that existed
 * (seeded) before the first import, so the very first import is also reversible.
 */

'use strict';

const mongoose = require('mongoose');

const actorSchema = new mongoose.Schema({
  id:   { type: String, default: null },
  name: { type: String, default: null },
}, { _id: false });

const benchmarkImportSchema = new mongoose.Schema({
  versionNo:       { type: Number, required: true },
  documentVersion: { type: String, default: '' },
  sourceFilename:  { type: String, default: null },
  fileHash:        { type: String, default: null },
  fileSize:        { type: Number, default: null },
  origin:          { type: String, enum: ['pdf', 'manual', 'baseline'], required: true },
  status:          { type: String, enum: ['draft', 'approved', 'active', 'superseded', 'rejected'], default: 'draft', index: true },

  pageCount:     { type: Number, default: null },
  sourceStored:  { type: Boolean, default: false },          // PDF bytes kept privately in benchmarkimportfiles
  processing:    { type: mongoose.Schema.Types.Mixed, default: null }, // { chunks, chunkSize, pagesProcessed, ms }
  scannedPages:  { type: [Number], default: [] },
  warnings:      { type: [String], default: [] },
  criteria:      { type: [mongoose.Schema.Types.Mixed], default: [] },

  // Draft rows, see benchmarkPdfParser.js for the row shape.
  rows: { type: [mongoose.Schema.Types.Mixed], default: [] },

  uploadedBy:  { type: actorSchema, default: () => ({}) },
  uploadedAt:  { type: Date, default: Date.now },
  reviewedBy:  { type: actorSchema, default: () => ({}) },   // last admin to edit/review rows
  reviewedAt:  { type: Date, default: null },
  approvedBy:  { type: actorSchema, default: () => ({}) },
  approvedAt:  { type: Date, default: null },
  activatedBy: { type: actorSchema, default: () => ({}) },
  activatedAt: { type: Date, default: null },
  supersededAt: { type: Date, default: null },

  activation: {
    mode:                { type: String, default: null },       // 'merge' | 'replace'
    previousImportId:    { type: String, default: null },
    deactivatedMetricIds: { type: [String], default: [] },
    summary:             { type: mongoose.Schema.Types.Mixed, default: null }, // { added, modified, deactivated, unchanged }
    action:              { type: String, default: null },       // 'activate' | 'rollback'
  },
}, { timestamps: true, collection: 'benchmarkimports' });

benchmarkImportSchema.index({ versionNo: -1 });
benchmarkImportSchema.index({ fileHash: 1 });

module.exports = mongoose.models.BenchmarkImport || mongoose.model('BenchmarkImport', benchmarkImportSchema);
