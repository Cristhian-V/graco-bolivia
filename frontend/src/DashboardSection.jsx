import { Fragment, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getDashboardData, getDashboardFilters, getDashboardKpis, getMarcadores, putMarcadores } from './api.js';

const SERIES = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#e11d48', '#a855f7', '#0ea5e9', '#d946ef'];

const MONTH_KEYS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTH_CAP = { ene: 'Ene', feb: 'Feb', mar: 'Mar', abr: 'Abr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Ago', sep: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dic' };
const MES_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function fmt(n, d = 0) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmt$(n) { return `$ ${fmt(n, 2)}`; }
function sl(s, m = 28) {
  if (!s) return '';
  const str = String(s).trim();
  return str.length > m ? `${str.slice(0, m)}…` : str;
}

function weekLabel(inicio) {
  if (!inicio) return '—';
  const d = new Date(`${inicio}T00:00:00`);
  const e = new Date(d);
  e.setDate(d.getDate() + 6);
  const f = (x) => `${x.getDate()} ${MES_ABBR[x.getMonth()]}`;
  return `${f(d)} - ${f(e)}`;
}

function svgEl(el, w, h, margin) {
  el.innerHTML = '';
  const m = margin || { top: 10, right: 20, bottom: 30, left: 20 };
  const svg = d3.select(el).append('svg')
    .attr('viewBox', `0 0 ${w} ${h}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
  return { svg, g, w: w - m.left - m.right, h: h - m.top - m.bottom, m };
}

// ==================== D3 MULTI-LINE (frecuencia por importador) ====================
function procColor(i) {
  return d3.hsl((i * 137.508) % 360, 0.62, 0.46).formatHex();
}

function d3MultiLine(el, model, highlight) {
  const { labels, top, colorOf } = model;
  const w = 1000, h = 420, m = { top: 10, right: 30, bottom: 50, left: 50 };
  const { g, w: iw, h: ih } = svgEl(el, w, h, m);

  if (!labels.length || !top.length) {
    g.append('text').attr('x', iw / 2).attr('y', ih / 2).attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af').style('font-size', '13px').text('Sin datos');
    return;
  }

  const maxV = d3.max(top, (s) => d3.max(s.values)) || 0;
  const x = d3.scalePoint().domain(labels).range([0, iw]).padding(0.5);
  const y = d3.scaleLinear().domain([0, Math.max(1, maxV)]).nice().range([ih, 0]);

  g.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(''));
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5)).selectAll('text').style('font-size', '12px');
  g.append('text').attr('transform', 'rotate(-90)').attr('x', -ih / 2).attr('y', -38)
    .attr('fill', '#374151').style('font-size', '13px').style('text-anchor', 'middle').text('Operaciones');

  g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x))
    .selectAll('text').attr('fill', '#6b7280').style('font-size', '12px');

  const line = d3.line().x((d, i) => x(labels[i])).y((d) => y(d)).curve(d3.curveMonotoneX);

  top.forEach((s) => {
    const color = colorOf(s.name);
    const dim = highlight && highlight !== s.name;
    const isHi = highlight === s.name;

    g.append('path').datum(s.values)
      .attr('fill', 'none').attr('stroke', color)
      .attr('stroke-width', isHi ? 4 : 2.5)
      .attr('stroke-opacity', dim ? 0.15 : 1)
      .attr('d', line);

    const pts = s.values.map((v, i) => ({ v, label: labels[i] }));
    g.selectAll(null).data(pts).join('circle')
      .attr('cx', (p, i) => x(labels[i]))
      .attr('cy', (p) => y(p.v))
      .attr('r', isHi ? 5 : 3.5)
      .attr('fill', color).attr('stroke', '#fff').attr('stroke-width', 1.5)
      .attr('fill-opacity', dim ? 0.15 : 1)
      .on('mouseover', function (evt, p) {
        tip.show(evt, `<strong>${sl(s.name, 35)}</strong><br>${p.label}: ${fmt(p.v)} ops`);
      })
      .on('mouseout', function () { tip.hide(); });
  });
}

function buildFrecuenciaModel(data, nImp, filtro) {
  const monthly = (data && data.monthly_ops) || {};
  const weekly = (data && data.weekly_ops) || {};
  const semanas = (data && data.semanas) || [];
  const selected = (filtro && filtro.meses) || [];

  const weeklyMode = selected.length === 1 && semanas.length > 0;
  const source = weeklyMode ? weekly : monthly;

  let keys;
  let labels;
  if (weeklyMode) {
    keys = semanas.slice().sort();
    labels = keys.map((s) => weekLabel(s));
  } else {
    const now = new Date();
    const y = parseInt(filtro && filtro.anio, 10);
    let maxMes = 12;
    if (!Number.isNaN(y)) {
      if (y === now.getFullYear()) maxMes = Math.max(1, now.getMonth() + 1);
      else if (y > now.getFullYear()) maxMes = 0;
    }
    keys = MONTH_KEYS.slice(0, maxMes);
    labels = keys.map((m) => MONTH_CAP[m] || m);
  }

  const names = Object.keys(source).sort((a, b) => a.localeCompare(b));
  const colorOf = (name) => procColor(Math.max(0, names.indexOf(name)));
  const totals = {};
  names.forEach((n) => { totals[n] = keys.reduce((s, k) => s + ((source[n] && source[n][k]) || 0), 0); });
  const top = names.slice()
    .sort((a, b) => (totals[b] - totals[a]) || a.localeCompare(b))
    .slice(0, Math.max(1, nImp))
    .map((name) => ({ name, total: totals[name], values: keys.map((k) => (source[name] && source[name][k]) || 0) }));

  return { labels, keys, weeklyMode, names, colorOf, totals, top };
}

// ==================== D3 BENCHMARK ====================
function d3Benchmark(el, priceByCompany, precioMarcador) {
  const entries = Object.entries(priceByCompany).filter((e) => e[1] > 0).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return;
  const w = 1000, h = 380, m = { top: 10, right: 50, bottom: 100, left: 60 };
  const { svg, g, w: iw, h: ih } = svgEl(el, w, h, m);

  const labels = entries.map((e) => sl(e[0], 24));
  const prices = entries.map((e) => e[1]);
  const yMax = Math.ceil(d3.max(prices) / 200) * 200 + 200;

  const x = d3.scalePoint().domain(labels).range([0, iw]).padding(0.5);
  const y = d3.scaleLinear().domain([0, yMax]).range([ih, 0]);

  g.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).ticks(Math.ceil(yMax / 200)).tickSize(-iw).tickFormat(''));
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(Math.ceil(yMax / 200)));
  g.append('text').attr('transform', 'rotate(-90)').attr('x', -ih / 2).attr('y', -46)
    .attr('fill', '#374151').style('font-size', '13px').style('text-anchor', 'middle').text('USD / M³');

  const xAxisG = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`);
  xAxisG.selectAll('.tick').data(labels).join('g')
    .attr('class', 'tick').attr('transform', (d) => `translate(${x(d)},0)`)
    .append('line').attr('y2', 6).attr('stroke', '#d1d5db');
  xAxisG.selectAll('.xlabel').data(entries).join('text')
    .attr('class', 'xlabel').attr('x', (d) => x(sl(d[0], 24))).attr('y', (d, i) => 16 + (i % 2) * 14)
    .attr('text-anchor', 'middle').attr('fill', '#1f2937').style('font-size', '11px')
    .text((d) => sl(d[0], 24));

  const line1 = d3.line().x((d, i) => x(labels[i])).y((d) => y(d)).curve(d3.curveLinear);
  g.append('path').datum(prices).attr('fill', 'none').attr('stroke', '#ef4444').attr('stroke-width', 2.5).attr('d', line1);

  g.selectAll('.bdot').data(entries).join('circle')
    .attr('cx', (d) => x(sl(d[0], 24))).attr('cy', (d) => y(d[1]))
    .attr('r', 5).attr('fill', '#ef4444').attr('stroke', '#fff').attr('stroke-width', 1.5)
    .on('mouseover', function (evt, d) {
      d3.select(this).attr('r', 8);
      tip.show(evt, `<strong>${sl(d[0], 35)}</strong><br>Precio Promedio: $${fmt(d[1], 2)}/M³`);
    })
    .on('mouseout', function () { d3.select(this).attr('r', 5); tip.hide(); });

  g.selectAll('.dlbl').data(entries).join('text')
    .attr('class', 'dlbl')
    .attr('x', (d) => x(sl(d[0], 24))).attr('y', (d) => y(d[1]) - 10)
    .attr('text-anchor', 'middle').attr('fill', '#dc2626').style('font-size', '11px').style('font-weight', '600')
    .text((d) => fmt(d[1], 0));

  const refY = y(precioMarcador);
  g.append('line').attr('x1', 0).attr('x2', iw).attr('y1', refY).attr('y2', refY)
    .attr('stroke', '#2563eb').attr('stroke-width', 2.5).attr('stroke-dasharray', '6,4');
  g.append('text').attr('x', iw - 4).attr('y', refY - 10).attr('text-anchor', 'end')
    .attr('fill', '#2563eb').style('font-size', '12px').style('font-weight', '600')
    .text(`Promedio General: $${fmt(precioMarcador, 0)}`);

  const legend = g.append('g').attr('transform', `translate(${iw / 2},${ih + 55})`);
  const items = [
    { color: '#ef4444', label: 'Precio Promedio por Empresa', dot: true },
    { color: '#2563eb', label: 'Promedio General de Referencia', dot: false },
  ];
  let lx = 0;
  items.forEach((it) => {
    const lg = legend.append('g').attr('transform', `translate(${lx},0)`);
    if (it.dot) {
      lg.append('line').attr('x1', 0).attr('x2', 16).attr('y1', 0).attr('y2', 0).attr('stroke', it.color).attr('stroke-width', 2.5);
      lg.append('circle').attr('cx', 8).attr('cy', 0).attr('r', 3).attr('fill', it.color);
    } else {
      lg.append('line').attr('x1', 0).attr('x2', 20).attr('y1', 0).attr('y2', 0).attr('stroke', it.color).attr('stroke-width', 2.5).attr('stroke-dasharray', '4,3');
    }
    lg.append('text').attr('x', 24).attr('y', 4).text(it.label).attr('fill', '#6b7280').style('font-size', '12px');
    lx += lg.node().getBBox().width + 24;
  });
  legend.attr('transform', `translate(${(iw - lx) / 2},${ih + 55})`);
}

// ==================== D3 HORIZONTAL BAR ====================
function d3HBar(el, obj, unit, fs = 12) {
  const entries = Object.entries(obj).sort((a, b) => a[1] - b[1]);
  if (!entries.length) return;
  const labels = entries.map((e) => sl(e[0], 36));
  const values = entries.map((e) => e[1]);
  const maxVal = d3.max(values) || 1;
  const barH = 20, gap = 8, totalH = entries.length * (barH + gap) + 30;
  const m = { top: 5, right: 60, bottom: 5, left: 190 };
  const w = 700, h = Math.max(200, totalH);
  const { svg, g, w: iw } = svgEl(el, w, h, m);

  const x = d3.scaleLinear().domain([0, maxVal]).range([0, iw]);
  const y = d3.scaleBand().domain(labels).range([0, entries.length * (barH + gap)]).padding(0.2);

  g.append('g').attr('class', 'grid')
    .call(d3.axisTop(x).ticks(5).tickSize(-(entries.length * (barH + gap))).tickFormat(''));

  g.selectAll('.ylabel').data(entries).join('text')
    .attr('class', 'ylabel')
    .attr('x', -6).attr('y', (d) => y(sl(d[0], 36)) + barH / 2 + 4)
    .attr('text-anchor', 'end')
    .attr('fill', '#1f2937').style('font-size', `${fs}px`)
    .text((d) => sl(d[0], 26));

  const bars = g.selectAll('rect').data(entries).join('rect')
    .attr('x', 0).attr('y', (d) => y(sl(d[0], 36)))
    .attr('width', (d) => x(d[1])).attr('height', barH)
    .attr('rx', 4).attr('ry', 4)
    .attr('fill', (d, i) => ((d._ci = i), SERIES[i % SERIES.length] + 'cc'))
    .attr('stroke', (d, i) => SERIES[i % SERIES.length]).attr('stroke-width', 1);

  bars.on('mouseover', function (evt, d) {
    d3.select(this).attr('fill', SERIES[d._ci % SERIES.length]);
    tip.show(evt, `<strong>${sl(d[0], 40)}</strong><br>${fmt(d[1], 2)} ${unit || ''}`);
  }).on('mouseout', function (evt, d) {
    d3.select(this).attr('fill', SERIES[d._ci % SERIES.length] + 'cc');
    tip.hide();
  });

  g.selectAll('.blabel').data(entries).join('text')
    .attr('class', 'blabel').attr('x', (d) => x(d[1]) + 4).attr('y', (d) => y(sl(d[0], 36)) + barH / 2 + 4)
    .text((d) => fmt(d[1], 0)).attr('fill', '#1f2937').style('font-size', `${fs}px`);

  g.append('g').attr('class', 'axis').attr('transform', `translate(0,${entries.length * (barH + gap)})`)
    .call(d3.axisBottom(x).ticks(5)).selectAll('text').attr('fill', '#6b7280');
}

// ==================== D3 DONUT ====================
function d3Donut(el, obj, unit) {
  const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return;
  const w = 320, h = 320, m = { top: 10, right: 10, bottom: 70, left: 10 };
  const { svg, g, w: iw, h: ih } = svgEl(el, w, h, m);
  const radius = Math.min(iw, ih) / 2 - 15;
  const cx = iw / 2, cy = ih / 2;
  const total = d3.sum(entries.map((e) => e[1]));

  const pie = d3.pie().value((d) => d[1]).sort(null);
  const arc = d3.arc().innerRadius(radius * 0.52).outerRadius(radius);
  const labelArc = d3.arc().innerRadius(radius * 0.75).outerRadius(radius * 0.75);
  const arcs = pie(entries);

  g.attr('transform', `translate(${cx},${cy})`);

  g.selectAll('path').data(arcs).join('path')
    .attr('d', arc).attr('fill', (d, i) => ((d.data._ci = i), SERIES[i % SERIES.length] + 'dd'))
    .attr('stroke', (d, i) => SERIES[i % SERIES.length]).attr('stroke-width', 1.5)
    .on('mouseover', function (evt, d) {
      d3.select(this).attr('fill', SERIES[d.data._ci % SERIES.length]).attr('transform', 'scale(1.05)');
      const pct = (d.data[1] / total * 100).toFixed(1);
      tip.show(evt, `<strong>${sl(d.data[0], 30)}</strong><br>${fmt(d.data[1], 0)} ${unit || ''} (${pct}%)`);
    })
    .on('mouseout', function (evt, d) {
      d3.select(this).attr('fill', SERIES[d.data._ci % SERIES.length] + 'dd').attr('transform', 'scale(1)');
      tip.hide();
    });

  g.selectAll('.pct-label').data(arcs).join('text')
    .attr('class', 'pct-label')
    .attr('transform', (d) => `translate(${labelArc.centroid(d)})`)
    .attr('text-anchor', 'middle').attr('fill', '#1f2937').style('font-size', '12px').style('font-weight', '700')
    .text((d) => {
      const pct = (d.data[1] / total * 100);
      return pct >= 5 ? `${pct.toFixed(1)}%` : '';
    });

  g.append('text').attr('text-anchor', 'middle').attr('dy', '-0.3em')
    .attr('fill', '#1f2937').style('font-size', '15px').style('font-weight', '700')
    .text(fmt(total, 0));
  g.append('text').attr('text-anchor', 'middle').attr('dy', '1em')
    .attr('fill', '#6b7280').style('font-size', '11px').text(unit || 'Total');

  const legend = g.append('g').attr('transform', `translate(${-iw / 2 + 5},${cy + radius + 18})`);
  let ly = 0;
  entries.forEach(([k, v], i) => {
    const pct = (v / total * 100).toFixed(1);
    const lg = legend.append('g').attr('transform', `translate(0,${ly})`);
    lg.append('rect').attr('width', 8).attr('height', 8).attr('rx', 2).attr('fill', SERIES[i % SERIES.length]);
    lg.append('text').attr('x', 12).attr('y', 9)
      .text(`${sl(k, 16)} (${pct}%)`).attr('fill', '#6b7280').style('font-size', '10px');
    ly += 15;
  });
}

// ==================== D3 BUBBLE (empresa vs Bs/litro) ====================
function d3Bubble(el, rows, marcadores) {
  const marcas = (marcadores || []).map(Number).filter((n) => Number.isFinite(n));
  const entries = (rows || [])
    .slice()
    .sort((a, b) => b.volumen - a.volumen)
    .slice(0, 7)
    .sort((a, b) => b.precio_bs_litro - a.precio_bs_litro);
  const w = 1000, h = 460, m = { top: 10, right: 60, bottom: 110, left: 70 };
  const { svg, g, w: iw, h: ih } = svgEl(el, w, h, m);

  const labels = entries.map((e) => sl(e.empresa, 24));
  const yMin = 0;
  const maxPrecio = d3.max(entries, (e) => Number(e.precio_bs_litro)) || 0;
  const maxMarca = marcas.length ? Math.max(...marcas) : 0;
  const yMax = Math.max(Math.ceil(Math.max(maxPrecio, maxMarca, 20)) + 1, 20);

  const x = d3.scalePoint().domain(labels).range([0, iw]).padding(0.5);
  const y = d3.scaleLinear().domain([yMin, yMax]).range([ih, 0]);

  g.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).ticks(6).tickSize(-iw).tickFormat(''));
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(6)).selectAll('text').style('font-size', '14px');
  g.append('text').attr('transform', 'rotate(-90)').attr('x', -ih / 2).attr('y', -56)
    .attr('fill', '#374151').style('font-size', '15px').style('text-anchor', 'middle').text('Bs / Litro');

  marcas.forEach((v) => {
    g.append('line').attr('x1', 0).attr('x2', iw).attr('y1', y(v)).attr('y2', y(v))
      .attr('stroke', '#f59e0b').attr('stroke-width', 2).attr('stroke-dasharray', '6,4');
    g.append('text').attr('x', iw - 4).attr('y', y(v) - 10).attr('text-anchor', 'end')
      .attr('fill', '#d97706').style('font-size', '15px').style('font-weight', '700')
      .text(`${v} Bs/L`);
  });

  g.selectAll('.bubble').data(entries).join('ellipse')
    .attr('class', 'bubble')
    .attr('cx', (e) => x(sl(e.empresa, 24)))
    .attr('cy', (e) => y(e.precio_bs_litro))
    .attr('rx', 14).attr('ry', 7)
    .attr('fill', '#3b82f6').attr('fill-opacity', 0.55).attr('stroke', '#2563eb').attr('stroke-width', 1.5)
    .on('mouseover', function (evt, e) {
      d3.select(this).attr('fill-opacity', 0.9);
      tip.show(evt, `<strong>${sl(e.empresa, 35)}</strong><br>Precio: ${fmt(e.precio_bs_litro, 2)} Bs/L<br>Volumen: ${fmt(e.volumen, 2)} m³`);
    })
    .on('mouseout', function () { d3.select(this).attr('fill-opacity', 0.55); tip.hide(); });

  g.selectAll('.bubble-vol').data(entries).join('text')
    .attr('class', 'bubble-vol')
    .attr('x', (e) => x(sl(e.empresa, 24)))
    .attr('y', (e) => y(e.precio_bs_litro) - 11)
    .attr('text-anchor', 'middle')
    .attr('fill', '#374151').style('font-size', '12px').style('font-weight', '700')
    .text((e) => `${fmt(e.volumen, 0)} M³`);

  if (labels.length) {
    const xAxisG = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`);
    xAxisG.selectAll('.tick').data(entries).join('g')
      .attr('class', 'tick').attr('transform', (e) => `translate(${x(sl(e.empresa, 24))},0)`)
      .append('line').attr('y2', 6).attr('stroke', '#d1d5db');
    xAxisG.selectAll('.xlabel').data(entries).join('text')
      .attr('class', 'xlabel').attr('x', (e) => x(sl(e.empresa, 24))).attr('y', (e, i) => 16 + (i % 2) * 14)
      .attr('text-anchor', 'middle').attr('fill', '#1f2937').style('font-size', '11px')
      .text((e) => sl(e.empresa, 24));
  } else {
    g.append('text').attr('x', iw / 2).attr('y', ih / 2).attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af').style('font-size', '13px').text('Sin datos');
  }
}

// Tooltip global (elemento único en el DOM).
const tip = {
  el: null,
  ensure() {
    if (this.el) return;
    this.el = document.createElement('div');
    this.el.className = 'dash-tooltip';
    this.el.style.position = 'absolute';
    this.el.style.opacity = '0';
    document.body.appendChild(this.el);
  },
  show(evt, html) {
    this.ensure();
    this.el.innerHTML = html;
    this.el.style.opacity = '1';
    this.el.style.left = `${evt.pageX + 12}px`;
    this.el.style.top = `${evt.pageY - 28}px`;
  },
  hide() {
    if (this.el) this.el.style.opacity = '0';
  },
};

const EMPTY_FILTERS = () => ({ importador: [], proveedor: [], procedencia: [], aduana: [], desde: '', hasta: '' });

function hasActiveFilters(filters) {
  return Object.entries(filters || {}).some(([, v]) => (Array.isArray(v) ? v.length > 0 : Boolean(v)));
}

function useDashboardData(tab, globalFiltro, filters, extra = {}, soloAnio = false) {
  const [state, setState] = useState({ data: null, loading: false, error: null });
  const key = JSON.stringify([tab, globalFiltro, filters, extra, soloAnio]);
  useEffect(() => {
    let alive = true;
    setState({ data: null, loading: true, error: null });
    const params = {
      ...filters,
      anio: globalFiltro && globalFiltro.anio,
      producto: [tab === 'diesel' ? 'DIESEL' : 'GASOLINA'],
      ...extra,
    };
    if (!soloAnio && globalFiltro && globalFiltro.meses && globalFiltro.meses.length) {
      params.mes = globalFiltro.meses;
    }
    getDashboardData(params)
      .then((d) => { if (alive) setState({ data: d, loading: false, error: null }); })
      .catch((e) => { if (alive) setState({ data: null, loading: false, error: e.message }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

function useKpis(tab, globalFiltro) {
  const [kpi, setKpi] = useState(null);
  const key = JSON.stringify([tab, globalFiltro]);
  useEffect(() => {
    let alive = true;
    getDashboardKpis(
      tab === 'diesel' ? 'DIESEL' : 'GASOLINA',
      globalFiltro && globalFiltro.anio,
      globalFiltro && globalFiltro.meses,
    )
      .then((d) => { if (alive) setKpi(d); })
      .catch(() => { if (alive) setKpi(null); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return kpi;
}

function FilterPanel({ filters, onChange, options }) {
  function set(k, v) { onChange({ ...filters, [k]: v }); }
  function setRango(k, v) { onChange({ ...filters, [k]: v, mes: [] }); }

  const importadores = options && options.importador ? options.importador : [];

  return (
    <div className="dash-fpanel">
      <div className="dash-fg dash-fg-wide">
        <label>Importadores</label>
        <div className="dash-checklist">
          {importadores.map((o) => {
            const val = typeof o === 'string' ? o : o.value;
            const lbl = typeof o === 'string' ? o : (o.label || o.value);
            return (
              <label className="dash-check" key={val}>
                <input
                  type="checkbox"
                  checked={(filters.importador || []).includes(val)}
                  onChange={(e) => {
                    const base = filters.importador || [];
                    const next = e.target.checked ? [...base, val] : base.filter((x) => x !== val);
                    set('importador', next);
                  }}
                />
                <span title={lbl}>{sl(lbl, 22)}</span>
              </label>
            );
          })}
        </div>
      </div>

      {[
        ['proveedor', 'Proveedor'],
        ['procedencia', 'Procedencia'],
        ['aduana', 'Aduana'],
      ].map(([k, label]) => (
        <div className="dash-fg" key={k}>
          <label>{label}</label>
          <select
            multiple
            value={filters[k]}
            onChange={(e) => set(k, [...e.target.selectedOptions].map((o) => o.value))}
          >
            {(options && options[k] ? options[k] : []).filter(Boolean).map((o) => {
              const val = typeof o === 'string' ? o : o.value;
              const lbl = typeof o === 'string' ? o : o.label;
              return <option key={val} value={val}>{sl(lbl, 20)}</option>;
            })}
          </select>
        </div>
      ))}

      <div className="dash-fg">
        <label>Desde</label>
        <input type="date" value={filters.desde || ''} onChange={(e) => setRango('desde', e.target.value)} />
      </div>
      <div className="dash-fg">
        <label>Hasta</label>
        <input type="date" value={filters.hasta || ''} onChange={(e) => setRango('hasta', e.target.value)} />
      </div>

      <button type="button" className="dash-btn" onClick={() => onChange(EMPTY_FILTERS())}>Limpiar</button>
    </div>
  );
}

function CardFrame({ title, open, onToggle, active, filtro, setFiltro, options, soloAnio, singleMonth, headerExtra, children }) {
  function toggleMes(i) {
    const key = String(i);
    if (singleMonth) {
      setFiltro({ ...filtro, meses: filtro.meses.includes(key) ? [] : [key] });
      return;
    }
    const next = filtro.meses.includes(key)
      ? filtro.meses.filter((m) => m !== key)
      : [...filtro.meses, key];
    setFiltro({ ...filtro, meses: next });
  }

  return (
    <div className="dash-card">
      <div className="dash-card-head">
        <h3 className="dash-card-title">{title}</h3>
        <div className="dash-card-hf">
          {headerExtra}
          <select
            className="dash-year"
            value={filtro.anio}
            onChange={(e) => setFiltro({ ...filtro, anio: e.target.value })}
          >
            {(options && options.anio ? options.anio : []).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {!soloAnio && (
            <div className="dash-months">
              {MES_ABBR.map((lbl, i) => {
                const key = String(i + 1);
                return (
                  <button
                    type="button"
                    key={key}
                    className={filtro.meses.includes(key) ? 'on' : ''}
                    onClick={() => toggleMes(i + 1)}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>
          )}
          <button type="button" className="dash-filter-toggle" onClick={onToggle}>
            <span className="dash-filter-caret">{open ? '▾' : '▸'}</span> Filtros{active ? ' · activos' : ''}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function ChartCard({ title, tab, options, extra, render, minHeight, soloAnio, extraTop, renderKey }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtro, setFiltro] = useState(defaultFiltro);
  const [open, setOpen] = useState(false);
  const { data, loading, error } = useDashboardData(tab, filtro, filters, extra, soloAnio);
  const ref = useRef(null);

  useEffect(() => {
    if (data && render && ref.current) render(ref.current, data, { filters, options, filtro });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, renderKey]);

  return (
    <CardFrame
      title={title}
      open={open}
      onToggle={() => setOpen((o) => !o)}
      active={hasActiveFilters(filters)}
      filtro={filtro}
      setFiltro={setFiltro}
      options={options}
      soloAnio={soloAnio}
    >
      {open && <FilterPanel filters={filters} onChange={setFilters} options={options} />}
      {extraTop}
      {error && <p className="error">{error}</p>}
      {loading && <p className="empty">Cargando…</p>}
      {!loading && !error && !data && <p className="empty">Sin datos.</p>}
      <div className="dash-cw" ref={ref} style={minHeight ? { minHeight } : undefined} />
    </CardFrame>
  );
}

function WeeklyTable({ tab, options }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtro, setFiltro] = useState(defaultFiltro);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const { data, loading, error } = useDashboardData(tab, filtro, filters, { chart: 'weekly' });
  const weeks = data && data.weekly ? data.weekly : [];

  return (
    <CardFrame
      title="Precio Promedio Ponderado por Semana (USD/m³)"
      open={open}
      onToggle={() => setOpen((o) => !o)}
      active={hasActiveFilters(filters)}
      filtro={filtro}
      setFiltro={setFiltro}
      options={options}
    >
      {open && <FilterPanel filters={filters} onChange={setFilters} options={options} />}
      {error && <p className="error">{error}</p>}
      {loading && <p className="empty">Cargando…</p>}
      {!loading && !error && data && weeks.length === 0 && <p className="empty">Sin datos.</p>}
      {data && weeks.length > 0 && (
        <div className="table-scroll">
          <table className="dash-weekly">
            <thead>
              <tr>
                <th>Semana</th>
                <th>Importadores</th>
                <th>Importación (USD/m³)</th>
                <th>Marcador (USD/m³)</th>
                <th>Spread (USD/m³)</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w, i) => {
                const spread = w.importacion != null && w.marcador != null
                  ? Math.round((w.importacion - w.marcador) * 100) / 100
                  : null;
                const imp = w.importadores ? w.importadores.split(' | ').filter(Boolean) : [];
                return (
                  <Fragment key={w.inicio}>
                    <tr
                      className="dash-weekly-row"
                      onClick={() => setExpanded(expanded === i ? null : i)}
                    >
                      <td>{weekLabel(w.inicio)}</td>
                      <td>{imp.length} {imp.length === 1 ? 'importador' : 'importadores'}</td>
                      <td>{fmt$(w.importacion)}</td>
                      <td>{fmt$(w.marcador)}</td>
                      <td className={spread == null ? '' : spread >= 0 ? 'pos' : 'neg'}>{fmt$(spread)}</td>
                    </tr>
                    {expanded === i && (
                      <tr className="dash-weekly-expand">
                        <td colSpan={5}>
                          <div className="dash-weekly-names">
                            {imp.map((n, k) => <span key={k}>{n}</span>)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </CardFrame>
  );
}

function MarcadorEditor({ valores, onChange, canWrite, onAplicar }) {
  if (!canWrite) return null;

  function setValor(i, v) {
    const next = valores.slice();
    next[i] = v;
    onChange(next);
  }
  function agregar() {
    onChange([...valores, '']);
  }
  function quitar(i) {
    onChange(valores.filter((_, k) => k !== i));
  }

  return (
    <div className="dash-markers">
      <span className="dash-markers-label">Marcadores (Bs/L):</span>
      {valores.map((v, i) => (
        <span className="dash-marker-chip" key={i}>
          <input
            type="number"
            step="0.1"
            value={v}
            onChange={(e) => setValor(i, e.target.value)}
          />
          <button type="button" className="dash-marker-x" onClick={() => quitar(i)} title="Quitar">×</button>
        </span>
      ))}
      <button type="button" className="dash-btn dash-btn-sm" onClick={agregar}>+ Marcador</button>
      <button type="button" className="dash-btn dash-btn-sm" onClick={onAplicar}>Aplicar</button>
    </div>
  );
}

function BubbleCard({ title, tab, options, ypfb, marcadores, canWrite, onAplicar }) {
  const grafico = ypfb ? 'ypfb' : 'empresa';
  const extra = ypfb
    ? { chart: 'burbujas', importador: ['YPFB', '1020269020'] }
    : { chart: 'burbujas' };
  const [local, setLocal] = useState(marcadores || []);

  useEffect(() => {
    setLocal(marcadores || []);
  }, [marcadores]);

  return (
    <ChartCard
      title={title}
      tab={tab}
      options={options}
      extra={extra}
      renderKey={JSON.stringify(local)}
      extraTop={
        <MarcadorEditor
          valores={local}
          onChange={setLocal}
          canWrite={canWrite}
          onAplicar={() => onAplicar(grafico, local)}
        />
      }
      render={(el, d) => d3Bubble(el, d.burbujas, local)}
    />
  );
}

function AduanaTable({ model, matrix, aduanas, highlight, setHighlight }) {
  const names = model.top.map((s) => s.name);
  const cell = (n, a) => (matrix[n] && matrix[n][a]) || 0;
  const cols = aduanas.filter((a) => names.some((n) => cell(n, a) > 0));
  if (!names.length || !cols.length) return <p className="empty">Sin datos.</p>;

  const maxCell = Math.max(1, ...names.flatMap((n) => cols.map((a) => cell(n, a))));
  const colTotals = cols.map((a) => names.reduce((s, n) => s + cell(n, a), 0));
  const grand = colTotals.reduce((s, v) => s + v, 0);

  return (
    <div className="table-scroll">
      <table className="dash-aduana">
        <thead>
          <tr>
            <th className="dash-aduana-name">Importador</th>
            {cols.map((a) => <th key={a}>{a}</th>)}
            <th className="tot">Total</th>
          </tr>
        </thead>
        <tbody>
          {names.map((n) => {
            const rowTotal = cols.reduce((s, a) => s + cell(n, a), 0);
            return (
              <tr
                key={n}
                className={highlight === n ? 'on' : ''}
                onMouseEnter={() => setHighlight(n)}
                onMouseLeave={() => setHighlight(null)}
              >
                <td className="dash-aduana-name">
                  <span className="dash-legend-sw" style={{ background: model.colorOf(n) }} />
                  {sl(n, 32)}
                </td>
                {cols.map((a) => {
                  const v = cell(n, a);
                  const p = Math.round((v / maxCell) * 85);
                  return (
                    <td
                      key={a}
                      className={v ? '' : 'empty'}
                      style={v ? { background: `color-mix(in oklab, #2a78d6 ${p}%, #ffffff)`, color: p > 45 ? '#fff' : undefined } : undefined}
                    >
                      {v}
                    </td>
                  );
                })}
                <td className="tot">{rowTotal}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className="dash-aduana-name">Total</td>
            {colTotals.map((v, i) => <td key={cols[i]}>{v}</td>)}
            <td className="tot">{grand}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function FrecuenciaAduanas({ tab, options }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtro, setFiltro] = useState(defaultFiltro);
  const [nImp, setNImp] = useState(7);
  const [openChart, setOpenChart] = useState(false);
  const [openTable, setOpenTable] = useState(false);
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [fijar, setFijar] = useState(false);
  const highlight = hover || (fijar ? pinned : null);
  const { data, loading, error } = useDashboardData(tab, filtro, filters, { chart: 'frecuencia' });
  const chartRef = useRef(null);

  const matrix = (data && data.aduana_matrix) || {};
  const aduanas = (data && data.aduanas) || [];
  const model = buildFrecuenciaModel(data, nImp, filtro);

  useEffect(() => {
    if (chartRef.current) d3MultiLine(chartRef.current, model, highlight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, nImp, highlight, loading]);

  function clickNombre(n) {
    if (!fijar) return;
    setPinned((cur) => (cur === n ? null : n));
  }

  function toggleFijar(e) {
    const v = e.target.checked;
    setFijar(v);
    if (!v) setPinned(null);
  }

  const cantidad = (
    <div className="dash-frec-head">
      <label className="dash-nimp">
        Importadores
        <input
          type="number"
          min="1"
          value={nImp}
          onChange={(e) => setNImp(Math.max(1, parseInt(e.target.value, 10) || 1))}
        />
      </label>
      <label className="dash-fijar" title="Mantener el resaltado al hacer clic en un nombre">
        <input type="checkbox" checked={fijar} onChange={toggleFijar} />
        Fijar selección
      </label>
    </div>
  );

  return (
    <>
      <CardFrame
        title="Frecuencia de Operaciones de Importación"
        open={openChart}
        onToggle={() => setOpenChart((o) => !o)}
        active={hasActiveFilters(filters)}
        filtro={filtro}
        setFiltro={setFiltro}
        options={options}
        singleMonth
        headerExtra={cantidad}
      >
        {openChart && <FilterPanel filters={filters} onChange={setFilters} options={options} />}
        {error && <p className="error">{error}</p>}
        {loading && <p className="empty">Cargando…</p>}
        {!loading && !error && !data && <p className="empty">Sin datos.</p>}
        <div className="dash-legend">
          {model.top.map((s) => (
            <button
              type="button"
              key={s.name}
              className={'dash-legend-item' + (highlight === s.name ? ' on' : '')}
              onMouseEnter={() => setHover(s.name)}
              onMouseLeave={() => setHover(null)}
              onClick={() => clickNombre(s.name)}
            >
              <span className="dash-legend-sw" style={{ background: model.colorOf(s.name) }} />
              {sl(s.name, 24)}
            </button>
          ))}
        </div>
        <div className="dash-cw" ref={chartRef} style={{ minHeight: 420 }} />
      </CardFrame>

      <CardFrame
        title="Operaciones por Aduana por Importador"
        open={openTable}
        onToggle={() => setOpenTable((o) => !o)}
        active={hasActiveFilters(filters)}
        filtro={filtro}
        setFiltro={setFiltro}
        options={options}
        singleMonth
      >
        {openTable && <FilterPanel filters={filters} onChange={setFilters} options={options} />}
        {error && <p className="error">{error}</p>}
        {loading && <p className="empty">Cargando…</p>}
        {!loading && !error && !data && <p className="empty">Sin datos.</p>}
        {data && <AduanaTable model={model} matrix={matrix} aduanas={aduanas} highlight={highlight} setHighlight={setHover} />}
      </CardFrame>
    </>
  );
}

function renderBenchmark(el, g) {
  d3Benchmark(el, g.precio_empresa || {}, parseFloat(g.kpis && g.kpis.precio_marcador) || 1120);
}

function defaultFiltro() {
  const now = new Date();
  let anio = now.getFullYear();
  let pm = now.getMonth() - 1;
  if (pm < 0) { pm = 11; anio -= 1; }
  return { anio: String(anio), meses: [String(pm + 1)] };
}

// ==================== TABLAS: TARIFAS Y VOLUMEN ====================

const TIPOS_TABLA = [
  { id: 'todos', label: 'Todos' },
  { id: 'ypfb', label: 'YPFB' },
  { id: 'privado', label: 'Privado' },
];

function TipoSeg({ value, onChange }) {
  return (
    <div className="dash-seg">
      {TIPOS_TABLA.map((t) => (
        <button
          key={t.id}
          type="button"
          className={value === t.id ? 'on' : ''}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function mesPrevio(m) {
  return m === 1 ? 12 : m - 1;
}

function celdasVariacion(dif, pct) {
  if (dif == null) return [<td key="v" className="na">–</td>, <td key="p" className="na">–</td>];
  if (Math.round(dif) === 0) return [<td key="v" className="eq">0</td>, <td key="p" className="eq">= 0.0 %</td>];
  const up = dif > 0;
  const cls = up ? 'up' : 'down';
  const s = up ? '+' : '−';
  return [
    <td key="v" className={cls}>{s}{fmt(Math.abs(dif), 0)}</td>,
    <td key="p" className={cls}>{up ? '▲' : '▼'} {s}{fmt(Math.abs(pct), 1)} %</td>,
  ];
}

function TarifasTable({ tab, options, unidad, title }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtro, setFiltro] = useState(defaultFiltro);
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState('todos');
  const { data, loading, error } = useDashboardData(tab, filtro, filters, { chart: 'tarifas', unidad, tipo });

  const esBs = unidad === 'bs';
  const unit = esBs ? 'Bs/m³' : 'USD/m³';
  const rows = (data && data.tarifas ? data.tarifas : [])
    .filter((r) => r.act != null)
    .map((r) => ({
      ...r,
      dif: r.ant != null ? Math.round(r.act) - Math.round(r.ant) : null,
      pct: r.ant ? (r.act / r.ant - 1) * 100 : null,
    }))
    .sort((a, b) => a.act - b.act);
  const general = (data && data.general) || {};

  const mesAct = parseInt((filtro.meses && filtro.meses[0]) || defaultFiltro().meses[0], 10);
  const mesAnt = mesPrevio(mesAct);
  const nomAct = MES_ABBR[mesAct - 1];
  const nomAnt = MES_ABBR[mesAnt - 1];

  const fmtT = (v) => (v == null ? '–' : fmt(v, 0));
  const gDif = general.ant != null && general.act != null ? Math.round(general.act) - Math.round(general.ant) : null;
  const gPct = general.ant && general.act != null ? (general.act / general.ant - 1) * 100 : null;

  return (
    <CardFrame
      title={title}
      open={open}
      onToggle={() => setOpen((o) => !o)}
      active={hasActiveFilters(filters)}
      filtro={filtro}
      setFiltro={setFiltro}
      options={options}
      singleMonth
      headerExtra={<TipoSeg value={tipo} onChange={setTipo} />}
    >
      {open && <FilterPanel filters={filters} onChange={setFilters} options={options} />}
      {error && <p className="error">{error}</p>}
      {loading && <p className="empty">Cargando…</p>}
      {!loading && !error && rows.length === 0 && <p className="empty">Sin operaciones en {nomAct}.</p>}
      {rows.length > 0 && (
        <div className="table-scroll">
          <table className="dash-tarifas">
            <thead>
              <tr className="unidad">
                <th />
                <th>{unit}</th>
                <th>{unit}</th>
                <th colSpan={2} className="sep">Variación</th>
              </tr>
              <tr>
                <th>Tramo</th>
                <th>{nomAnt}</th>
                <th className="act">{nomAct}</th>
                <th className="sep">{unit}</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.tramo}>
                  <td className="tramo">{r.tramo}</td>
                  <td className={r.ant == null ? 'na' : 'prev'}>{fmtT(r.ant)}</td>
                  <td className="act">{fmtT(r.act)}</td>
                  {celdasVariacion(r.dif, r.pct)}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Promedio general</td>
                <td>{fmtT(general.ant)}</td>
                <td className="act">{fmtT(general.act)}</td>
                {celdasVariacion(gDif, gPct)}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </CardFrame>
  );
}

function VolumenFronteraTable({ tab, options }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtro, setFiltro] = useState(defaultFiltro);
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState('todos');
  const [nImp, setNImp] = useState(7);
  const { data, loading, error } = useDashboardData(tab, filtro, filters, { chart: 'volumen-frontera', tipo });

  const raw = data && data.volumen_frontera ? data.volumen_frontera : [];
  const byImp = new Map();
  for (const r of raw) {
    if (!byImp.has(r.importador)) byImp.set(r.importador, { nombre: r.importador, por: {}, total: 0 });
    const row = byImp.get(r.importador);
    row.por[r.aduana] = (row.por[r.aduana] || 0) + r.volumen;
    row.total += r.volumen;
  }
  const rows = [...byImp.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, Math.max(1, nImp));
  const frontSet = new Set();
  for (const r of rows) for (const f of Object.keys(r.por)) frontSet.add(f);
  const colTotals = {};
  for (const f of frontSet) colTotals[f] = rows.reduce((s, r) => s + (r.por[f] || 0), 0);
  const cols = [...frontSet].filter((f) => colTotals[f] > 0).sort((a, b) => colTotals[b] - colTotals[a]);
  const grand = rows.reduce((s, r) => s + r.total, 0);
  const max = Math.max(1, ...rows.flatMap((r) => cols.map((f) => r.por[f] || 0)));

  const mesAct = parseInt((filtro.meses && filtro.meses[0]) || defaultFiltro().meses[0], 10);
  const nomAct = MES_ABBR[mesAct - 1];

  function heatStyle(v) {
    if (!v) return {};
    const p = Math.round(Math.sqrt(v / max) * 85);
    return { background: `rgba(37, 99, 235, ${(p / 100) * 0.9})`, color: p > 45 ? '#fff' : undefined };
  }

  return (
    <CardFrame
      title="Volumen por Frontera (m³)"
      open={open}
      onToggle={() => setOpen((o) => !o)}
      active={hasActiveFilters(filters)}
      filtro={filtro}
      setFiltro={setFiltro}
      options={options}
      singleMonth
      headerExtra={(
        <div className="dash-frec-head">
          <label className="dash-nimp">
            Importadores
            <input
              type="number"
              min="1"
              value={nImp}
              onChange={(e) => setNImp(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </label>
          <TipoSeg value={tipo} onChange={setTipo} />
        </div>
      )}
    >
      {open && <FilterPanel filters={filters} onChange={setFilters} options={options} />}
      {error && <p className="error">{error}</p>}
      {loading && <p className="empty">Cargando…</p>}
      {!loading && !error && rows.length === 0 && <p className="empty">Sin volumen en {nomAct}.</p>}
      {rows.length > 0 && (
        <div className="table-scroll">
          <table className="dash-volumen">
            <thead>
              <tr className="super">
                <th />
                <th colSpan={cols.length} className="centro">Fronteras</th>
                <th />
              </tr>
              <tr>
                <th>Importador</th>
                {cols.map((f) => <th key={f} className="fr">{f}</th>)}
                <th className="tot">Total m³</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.nombre}>
                  <td className="imp">{r.nombre}</td>
                  {cols.map((f) => {
                    const v = r.por[f] || 0;
                    return (
                      <td key={f} className={v ? '' : 'cero'} style={heatStyle(v)} title={`${r.nombre} · ${f}: ${fmt(v, 0)} m³`}>
                        {v ? fmt(v, 0) : 0}
                      </td>
                    );
                  })}
                  <td className="tot">{fmt(r.total, 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                {cols.map((f) => <td key={f}>{fmt(colTotals[f], 0)}</td>)}
                <td className="tot">{fmt(grand, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </CardFrame>
  );
}

// ==================== DIÉSEL YPFB (comparación por proveedor) ====================

function YpfbComparacion({ tab, options }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtro, setFiltro] = useState(defaultFiltro);
  const [open, setOpen] = useState(false);
  const [incoterm, setIncoterm] = useState('');
  const [suministro, setSuministro] = useState('todos');
  const { data, loading, error } = useDashboardData(tab, filtro, filters, { chart: 'diesel-ypfb' });

  const rows = data && data.diesel_ypfb ? data.diesel_ypfb : [];
  const incoterms = [...new Set(rows.map((r) => r.incoterm).filter(Boolean))].sort();
  const suministros = [...new Set(rows.map((r) => r.pais_procedencia).filter(Boolean))].sort();
  const inc = incoterm && incoterms.includes(incoterm) ? incoterm : (incoterms[0] || '');

  const mesAct = parseInt((filtro.meses && filtro.meses[0]) || defaultFiltro().meses[0], 10);
  const periodo = `${filtro.anio}-${String(mesAct).padStart(2, '0')}`;

  const filtradas = rows.filter((r) => {
    if (String(r.fecha || '').slice(0, 7) !== periodo) return false;
    if (inc && r.incoterm !== inc) return false;
    if (suministro !== 'todos' && r.pais_procedencia !== suministro) return false;
    return true;
  });

  const acc = () => ({ vol: 0, premio: 0, flete: 0, precio: 0, pfs: [] });
  const add = (a, d) => {
    const v = d.volumen || 0;
    a.vol += v;
    a.premio += (d.premio || 0) * v;
    a.flete += (d.flete || 0) * v;
    a.precio += (d.precio_unitario || 0) * v;
    a.pfs.push(d);
  };
  const prom = (a) => (a.vol ? { vol: a.vol, premio: a.premio / a.vol, flete: a.flete / a.vol, precio: a.precio / a.vol } : null);

  const porProv = new Map();
  const total = acc();
  filtradas.forEach((d) => {
    const p = d.proveedor || 'Sin proveedor';
    if (!porProv.has(p)) porProv.set(p, { prov: p, a: acc(), sum: new Map() });
    const t = porProv.get(p);
    const pais = d.pais_procedencia || 'Sin país';
    if (!t.sum.has(pais)) t.sum.set(pais, { pais, a: acc() });
    add(t.a, d);
    add(t.sum.get(pais).a, d);
    add(total, d);
  });
  const out = [...porProv.values()].map((t) => ({
    prov: t.prov,
    p: prom(t.a),
    pfs: t.a.pfs,
    subs: [...t.sum.values()].map((s) => ({ pais: s.pais, p: prom(s.a), pfs: s.a.pfs })).filter((s) => s.p),
  })).filter((r) => r.p).sort((a, b) => a.p.precio - b.p.precio);
  const mercado = prom(total);

  const pfsTxt = (pfs) => pfs.map((d) => d.nro_proforma).filter(Boolean).join(' · ') || '–';
  const celdas = (p, key) => [
    <td key={`v${key}`} className="sep">{fmt(p.vol, 0)}</td>,
    <td key={`p${key}`}>{fmt(p.premio, 2)}</td>,
    <td key={`f${key}`}>{fmt(p.flete, 2)}</td>,
    <td key={`u${key}`} className="precio">{fmt(p.precio, 2)}</td>,
  ];

  const header = (
    <div className="dash-frec-head">
      <span className="dash-markers-label">Incoterm</span>
      <div className="dash-seg">
        {incoterms.map((i) => (
          <button key={i} type="button" className={inc === i ? 'on' : ''} onClick={() => setIncoterm(i)}>{i}</button>
        ))}
      </div>
      <span className="dash-markers-label">Suministro</span>
      <div className="dash-seg">
        <button type="button" className={suministro === 'todos' ? 'on' : ''} onClick={() => setSuministro('todos')}>Todos</button>
        {suministros.map((s) => (
          <button key={s} type="button" className={suministro === s ? 'on' : ''} onClick={() => setSuministro(s)}>{sl(s, 14)}</button>
        ))}
      </div>
    </div>
  );

  return (
    <CardFrame
      title="Diésel YPFB · Comparación de precio unitario por proveedor (USD/m³)"
      open={open}
      onToggle={() => setOpen((o) => !o)}
      active={hasActiveFilters(filters)}
      filtro={filtro}
      setFiltro={setFiltro}
      options={options}
      singleMonth
      headerExtra={header}
    >
      {open && <FilterPanel filters={filters} onChange={setFilters} options={options} />}
      {error && <p className="error">{error}</p>}
      {loading && <p className="empty">Cargando…</p>}
      {!loading && !error && out.length === 0 && (
        <p className="empty">Sin entregas {inc || ''} en {MES_ABBR[mesAct - 1]} {filtro.anio}.</p>
      )}
      {out.length > 0 && (
        <div className="table-scroll">
          <table className="dash-ypfb">
            <thead>
              <tr>
                <th>Proveedor{suministro === 'todos' ? ' / punto de suministro' : ''}</th>
                <th className="left">N.º proforma</th>
                <th className="sep">Volumen (m³)</th>
                <th>Premio (USD/m³)</th>
                <th>Flete (USD/m³)</th>
                <th className="precio">Precio unitario {inc} (USD/m³)</th>
              </tr>
            </thead>
            <tbody>
              {out.map((r) => (
                <Fragment key={r.prov}>
                  <tr className="prov">
                    <td>{r.prov}</td>
                    <td className="left na">
                      {suministro === 'todos'
                        ? `${r.subs.length} punto${r.subs.length === 1 ? '' : 's'} · ${r.pfs.length} proforma${r.pfs.length === 1 ? '' : 's'}`
                        : pfsTxt(r.pfs)}
                    </td>
                    {celdas(r.p, `p${r.prov}`)}
                  </tr>
                  {suministro === 'todos' && r.subs.map((s) => (
                    <tr className="sub" key={s.pais}>
                      <td><span className="rama">└</span>{s.pais}</td>
                      <td className="left pfs">{pfsTxt(s.pfs)}</td>
                      {celdas(s.p, `s${r.prov}${s.pais}`)}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
            {mercado && (
              <tfoot>
                <tr>
                  <td>Promedio YPFB · {inc}</td>
                  <td />
                  {celdas(mercado, 'tot')}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </CardFrame>
  );
}

export default function DashboardSection({ canWrite }) {
  const [tab, setTab] = useState('diesel');
  const [options, setOptions] = useState(null);
  const [error, setError] = useState(null);
  const [kpiFiltro] = useState(defaultFiltro);
  const kpi = useKpis(tab, kpiFiltro);
  const [marcadores, setMarcadores] = useState({ empresa: [], ypfb: [] });

  useEffect(() => {
    getDashboardFilters().then(setOptions).catch((e) => setError(e.message));
    getMarcadores().then(setMarcadores).catch(() => {});
  }, []);

  async function aplicarMarcadores(grafico, valores) {
    try {
      const r = await putMarcadores(grafico, valores);
      setMarcadores(r);
    } catch (e) {
      setError(e.message);
    }
  }

  const kpiList = kpi ? [
    ['Volumen Total', fmt(kpi.volumen_total, 2), 'M³'],
    ['Nº Operaciones', fmt(kpi.num_operaciones), 'Despachos'],
    ['Importadores', fmt(kpi.importadores), 'Empresas'],
  ] : [];

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <h2 className="dash-title">Importaciones de Combustible</h2>
          <div className="dash-sub">Bolivia 2026 &bull; NANDINA 27101921 / 27101220</div>
        </div>
        <nav className="dash-tabs">
          <button className={tab === 'diesel' ? 'active' : ''} onClick={() => setTab('diesel')}>DIESEL</button>
          <button className={tab === 'gasolina' ? 'active gas' : 'gas'} onClick={() => setTab('gasolina')}>GASOLINA 90</button>
        </nav>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="dash-kgrid">
        {kpiList.map((i) => (
          <div className="dash-kpi" key={i[0]}>
            <div className="dash-kpi-lb">{i[0]}</div>
            <div className="dash-kpi-val">{i[1]}</div>
            <div className="dash-kpi-sub">{i[2]}</div>
          </div>
        ))}
      </div>

      <FrecuenciaAduanas tab={tab} options={options} />

      <ChartCard title="Benchmarking de Precio Promedio ($/M³) por Importador" tab={tab} options={options} render={renderBenchmark} minHeight={400} />

      <div className="dash-st">Precio por Semana</div>
      <WeeklyTable tab={tab} options={options} />

      <div className="dash-st">Precio por Empresa (Bs/litro)</div>
      <BubbleCard title="Precio Promedio por Empresa (Bs/litro)" tab={tab} options={options} marcadores={marcadores.empresa} canWrite={canWrite} onAplicar={aplicarMarcadores} />

      <div className="dash-st">Logística</div>
      <TarifasTable tab={tab} options={options} unidad="usd" title="Tarifa Flete Prom. por Tramo (USD/m³)" />
      <TarifasTable tab={tab} options={options} unidad="bs" title="Tarifa Flete Prom. por Tramo (Bs/m³)" />

      <div className="dash-st">Diésel YPFB</div>
      <YpfbComparacion tab={tab} options={options} />

      <div className="dash-st">Análisis por Importador</div>
      <VolumenFronteraTable tab={tab} options={options} />

      <div className="dash-st">Cadena de Suministro</div>
      <div className="dash-row">
        <div className="dash-half"><ChartCard title="Market Share por Proveedor" tab={tab} options={options} render={(el, d) => d3Donut(el, d.share_proveedor || {}, 'M³')} /></div>
        <div className="dash-half"><ChartCard title="Volumen por Procedencia" tab={tab} options={options} render={(el, d) => d3Donut(el, d.vol_procedencia || {}, 'M³')} /></div>
      </div>
    </div>
  );
}
