export const formatQuoteCode = (id) => {
  if (!id) return 'QT-101';
  const idStr = String(id).toUpperCase();
  if (idStr.startsWith('QT-') || idStr.startsWith('Q-')) return idStr;
  if (idStr.startsWith('Q')) return `QT-${idStr.slice(1)}`;
  return `QT-${idStr}`;
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
