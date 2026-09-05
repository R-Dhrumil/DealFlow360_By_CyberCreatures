export const formatQuoteCode = (id) => {
  if (!id) return 'QT-101';
  const raw = String(id).trim();

  // If already formatted like QT-101 or QT-2026-101, return upper case
  if (/^QT-[A-Z0-9-]{3,10}$/i.test(raw)) return raw.toUpperCase();

  // Strip prefix 'q_', 'q-', 'q', 'qt-', etc.
  const cleaned = raw.replace(/^(qt|q)[_-]?/i, '').toUpperCase();

  // If purely numeric digits like "101" or "1001"
  if (/^\d+$/.test(cleaned)) {
    return `QT-${cleaned}`;
  }

  // If it's a UUID or long alphanumeric string, take a clean short 6-char segment
  const alphaNum = cleaned.replace(/[^A-Z0-9]/g, '');
  const shortCode = alphaNum.slice(0, 6);
  return `QT-${shortCode}`;
};

export const formatSKU = (sku, id) => {
  if (sku && typeof sku === 'string' && !sku.includes('-1111-') && !sku.includes('-0000-')) {
    return sku;
  }
  if (!id) return 'SKU-101';
  const idStr = String(id).toUpperCase();
  if (idStr.startsWith('SKU-')) return idStr;
  if (idStr.startsWith('P')) return `SKU-${idStr.slice(1)}`;
  return `SKU-${idStr}`;
};
