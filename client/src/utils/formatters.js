export const formatQuoteCode = (id) => {
  if (!id) return 'QT-2026-1001';
  const idStr = String(id);
  if (idStr.startsWith('QT-') && !idStr.includes('-1111-') && !idStr.includes('-4444-') && !idStr.includes('00000000')) {
    return idStr;
  }
  const lastPart = idStr.split('-').pop() || idStr;
  const clean = lastPart.replace(/^0+/, '');
  const shortNum = clean.length > 4 ? clean.slice(-4) : (clean || '1001');
  return `QT-2026-${shortNum.toUpperCase()}`;
};

export const formatSKU = (sku, id) => {
  if (sku && typeof sku === 'string' && !sku.includes('-1111-') && !sku.includes('-0000-')) {
    return sku;
  }
  if (!id) return 'SKU-PROD-101';
  const idStr = String(id);
  const lastPart = idStr.split('-').pop() || idStr;
  const clean = lastPart.replace(/^0+/, '');
  const shortNum = clean.length > 4 ? clean.slice(-4) : (clean || '101');
  return `SKU-PROD-${shortNum.toUpperCase()}`;
};
