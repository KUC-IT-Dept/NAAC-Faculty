/**
 * benchmarkImport.js  -  /api/faculty/admin/benchmark-imports
 *
 * Administrator-only workflow for importing NAAC benchmark definitions from a
 * PDF. Every route requires a valid session AND an admin/superadmin role,
 * enforced here on the server (the UI is not a security boundary).
 *
 *   GET    /status                      what catalogue is this environment serving?
 *   GET    /audit-log[?importId=]       append-only audit trail
 *   GET    /                            list versions
 *   POST   /upload   (multipart: file, documentVersion)   PDF -> draft
 *   POST   /manual                      empty draft for manual entry
 *   GET    /:id                         full draft/version incl. rows and flags
 *   POST   /:id/rows                    add a manual row
 *   PATCH  /:id/rows/:rowId             edit a row (flags are recomputed server-side)
 *   GET    /:id/preview?mode=           additions / modifications / deactivations before activating
 *   GET    /:id/source                  the stored source PDF (admin only, never public)
 *   POST   /:id/approve                 explicit approval (refused while errors remain)
 *   POST   /:id/activate  { mode }      make an approved version the live catalogue
 *   POST   /:id/rollback                restore a previously active version
 *   POST   /:id/reject                  discard a draft/approved version
 *   DELETE /:id                         permanently delete a non-live version + its stored PDF (audit kept)
 */

'use strict';

const express = require('express');
const multer = require('multer');
const { auth, adminOnly } = require('../middleware/auth');
const svc = require('../../analytics/services/benchmarkImportService');

const router = express.Router();

// Startup self-check (non-blocking): makes a missing/incompatible PDF engine visible in the
// server log at boot instead of only when an administrator uploads a file.
require('../../analytics/services/benchmarkPdfParser').checkExtractor({ deep: true }).then((r) => {
  if (r.compatible && r.deepCheck === 'ok') console.log(`[benchmark-import] PDF engine ready (pdfjs-dist ${r.pdfjsVersion}, node ${r.node})`);
  else console.error(`[benchmark-import] PDF engine NOT usable: ${r.problem || 'unknown'}${r.detail ? ` - ${r.detail}` : ''}. PDF imports will fail until "npm install" is run in server/ and the server is restarted.`);
}).catch(() => { /* diagnostics must never break startup */ });

const upload = multer({
  storage: multer.memoryStorage(), // never written to disk
  limits: { fileSize: svc.MAX_PDF_BYTES, files: 1 },
});

router.use(auth, adminOnly);

const oid = /^[a-f0-9]{24}$/i;
const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); } catch (err) {
    if (err instanceof svc.ImportError) return res.status(err.status).json({ message: err.message, ...err.extra });
    if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'File is too large.' });
    console.error('[benchmark-import]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
const checkId = (req, res, next) => (oid.test(req.params.id) || /^fake/.test(req.params.id) ? next() : res.status(404).json({ message: 'Import not found.' }));

const full = (imp) => ({ ...svc.summarize(imp), pageCount: imp.pageCount, scannedPages: imp.scannedPages, warnings: imp.warnings, criteria: imp.criteria, rows: imp.rows, activation: imp.activation });

router.get('/status', wrap(async (req, res) => res.json(await svc.getStatus())));
router.get('/audit-log', wrap(async (req, res) => res.json(await svc.listAudit({ importId: req.query.importId }))));
router.get('/', wrap(async (req, res) => res.json(await svc.listImports())));

router.post('/upload', (req, res, next) => upload.single('file')(req, res, (err) => {
  if (err) return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : 'Upload failed.' });
  next();
}), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Attach a PDF in the "file" field.' });
  const imp = await svc.createFromPdf({
    buffer: req.file.buffer, filename: String(req.file.originalname || 'benchmark.pdf').slice(0, 200),
    mimetype: req.file.mimetype, documentVersion: String(req.body.documentVersion || '').slice(0, 80), user: req.user,
  });
  res.status(imp.reused ? 200 : 201).json({ ...full(imp), reused: !!imp.reused });
}));

router.post('/manual', wrap(async (req, res) => {
  const imp = await svc.createManualDraft({ documentVersion: String((req.body || {}).documentVersion || '').slice(0, 80), user: req.user });
  res.status(201).json(full(imp));
}));

router.get('/:id', checkId, wrap(async (req, res) => res.json(full(await svc.getImport(req.params.id)))));
router.get('/:id/preview', checkId, wrap(async (req, res) => res.json(await svc.previewActivation(req.params.id, req.query.mode || 'merge'))));
router.get('/:id/source', checkId, wrap(async (req, res) => {
  const f = await svc.getSourceFile(req.params.id, req.user);
  res.set({
    'Content-Type': 'application/pdf', 'Content-Length': String(f.data.length),
    'Content-Disposition': 'inline; filename="benchmark-source.pdf"', // fixed name: never echo user-supplied names
    'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store',
  });
  res.send(f.data);
}));
router.post('/:id/rows', checkId, wrap(async (req, res) => res.status(201).json(await svc.addRow(req.params.id, req.body || {}, req.user))));
router.patch('/:id/rows/:rowId', checkId, wrap(async (req, res) => res.json(await svc.updateRow(req.params.id, req.params.rowId, req.body || {}, req.user))));
router.post('/:id/approve', checkId, wrap(async (req, res) => res.json(svc.summarize(await svc.approve(req.params.id, req.user)))));
router.post('/:id/activate', checkId, wrap(async (req, res) => {
  const mode = (req.body && req.body.mode) || 'merge';
  res.json(svc.summarize(await svc.activate(req.params.id, req.user, { mode })));
}));
router.post('/:id/rollback', checkId, wrap(async (req, res) => res.json(svc.summarize(await svc.rollback(req.params.id, req.user)))));
router.post('/:id/reject', checkId, wrap(async (req, res) => res.json(svc.summarize(await svc.reject(req.params.id, req.user)))));
router.delete('/:id', checkId, wrap(async (req, res) => res.json(await svc.deleteImport(req.params.id, req.user))));

module.exports = router;
