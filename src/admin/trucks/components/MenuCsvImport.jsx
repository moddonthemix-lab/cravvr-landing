import React, { useMemo, useState } from 'react';
import { Icons } from '../../../components/common/Icons';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../contexts/ToastContext';

const REQUIRED = ['name', 'price'];
const ALLOWED = ['name', 'price', 'category', 'description', 'emoji', 'image_url'];

/**
 * Parse a CSV string into an array of row-objects keyed by header.
 * Supports double-quoted fields with escaped quotes ("foo, ""bar""").
 * Strips a UTF-8 BOM and trims trailing CR.
 */
export function parseCsv(text) {
  if (!text) return { headers: [], rows: [] };
  const cleaned = text.replace(/^﻿/, '').replace(/\r/g, '');
  const lines = cleaned.split('\n').filter(l => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const splitLine = (line) => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else cur += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { out.push(cur); cur = ''; }
        else cur += c;
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  };

  const headers = splitLine(lines[0]).map(h => h.toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = cells[idx] ?? ''; });
    rows.push(obj);
  }
  return { headers, rows };
}

const MenuCsvImport = ({ truckId, onClose, onImported, existingItems = [] }) => {
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);

  const parsed = useMemo(() => parseCsv(text), [text]);

  const validation = useMemo(() => {
    if (parsed.rows.length === 0) return { ok: false, errors: ['No rows to import'], rows: [] };
    const missing = REQUIRED.filter(r => !parsed.headers.includes(r));
    if (missing.length > 0) return { ok: false, errors: [`Missing required columns: ${missing.join(', ')}`], rows: [] };
    const errors = [];
    const valid = [];
    const baseOrder = (existingItems[existingItems.length - 1]?.display_order ?? -1) + 1;
    parsed.rows.forEach((r, idx) => {
      const rowErrors = [];
      if (!r.name) rowErrors.push('name required');
      const priceNum = parseFloat(r.price);
      if (Number.isNaN(priceNum) || priceNum < 0) rowErrors.push('price must be a non-negative number');
      if (rowErrors.length) {
        errors.push(`Row ${idx + 2}: ${rowErrors.join(', ')}`);
      } else {
        const item = { truck_id: truckId, display_order: baseOrder + idx };
        ALLOWED.forEach(k => {
          if (k === 'price') item[k] = priceNum;
          else if (r[k] !== undefined && r[k] !== '') item[k] = r[k];
        });
        valid.push(item);
      }
    });
    return { ok: errors.length === 0 && valid.length > 0, errors, rows: valid };
  }, [parsed, truckId, existingItems]);

  const handleImport = async () => {
    if (!validation.ok) return;
    setImporting(true);
    try {
      const { error } = await supabase.from('menu_items').insert(validation.rows);
      if (error) throw error;
      showToast(`Imported ${validation.rows.length} items`, 'success');
      onImported?.();
      onClose();
    } catch (err) {
      showToast(err.message || 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <h2>Import menu from CSV</h2>
          <button type="button" className="close-btn" onClick={onClose}>{Icons.x}</button>
        </div>

        <p className="cell-sub">
          Required headers: <code>name</code>, <code>price</code>. Optional: <code>category</code>, <code>description</code>, <code>emoji</code>, <code>image_url</code>.
        </p>
        <pre className="audit-detail" style={{ fontSize: 11, marginBottom: 12 }}>
{`name,price,category,description,emoji
Carne Asada Taco,4.50,Tacos,Grilled steak,🌮
Horchata,3.50,Drinks,House-made,🥤`}
        </pre>

        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste CSV here..."
          style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
        />

        {parsed.rows.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p className="cell-sub">
              {validation.rows.length} valid row{validation.rows.length === 1 ? '' : 's'}
              {validation.errors.length > 0 ? ` · ${validation.errors.length} error${validation.errors.length === 1 ? '' : 's'}` : ''}
            </p>
            {validation.errors.map((e, i) => (
              <p key={i} className="form-error">{e}</p>
            ))}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" disabled={!validation.ok || importing} onClick={handleImport}>
            {importing ? 'Importing…' : `Import ${validation.rows.length || ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCsvImport;
