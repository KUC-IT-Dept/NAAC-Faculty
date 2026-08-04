'use strict';

/**
 * Faculty.js publicationSchema.type enum (server/modules/faculty/models/Faculty.js)
 * historically accepted two vocabularies:
 *
 *   canonical (current UI writes these):
 *     'Journal Articles', 'Book Chapters', 'Books Authored / Edited', 'Conference Papers'
 *
 *   legacy (old bulk-imported / pre-migration records still hold these):
 *     'journal', 'book', 'bookChapter', 'conference'
 *
 * Every analytics comparison that reads publication.type must go through
 * normalizePublicationType() so legacy-typed records are counted exactly
 * like their canonical equivalents. Do NOT compare publication.type
 * directly anywhere else in the codebase — import this instead.
 */

const LEGACY_TO_CANONICAL = Object.freeze({
  journal:     'Journal Articles',
  book:        'Books Authored / Edited',
  bookChapter: 'Book Chapters',
  conference:  'Conference Papers',
});

/**
 * Normalize a publication.type value to its canonical display string.
 * Unknown/canonical/empty values pass through unchanged, so this is safe
 * to apply universally without risking a collision with unrelated
 * conditionField values (project status, award level, etc.).
 * @param {string|undefined|null} rawType
 * @returns {string}
 */
function normalizePublicationType(rawType) {
  if (!rawType) return rawType;
  return LEGACY_TO_CANONICAL[rawType] || rawType;
}

/**
 * True if a publication document's type matches the given canonical type,
 * regardless of whether the stored value is legacy or canonical.
 * @param {{type?: string}} publication
 * @param {string} canonicalType
 */
function publicationTypeMatches(publication, canonicalType) {
  return normalizePublicationType(publication && publication.type) === canonicalType;
}

module.exports = { LEGACY_TO_CANONICAL, normalizePublicationType, publicationTypeMatches };
