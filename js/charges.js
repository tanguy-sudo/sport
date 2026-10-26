(() => {
  const S = J80Store, L = J80Loads, $ = (id) => document.getElementById(id);
  const EX = ['Développé incliné avec haltères', 'Tirage horizontal à la poulie', 'Tirage vertical à la poulie', 'Développé épaules avec haltères', 'Élévations latérales', 'Pallof press', 'Presse à cuisses ou squat maîtrisé', 'Soulevé de terre roumain avec haltères', 'Fentes arrière', 'Leg curl', 'Mollets à la machine', 'Dead bug'];
  let d = S.load(), editId = null, deleted = null;
  const fmt = (s) => `${s.slice(8)}/${s.slice(5, 7)}`;
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const say = (msg) => { $('loadFeedback').textContent = msg; };

  EX.forEach(x => $('ex').append(new Option(x, x)));
  $('ex').append(new Option('Autre exercice…', '__other'));
  Object.entries(L.METRICS).forEach(([k, m]) => $('metric').append(new Option(m.label, k)));
  $('ex').addEventListener('change', () => { $('exOther').hidden = $('ex').value !== '__other'; });

  function resetForm() {
    editId = null;
    $('date').value = S.iso(new Date()); $('kg').value = ''; $('note').value = ''; $('exOther').value = ''; $('exOther').hidden = true;
    $('addLoad').textContent = 'Enregistrer'; $('cancelEdit').hidden = true;
  }
  function startEdit(l) {
    editId = l.id;
    if (EX.includes(l.ex)) { $('ex').value = l.ex; $('exOther').hidden = true; } else { $('ex').value = '__other'; $('exOther').hidden = false; $('exOther').value = l.ex; }
    $('date').value = l.date; $('kg').value = l.kg; $('sets').value = l.sets; $('reps').value = l.reps; $('note').value = l.note || '';
    $('addLoad').textContent = 'Mettre à jour'; $('cancelEdit').hidden = false;
    say('Modification en cours.'); $('kg').focus(); $('kg').scrollIntoView({ block: 'center' });
  }

  $('addLoad').addEventListener('click', () => {
    const ex = $('ex').value === '__other' ? $('exOther').value.trim() : $('ex').value;
    const kg = parseFloat($('kg').value.replace(',', '.')), sets = parseInt($('sets').value, 10), reps = parseInt($('reps').value, 10), date = $('date').value;
    if (!ex || !date || !(kg >= 0 && kg <= 1000) || !(sets >= 1 && sets <= 50) || !(reps >= 1 && reps <= 500)) { say('Vérifie l’exercice, la date, la charge (kg), les séries et les répétitions.'); return; }
    const entry = { ex: ex.slice(0, 80), date, kg, sets, reps, note: $('note').value.trim().slice(0, 120) };
    const l = editId && d.loads.find(x => x.id === editId);
    if (l) Object.assign(l, entry); else d.loads.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...entry });
    const ok = S.save(d);
    resetForm(); say(ok ? (l ? 'Modifié.' : 'Enregistré.') : 'Impossible d’enregistrer dans ce navigateur.'); render();
  });
  $('cancelEdit').addEventListener('click', () => { resetForm(); say(''); });
  $('undoDelete').addEventListener('click', () => {
    if (!deleted) return;
    d.loads.push(deleted); deleted = null; S.save(d); say('Entrée restaurée.'); render();
  });

  function chart(ex) {
    const box = $('chart'), metric = $('metric').value, m = L.METRICS[metric];
    box.textContent = '';
    const pts = L.series(d.loads, ex, metric);
    if (pts.length < 2) { box.append(el('p', 'Il faut au moins deux dates pour tracer une courbe.', 'muted small')); return; }
    const sm = L.summary(pts);
    const W = 600, H = 200, P = 36, vals = pts.map(p => p.value), rmin = Math.min(...vals), rmax = Math.max(...vals);
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
    const sorted = [...d.loads].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    const names = [...new Set(sorted.map(l => l.ex))];
    const f = $('filter'), prev = f.value; f.textContent = '';
    names.forEach(n => f.append(new Option(n, n)));
    f.value = names.includes(prev) ? prev : (sorted.length ? sorted[sorted.length - 1].ex : '');
    $('progress').hidden = !names.length;
    $('undoDelete').hidden = !deleted;
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
      const row = el('div', undefined, 'loadrow'), info = el('div'), btns = el('div', undefined, 'actions');
      btns.style.marginTop = '0';
      info.append(el('strong', l.ex), el('p', `${new Date(l.date + 'T00:00').toLocaleDateString('fr-FR')} · ${l.kg} kg · ${l.sets}×${l.reps}${l.note ? ' · ' + l.note : ''}`, 'muted small'));
      const edit = el('button', 'Modifier', 'btn secondary'); edit.type = 'button';
      edit.setAttribute('aria-label', `Modifier ${l.ex} du ${l.date}`);
      edit.addEventListener('click', () => startEdit(l));
      const del = el('button', 'Supprimer', 'btn secondary'); del.type = 'button';
      del.setAttribute('aria-label', `Supprimer ${l.ex} du ${l.date}`);
      del.addEventListener('click', () => {
        deleted = l; d.loads = d.loads.filter(x => x.id !== l.id); S.save(d);
        if (editId === l.id) resetForm();
        say('Entrée supprimée.'); render(); $('undoDelete').focus();
      });
      btns.append(edit, del); row.append(info, btns); h.append(row);
    });
  }
  $('filter').addEventListener('change', () => chart($('filter').value));
  $('metric').addEventListener('change', () => chart($('filter').value));
  resetForm();
  render();
})();