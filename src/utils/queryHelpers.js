// ---------------------------------------------------------------------------
// utils/queryHelpers.js
// Purpose: small helpers shared by the doctor and patient controllers for
// search, date filters and pagination. Keeping them here avoids duplicating
// the same parsing logic in several endpoints.
// ---------------------------------------------------------------------------

/**
 * Escape user input before putting it inside a RegExp. Without this a search
 * such as "a+b" would be treated as a regular expression and could throw.
 */
function escapeRegex(text = '') {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Read "page" and "limit" from the query string and keep them sensible.
 * - page is at least 1
 * - limit is between 1 and 100 (protects the API from huge responses)
 */
function getPagination(query = {}) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || 10;
  const limit = Math.min(Math.max(requestedLimit, 1), 100);

  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Build a MongoDB createdAt filter from optional ISO date strings.
 * Returns null when neither date is supplied or both are invalid.
 */
function buildDateFilter(dateFrom, dateTo) {
  const range = {};

  if (dateFrom) {
    const start = new Date(dateFrom);
    if (!Number.isNaN(start.getTime())) range.$gte = start;
  }

  if (dateTo) {
    const end = new Date(dateTo);
    if (!Number.isNaN(end.getTime())) {
      // Include the whole selected day, not just midnight.
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
  }

  return Object.keys(range).length > 0 ? range : null;
}

/** Standard pagination object returned beside every list. */
function buildPaginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0,
  };
}

module.exports = {
  escapeRegex,
  getPagination,
  buildDateFilter,
  buildPaginationMeta,
};
