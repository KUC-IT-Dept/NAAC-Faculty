/**
 * benchmarkCatalogue.js  -  /api/faculty/admin/benchmark-catalogue
 *
 * Administrator-only management of the live benchmark definitions (the rules the
 * Analytics -> Benchmark page scores against). `auth` + `adminOnly` on every route.
 *
 *   GET    /                          list (q, criterion 1-7, status, version, mapping, page, limit)
 *   GET    /metric-options            analytics metrics available for the mapping picker
 *   GET    /:metricId                 full definition: scoring rules, inclusivity, analytics mapping
 *   GET    /:metricId/history         audit trail of that record
 *   POST   /                          add a benchmark manually
 *   PATCH  /:metricId                 edit (the metric ID is immutable)
 *   POST   /:metricId/deactivate      hide from Analytics (never deletes)  { reason }
 *   POST   /:metricId/reactivate
 *   DELETE /:metricId                 permanently delete an INACTIVE record (audit kept)
 */

'use strict';

const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const svc = require('../../analytics/services/benchmarkCatalogueService');
const { ImportError } = require('../../analytics/services/benchmarkImportService');

const router = express.Router();
router.use(auth, adminOnly);

const ID_RE = /^[0-9A-Za-z._-]{1,40}$/;
const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); } catch (err) {
    if (err instanceof ImportError) return res.status(err.status).json({ message: err.message, ...err.extra });
    console.error('[benchmark-catalogue]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
const checkId = (req, res, next) => (ID_RE.test(req.params.metricId) ? next() : res.status(404).json({ message: 'Benchmark metric not found.' }));

router.get('/', wrap(async (req, res) => res.json(await svc.list(req.query))));
router.get('/metric-options', wrap(async (req, res) => res.json(await svc.metricOptions())));
router.post('/', wrap(async (req, res) => res.status(201).json(await svc.create(req.body, req.user))));
router.get('/:metricId', checkId, wrap(async (req, res) => res.json(await svc.get(req.params.metricId))));
router.get('/:metricId/history', checkId, wrap(async (req, res) => res.json(await svc.history(req.params.metricId))));
router.patch('/:metricId', checkId, wrap(async (req, res) => res.json(await svc.update(req.params.metricId, req.body, req.user))));
router.post('/:metricId/deactivate', checkId, wrap(async (req, res) => res.json(await svc.setActive(req.params.metricId, false, (req.body || {}).reason, req.user))));
router.post('/:metricId/reactivate', checkId, wrap(async (req, res) => res.json(await svc.setActive(req.params.metricId, true, '', req.user))));
router.delete('/:metricId', checkId, wrap(async (req, res) => res.json(await svc.deleteRecord(req.params.metricId, req.user))));

module.exports = router;
