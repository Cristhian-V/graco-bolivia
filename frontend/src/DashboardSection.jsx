import { Fragment, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getDashboardData, getDashboardFilters, getDashboardKpis } from './api.js';

const SERIES = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#e11d48', '#a855f7', '#0ea5e9', '#d946ef'];

const MONTH_KEYS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTH_CAP = { ene: 'Ene', feb: 'Feb', mar: 'Mar', abr: 'Abr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Ago', sep: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dic' };
const MES_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function fmt(n, d = 0) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('es-BO', { minimumFractionDigits: d, maximumFractionDigits: d });
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

// ==================== D3 LINE (frecuencia mensual por empresa) ====================
function d3Line(el, points, companies) {
  if (!points.length) return;
  const w = 1000, h = 420, m = { top: 10, right: 30, bottom: 100, left: 50 };
  const { svg, g, w: iw, h: ih } = svgEl(el, w, h, m);

  const labels = points.map((p) => p.label);
  const values = points.map((p) => p.value);
  const maxVal = d3.max(values) || 300;
  const yMax = Math.ceil(maxVal / 50) * 50 + 50;

  const x = d3.scalePoint().domain(labels).range([0, iw]).padding(0.5);
  const y = d3.scaleLinear().domain([0, yMax]).range([ih, 0]);

  g.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).ticks(Math.ceil(yMax / 50)).tickSize(-iw).tickFormat(''));

  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(Math.ceil(yMax / 50)));

  g.append('text').attr('transform', 'rotate(-90)').attr('x', -ih / 2).attr('y', -38)
    .attr('fill', '#374151').style('font-size', '13px').style('text-anchor', 'middle').text('Frecuencia');

  const line = d3.line().x((d, i) => x(labels[i])).y((d) => y(d)).curve(d3.curveLinear);
  g.append('path').datum(values).attr('fill', 'none').attr('stroke', '#2563eb').attr('stroke-width', 2.5).attr('d', line);

  g.selectAll('.mdot').data(points).join('circle')
    .attr('cx', (d, i) => x(labels[i]))
    .attr('cy', (d) => y(d.value))
    .attr('r', 3.5).attr('fill', '#2563eb').attr('stroke', '#fff').attr('stroke-width', 1.5)
    .on('mouseover', function (evt, d) {
      d3.select(this).attr('r', 6);
      tip.show(evt, `<strong>${d.company}</strong><br>${d.month}: ${fmt(d.value)} ops`);
    })
    .on('mouseout', function () { d3.select(this).attr('r', 3.5); tip.hide(); });

  const xAxisG = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`);
  xAxisG.selectAll('.tick').data(points).join('g')
    .attr('class', 'tick').attr('transform', (d, i) => `translate(${x(labels[i])},0)`)
    .append('line').attr('y2', 6).attr('stroke', '#d1d5db');

  xAxisG.selectAll('.mlabel').data(points).join('text')
    .attr('class', 'mlabel')
    .attr('transform', (d, i) => `translate(${x(labels[i])},16) rotate(-90)`)
    .attr('text-anchor', 'end')
    .attr('dy', '0.32em')
    .attr('fill', '#6b7280').style('font-size', '11px')
    .text((d) => MONTH_CAP[d.monthKey] || d.monthKey);

  const coStart = {};
  const coEnd = {};
  points.forEach((p) => { if (!(p.companyIdx in coStart)) coStart[p.companyIdx] = p; coEnd[p.companyIdx] = p; });
  Object.keys(coStart).forEach((idx) => {
    const s = coStart[idx], e = coEnd[idx];
    const cxPos = (x(s.label) + x(e.label)) / 2;
    const n = parseInt(idx, 10);
    xAxisG.append('text')
      .attr('x', cxPos).attr('y', 50 + (n % 2) * 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#1f2937').style('font-size', '11px').style('font-weight', '600')
      .text(sl(s.company, 18));
    if (n < companies.length - 1) {
      const sepX = x(e.label) + (x(e.label) - x(s.label)) / 2;
      g.append('line')
        .attr('x1', sepX).attr('x2', sepX).attr('y1', 0).attr('y2', ih)
        .attr('stroke', '#d1d5db').attr('stroke-width', 1).attr('stroke-dasharray', '3,4');
    }
  });
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
function d3Bubble(el, rows) {
  const entries = (rows || [])
    .slice()
    .sort((a, b) => b.volumen - a.volumen)
    .slice(0, 7)
    .sort((a, b) => b.precio_bs_litro - a.precio_bs_litro);
  const w = 1000, h = 460, m = { top: 10, right: 60, bottom: 110, left: 70 };
  const { svg, g, w: iw, h: ih } = svgEl(el, w, h, m);

  const labels = entries.map((e) => sl(e.empresa, 24));
  const yMin = 0;
  const yMax = 20;

  const x = d3.scalePoint().domain(labels).range([0, iw]).padding(0.5);
  const y = d3.scaleLinear().domain([yMin, yMax]).range([ih, 0]);

  g.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).ticks(6).tickSize(-iw).tickFormat(''));
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(6)).selectAll('text').style('font-size', '14px');
  g.append('text').attr('transform', 'rotate(-90)').attr('x', -ih / 2).attr('y', -56)
    .attr('fill', '#374151').style('font-size', '15px').style('text-anchor', 'middle').text('Bs / Litro');

  [18, 16.5].forEach((v) => {
    g.append('line').attr('x1', 0).attr('x2', iw).attr('y1', y(v)).attr('y2', y(v))
      .attr('stroke', '#f59e0b').attr('stroke-width', 2).attr('stroke-dasharray', '6,4');
    g.append('text').attr('x', iw - 4).attr('y', y(v) - 10).attr('text-anchor', 'end')
      .attr('fill', '#d97706').style('font-size', '15px').style('font-weight', '700')
      .text(`${v} Bs/L`);
  });

  g.selectAll('.bubble').data(entries).join('circle')
    .attr('class', 'bubble')
    .attr('cx', (e) => x(sl(e.empresa, 24)))
    .attr('cy', (e) => y(e.precio_bs_litro))
    .attr('r', 14)
    .attr('fill', '#3b82f6').attr('fill-opacity', 0.55).attr('stroke', '#2563eb').attr('stroke-width', 1.5)
    .on('mouseover', function (evt, e) {
      d3.select(this).attr('fill-opacity', 0.9);
      tip.show(evt, `<strong>${sl(e.empresa, 35)}</strong><br>Precio: ${fmt(e.precio_bs_litro, 2)} Bs/L<br>Volumen: ${fmt(e.volumen, 2)} m³`);
    })
    .on('mouseout', function () { d3.select(this).attr('fill-opacity', 0.55); tip.hide(); });

  if (labels.length) {
    const xAxisG = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`);
    xAxisG.selectAll('.tick').data(entries).join('g')
      .attr('class', 'tick').attr('transform', (e) => `translate(${x(sl(e.empresa, 24))},0)`)
      .append('line').attr('y2', 6).attr('stroke', '#d1d5db');
    xAxisG.selectAll('.xlabel').data(entries).join('text')
      .attr('class', 'xlabel').attr('x', (e) => x(sl(e.empresa, 24))).attr('y', 18)
      .attr('text-anchor', 'middle').attr('fill', '#1f2937').style('font-size', '14px')
      .each(function (e) {
        const txt = sl(e.empresa, 30);
        const words = txt.split(' ');
        const elT = d3.select(this);
        if (words.length > 3) {
          const mid = Math.ceil(words.length / 2);
          elT.append('tspan').attr('x', x(sl(e.empresa, 24))).attr('dy', '0').text(words.slice(0, mid).join(' '));
          elT.append('tspan').attr('x', x(sl(e.empresa, 24))).attr('dy', '14').text(words.slice(mid).join(' '));
        } else {
          elT.text(txt);
        }
      });
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

function CardFrame({ title, open, onToggle, active, filtro, setFiltro, options, soloAnio, children }) {
  function toggleMes(i) {
    const key = String(i);
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

function ChartCard({ title, tab, options, extra, render, minHeight, soloAnio }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtro, setFiltro] = useState(defaultFiltro);
  const [open, setOpen] = useState(false);
  const { data, loading, error } = useDashboardData(tab, filtro, filters, extra, soloAnio);
  const ref = useRef(null);

  useEffect(() => {
    if (data && render && ref.current) render(ref.current, data, { filters, options, filtro });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

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

function BubbleCard({ title, tab, options, ypfb }) {
  const extra = ypfb
    ? { chart: 'burbujas', importador: ['YPFB', '1020269020'] }
    : { chart: 'burbujas' };
  return (
    <ChartCard
      title={title}
      tab={tab}
      options={options}
      extra={extra}
      render={(el, d) => d3Bubble(el, d.burbujas)}
    />
  );
}

function renderLine(el, g, ctx) {
  const monthly = g.monthly_ops || {};
  const hoy = new Date();
  const anio = ctx && ctx.filtro && ctx.filtro.anio ? parseInt(ctx.filtro.anio, 10) : hoy.getFullYear();
  let maxMes = 12;
  if (anio === hoy.getFullYear()) maxMes = hoy.getMonth() + 1;
  else if (anio > hoy.getFullYear()) maxMes = 0;
  const selectedMonths = MONTH_KEYS.slice(0, maxMes);

  const topCos = Object.entries(monthly)
    .sort((a, b) => {
      const sa = selectedMonths.reduce((s, m) => s + (a[1][m] || 0), 0);
      const sb = selectedMonths.reduce((s, m) => s + (b[1][m] || 0), 0);
      return sb - sa;
    })
    .slice(0, 7);

  const points = [];
  topCos.forEach(([coName, mm], ci) => {
    selectedMonths.forEach((m) => {
      points.push({
        label: `${sl(coName, 14)} / ${m}`,
        company: coName,
        month: MONTH_CAP[m] || m,
        monthKey: m,
        value: mm[m] || 0,
        companyIdx: ci,
      });
    });
  });

  d3Line(el, points, topCos.map((c) => c[0]));
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

export default function DashboardSection() {
  const [tab, setTab] = useState('diesel');
  const [options, setOptions] = useState(null);
  const [error, setError] = useState(null);
  const [kpiFiltro] = useState(defaultFiltro);
  const kpi = useKpis(tab, kpiFiltro);

  useEffect(() => {
    getDashboardFilters().then(setOptions).catch((e) => setError(e.message));
  }, []);

  const kpiList = kpi ? [
    ['Precio Marcador', fmt$(kpi.precio_marcador), '$/M³'],
    ['Precio Promedio', fmt$(kpi.precio_promedio), '$/M³'],
    ['Total U$S CIF', fmt(kpi.total_cif, 0), 'Dólares'],
    ['Volumen Total', fmt(kpi.volumen_total, 2), 'M³'],
    ['Nº Operaciones', fmt(kpi.num_operaciones), 'Despachos'],
    ['Importadores', fmt(kpi.importadores), 'Empresas'],
    ['Flete Total', fmt(kpi.flete_total_bs, 0), 'Bs'],
    ['Tarifa Flete Prom.', fmt(kpi.tarifa_flete_bob_prom, 2), 'Bs/M³'],
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

      <ChartCard title="Frecuencia de Operaciones de Importación" tab={tab} options={options} render={renderLine} minHeight={420} soloAnio />

      <ChartCard title="Benchmarking de Precio Promedio ($/M³) por Importador" tab={tab} options={options} render={renderBenchmark} minHeight={400} />

      <div className="dash-st">Precio por Semana</div>
      <WeeklyTable tab={tab} options={options} />

      <div className="dash-st">Precio por Empresa (Bs/litro)</div>
      <div className="dash-row">
        <div className="dash-half"><BubbleCard title="Precio Promedio por Empresa (Bs/litro)" tab={tab} options={options} /></div>
        <div className="dash-half"><BubbleCard title="Precio Promedio YPFB (Bs/litro)" tab={tab} options={options} ypfb /></div>
      </div>

      <div className="dash-st">Logística</div>
      <div className="dash-row">
        <div className="dash-half"><ChartCard title="Tarifa Flete Prom. por Tramo ($/M³)" tab={tab} options={options} render={(el, d) => d3HBar(el, d.flete_tramo || {}, '$/M³')} /></div>
        <div className="dash-half"><ChartCard title="Tarifa Flete Prom. por Tramo (Bs/M³)" tab={tab} options={options} render={(el, d) => d3HBar(el, d.flete_tramo_bob || {}, 'Bs/M³')} /></div>
      </div>

      <div className="dash-st">Análisis por Importador</div>
      <ChartCard title="Volumen Total por Importador (M³)" tab={tab} options={options} render={(el, d) => d3HBar(el, d.vol_empresa || {}, 'M³', 10)} />

      <div className="dash-st">Cadena de Suministro</div>
      <div className="dash-row">
        <div className="dash-third"><ChartCard title="Market Share por Proveedor" tab={tab} options={options} render={(el, d) => d3Donut(el, d.share_proveedor || {}, 'M³')} /></div>
        <div className="dash-third"><ChartCard title="Volumen por Procedencia" tab={tab} options={options} render={(el, d) => d3Donut(el, d.vol_procedencia || {}, 'M³')} /></div>
        <div className="dash-third"><ChartCard title="U$S CIF por País de Origen" tab={tab} options={options} render={(el, d) => d3Donut(el, d.cif_pais || {}, 'U$S')} /></div>
      </div>
    </div>
  );
}
