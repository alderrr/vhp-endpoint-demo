'use strict';

// Helpers for creating a compact, human-readable log of OTA messages.
// Works with the parsed objects produced by helpers/xmlParser.js.

const asArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj ?? {}, key);

/**
 * Returns the original PMS reservation ID (Type 10), without filename sanitization.
 * Restrict traversal to reservation IDs to avoid accidentally selecting unrelated IDs.
 */
function extractRawReservationNumber(rootData) {
  for (const group of asArray(rootData?.HotelReservations)) {
    for (const reservation of asArray(group?.HotelReservation)) {
      for (const info of asArray(reservation?.ResGlobalInfo)) {
        for (const idList of asArray(info?.HotelReservationIDs)) {
          for (const id of asArray(idList?.HotelReservationID)) {
            if (String(id?.ResID_Type ?? '').trim() !== '10') continue;
            if (id?.ResID_Value == null) continue;
            const number = String(id.ResID_Value).trim();
            if (number) return number;
          }
        }
      }
    }
  }
  return null;
}

/** Find XML elements by name; handles both single elements and arrays. */
function findElements(obj, elementName, results = []) {
  if (!obj || typeof obj !== 'object') return results;
  if (Array.isArray(obj)) {
    for (const item of obj) findElements(item, elementName, results);
    return results;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (key === elementName) results.push(...asArray(value));
    if (value && typeof value === 'object') findElements(value, elementName, results);
  }
  return results;
}

/**
 * The XML's *business outcome* is independent of the HTTP ACK (202).
 * RS: Errors/Fault take priority over Success. Warnings do not turn Success into Error.
 * For RS errors, preserve all parsed fields within every <Errors> section.
 * RQ: Requests have no Success marker; keep the full request in the daily log.
 */
function getOtaLogDetails({ direction, rootData }) {
  if (direction !== 'RS') return { status: 'REQUEST', warnings: [] };

  const hasErrors =
    findElements(rootData, 'Errors').length > 0 ||
    findElements(rootData, 'Error').length > 0 ||
    findElements(rootData, 'Fault').length > 0;

  if (hasErrors) {
    // Preserve the entire parsed <Errors> subtree, including arbitrary
    // attributes, nested elements, and multiple <Error> entries.
    // The original XML is retained only as a fallback when no <Errors> exists.
    return {
      status: 'ERROR',
      warnings: [],
      errors: findElements(rootData, 'Errors'),
    };
  }

  if (hasOwn(rootData, 'Success')) {
    return { status: 'SUCCESS', warnings: findElements(rootData, 'Warning') };
  }

  // Do not incorrectly record an unrecognized OTA response as SUCCESS.
  return { status: 'UNKNOWN', warnings: [] };
}

module.exports = { extractRawReservationNumber, getOtaLogDetails };
