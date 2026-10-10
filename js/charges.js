(() => {
  const S = J80Store, $ = (id) => document.getElementById(id);
  const EX = ['Développé incliné avec haltères', 'Tirage horizontal à la poulie', 'Tirage vertical à la poulie', 'Développé épaules avec haltères', 'Élévations latérales', 'Pallof press', 'Presse à cuisses ou squat maîtrisé', 'Soulevé de terre roumain avec haltères', 'Fentes arrière', 'Leg curl', 'Mollets à la machine', 'Dead bug'];
  let d = S.load();
  const fmt = (s) => `${s.slice(8)}/${s.slice(5, 7)}`;
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };

  EX.forEach(x => $('ex').append(new Option(x, x)));
  $('ex').append(new Option('Autre exercice…', '__other'));
  $('ex').addEventListener('change', () => { $('exOther').hidden = $('ex').value !== '__other'; });
  $('date').value = S.iso(new Date());

  $('addLoad').addEventListener('click', () => {
    const fb = $('loadFeedback');
    const ex = $('ex').value === '__other' ? $('exOther').value.trim() : $('ex').value;
    const kg = parseFloat($('kg').value.replace(',', '.')), sets = parseInt($('sets').value, 10), reps = parseInt($('reps').value, 10), date = $('date').value;
    if (!ex || !date || !(kg >= 0 && kg <= 1000) || !(sets >= 1 && sets <= 50) || !(reps >= 1 && reps <= 500)) { fb.textContent = 'Vérifie l’exercice, la date, la charge (kg), les séries et les répétitions.'; return; }
    d.loads.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ex: ex.slice(0, 80), date, kg, sets, reps, note: $('note').value.trim().slice(0, 120) });
    fb.textContent = S.save(d) ? 'Enregistré.' : 'Impossible d’enregistrer dans ce navigateur.';
    $('note').value = ''; render();
  });

  function chart(ex) {
    const box = $('chart'); box.textContent = '';
    const by = {}; d.loads.filter(l => l.ex === ex).forEach(l => { by[l.date] = Math.max(by[l.date] || 0, l.kg); });
    const dates = Object.keys(by).sort();
    if (dates.length < 2) { box.append(el('p', 'Il faut au moins deux dates pour tracer une courbe.', 'muted small')); return; }
    const W = 600, H = 200, P = 36, vals = dates.map(k => by[k]), rmin = Math.min(...vals), rmax = Math.max(...vals);
    const min = rmin === rmax ? rmin - 1 : rmin, max = rmin === rmax ? rmax + 1 : rmax;
    const x = (i) => P + i * (W - 2 * P) / (dates.length - 1), y = (v) => H - P - (v - min) * (H - 2 * P) / (max - min);
    const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const dots = vals.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4" fill="var(--accent)"/>`).join('');
    const t = (px, py, anchor, txt) => `<text x="${px}" y="${py}" font-size="12" text-anchor="${anchor}" fill="var(--muted)">${txt}</text>`;
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution de la charge en kg" style="width:100%;height:auto"><line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" stroke="var(--line)"/><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>${dots}${t(P, H - 10, 'start', fmt(dates[0]))}${t(W - P, H - 10, 'end', fmt(dates[dates.length - 1]))}${t(4, y(rmax) + 4, 'start', rmax + ' kg')}${rmin !== rmax ? t(4, y(rmin) + 4, 'start', rmin + ' kg') : ''}</svg>`;
  }

  function render() {
    const sorted = [...d.loads].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    const names = [...new Set(sorted.map(l => l.ex))];
    const f = $('filter'), prev = f.value; f.textContent = '';
    names.forEach(n => f.append(new Option(n, n)));
    f.value = names.includes(prev) ? prev : (sorted.length ? sorted[sorted.length - 1].ex : '');
    $('progress').hidden = !names.length;
    if (names.length) chart(f.value);

    const tb = $('summary'); tb.textContent = '';
    names.forEach(n => {
      const l = sorted.filter(x => x.ex === n), last = l[l.length - 1], best = Math.max(...l.map(x => x.kg));
      const tr = el('tr'); tr.append(el('td', n), el('td', `${last.kg} kg · ${last.sets}×${last.reps} (${fmt(last.date)})`), el('td', `${best} kg`), el('td', String(new Set(l.map(x => x.date)).size)));
      tb.append(tr);
    });

    const h = $('history'); h.textContent = '';
    if (!sorted.length) { h.textContent = 'Aucune charge enregistrée pour le moment.'; return; }
    [...sorted].reverse().slice(0, 50).forEach(l => {
      const row = el('div', undefined, 'loadrow'), info = el('div');
      info.append(el('strong', l.ex), el('p', `${new Date(l.date + 'T00:00').toLocaleDateString('fr-FR')} · ${l.kg} kg · ${l.sets}×${l.reps}${l.note ? ' · ' + l.note : ''}`, 'muted small'));
      const del = el('button', 'Supprimer', 'btn secondary'); del.type = 'button';
      del.addEventListener('click', () => { d.loads = d.loads.filter(x => x.id !== l.id); S.save(d); render(); });
      row.append(info, del); h.append(row);
    });
  }
  $('filter').addEventListener('change', () => chart($('filter').value));
  render();
})();
