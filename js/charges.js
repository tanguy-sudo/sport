// Charges : courbes d'évolution et récapitulatif par exercice.
(() => {
  const S = J80Store, L = J80Loads, $ = (id) => document.getElementById(id);
  const d = S.load();
  const fmt = (s) => `${s.slice(8)}/${s.slice(5, 7)}`;
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };

  Object.entries(L.METRICS).forEach(([k, m]) => $('metric').append(new Option(m.label, k)));
  // --- Courbe ------------------------------------------------------------
  function chart(ex) {
    const box = $('chart'), metric = $('metric').value, m = L.METRICS[metric];
    box.textContent = '';
    const pts = L.series(d.workouts, ex, metric);
    if (pts.length < 2) { box.append(el('p', 'Il faut au moins deux dates pour tracer une courbe.', 'muted small')); return; }
    const sm = L.summary(pts);
    const W = 600, H = 200, P = 36, vals = pts.map((p) => p.value), rmin = Math.min(...vals), rmax = Math.max(...vals);
    const min = rmin === rmax ? rmin - 1 : rmin, max = rmin === rmax ? rmax + 1 : rmax;
    const x = (i) => P + i * (W - 2 * P) / (pts.length - 1), y = (v) => H - P - (v - min) * (H - 2 * P) / (max - min);
    const line = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const dots = pts.map((p, i) => {
      const best = p.value === sm.best;
      return `<circle cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="${best ? 6 : 4}" fill="${best ? 'var(--gold)' : 'var(--accent)'}"><title>${fmt(p.date)} : ${p.value} ${m.unit}${best ? ' (record)' : ''}</title></circle>`;
    }).join('');
    const t = (px, py, anchor, txt) => `<text x="${px}" y="${py}" font-size="12" text-anchor="${anchor}" fill="var(--muted)">${txt}</text>`;
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${m.label} pour ${ex.replace(/"/g, '')}, de ${sm.first} à ${sm.last}" style="width:100%;height:auto"><line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" stroke="var(--line)"/><polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>${dots}${t(P, H - 10, 'start', fmt(pts[0].date))}${t(W - P, H - 10, 'end', fmt(pts[pts.length - 1].date))}${t(4, y(rmax) + 4, 'start', rmax)}${rmin !== rmax ? t(4, y(rmin) + 4, 'start', rmin) : ''}</svg>`;
    const sign = sm.delta > 0 ? '+' : '';
    box.append(el('p', `Départ ${sm.first} · dernier ${sm.last} · record ${sm.best} (${sign}${sm.delta} depuis le début)`, 'muted small'));
  }

  function render() {
    const names = L.exercises([...d.workouts].sort((a, b) => a.date.localeCompare(b.date)));
    const f = $('filter'), prev = f.value; f.textContent = '';
    names.forEach((n) => f.append(new Option(n, n)));
    f.value = names.includes(prev) ? prev : (names[names.length - 1] || '');
    $('progress').hidden = !names.length;
    $('empty').hidden = names.length > 0;
    if (names.length) chart(f.value);

    const tb = $('summary'); tb.textContent = '';
    names.forEach((n) => {
      const pts = L.series(d.workouts, n, 'max'), sm = L.summary(pts), last = L.lastSets(d.workouts, n);
      const tr = el('tr'); tr.append(el('td', n), el('td', `${L.fmtSets(last)} (${fmt(pts[pts.length - 1].date)})`), el('td', `${sm.best} kg`), el('td', String(pts.length)));
      tb.append(tr);
    });
  }
  $('filter').addEventListener('change', () => chart($('filter').value));
  $('metric').addEventListener('change', () => chart($('filter').value));
  render();
})();
