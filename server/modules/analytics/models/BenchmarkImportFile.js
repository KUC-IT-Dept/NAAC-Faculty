/**
 * BenchmarkImportFile.js
 *
 * The uploaded benchmark PDF, kept PRIVATELY in MongoDB (not on a public path and
 * not on the web host's ephemeral disk). It is addressed only by import id (never
 * by a user-supplied file name), so there is no path to traverse, and it is only
 * served through the admin-only endpoint GET /admin/benchmark-imports/:id/source.
 * Max size is enforced before storing (see benchmarkImportService.MAX_PDF_BYTES).
 */

'use strict';

const mongoose = require('mongoose');

const benchmarkImportFileSchema = new mongoose.Schema({
  importId: { type: String, required: true, unique: true },
  fileHash: { type: String, required: true },
  size:     { type: Number, required: true },
  data:     { type: Buffer, required: true },
}, { timestamps: true, collection: 'benchmarkimportfiles' });

module.exports = mongoose.models.BenchmarkImportFile || mongoose.model('BenchmarkImportFile', benchmarkImportFileSchema);
