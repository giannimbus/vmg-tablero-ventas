/* global React, echarts */
const { useEffect, useRef, useMemo } = React;

/* Shared tooltip styling for ECharts */
const TIP = {
  backgroundColor: '#fff',
  borderColor: '#E5E5E0',
  borderWidth: 1,
  padding: [8, 10],
  textStyle: { color: '#1A1A1A', fontSize: 11, fontFamily: 'Inter, Segoe UI, system-ui' },
  extraCssText: 'border-radius:6px; box-shadow:none;',
};
const FONT = 'Inter, Segoe UI, system-ui';

function fmtM(v) {
  if (v >= 1000) return '$ ' + (v / 1000).toFixed(2).replace('.', ',') + ' mil M';
  return '$ ' + v.toFixed(0) + ' M';
}
function fmtU(v) { return v.toLocaleString('es-AR'); }

/* ───────────────────── ECharts host hook ───────────────────── */
function useECharts(option, deps, onEvents) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const c = echarts.init(ref.current, null, { renderer: 'svg' });
    chartRef.current = c;
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(ref.current);
    return () => { ro.disconnect(); c.dispose(); chartRef.current = null; };
  }, []);
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.setOption(option, { notMerge: true });
    if (onEvents) {
      chartRef.current.off('click');
      chartRef.current.on('click', onEvents);
    }
  }, deps); // eslint-disable-line
  return ref;
}

/* ───────────────────── Sparkline (KPI cards) ───────────────────── */
function Sparkline({ series, highlightLast, highlightIndex, height = 50, onPick }) {
  const option = useMemo(() => ({
    grid: { left: 4, right: 12, top: 6, bottom: 14 },
    xAxis: {
      type: 'category',
      data: series.map((s) => s.mes),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9999A0', fontSize: 9, fontFamily: FONT, margin: 4 },
    },
    yAxis: { type: 'value', show: false, scale: true },
    tooltip: {
      ...TIP,
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: '#9999A0', width: 1, type: [3, 3] } },
      formatter: (params) => {
        const p = params[0];
        const d = series[p.dataIndex];
        return `<div style="color:#6B6B65; font-size:10px; margin-bottom:2px;">${p.name.toUpperCase()} 2026${d.completo === false ? ' · parcial' : ''}</div>
          <div style="font-weight:500;">${fmtM(d.total)}</div>
          <div style="color:#6B6B65; font-size:10px;">${fmtU(d.unidades)} u.</div>`;
      },
    },
    series: [{
      type: 'line',
      data: series.map((s) => s.total),
      smooth: 0.25,
      symbol: 'circle',
      symbolSize: (val, p) => {
        if (highlightIndex != null && p.dataIndex === highlightIndex) return 9;
        if (highlightLast && p.dataIndex === series.length - 1) return 7;
        return 4;
      },
      itemStyle: {
        color: (p) => {
          if (highlightIndex != null && p.dataIndex === highlightIndex) return '#D85A30';
          if (highlightLast && p.dataIndex === series.length - 1) return '#D85A30';
          return '#0C447C';
        },
        borderColor: '#fff',
        borderWidth: 1.5,
      },
      lineStyle: { color: '#0C447C', width: 1.5 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: 'rgba(12,68,124,0.10)' },
          { offset: 1, color: 'rgba(12,68,124,0)' },
        ] },
      },
      animationDuration: 600,
      emphasis: { scale: 1.6 },
    }],
  }), [series, highlightLast, highlightIndex]);
  const ref = useECharts(option, [series, highlightIndex], (e) => {
    if (onPick && e.dataIndex != null) onPick(series[e.dataIndex].mes);
  });
  return <div className="kpi-chart" ref={ref} style={{ height, cursor: onPick ? 'pointer' : 'default' }} />;
}

/* ───────────────────── Top products bar chart ───────────────────── */
function ProductsBar({ products, metric, selected, onPick }) {
  const sorted = useMemo(() => {
    const key = metric === 'unidades' ? 'unidades' : 'monto';
    return [...products].sort((a, b) => b[key] - a[key]);
  }, [products, metric]);

  const option = useMemo(() => {
    const key = metric === 'unidades' ? 'unidades' : 'monto';
    return {
      grid: { left: 64, right: 36, top: 6, bottom: 6 },
      xAxis: {
        type: 'value',
        show: false,
        min: 0,
        max: 'dataMax',
      },
      yAxis: {
        type: 'category',
        data: sorted.map((p) => p.codigo).reverse(),
        inverse: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#1A1A1A',
          fontSize: 11,
          fontFamily: FONT,
          formatter: (v) => v,
        },
      },
      tooltip: {
        ...TIP,
        trigger: 'item',
        formatter: (p) => {
          const d = sorted.slice().reverse()[p.dataIndex];
          return `<div style="font-weight:500; margin-bottom:2px;">${d.codigo}</div>
            <div style="color:#6B6B65;">${fmtM(d.monto)}</div>
            <div style="color:#6B6B65;">${fmtU(d.unidades)} u.</div>`;
        },
      },
      series: [{
        type: 'bar',
        data: sorted.map((p) => p[key]).reverse(),
        itemStyle: {
          color: (p) => {
            const code = sorted.slice().reverse()[p.dataIndex].codigo;
            if (selected && selected !== code) return '#C7D6E8';
            return code === selected ? '#D85A30' : '#0C447C';
          },
          borderRadius: [0, 4, 4, 0],
        },
        barWidth: 14,
        label: {
          show: true,
          position: 'right',
          formatter: (p) => {
            const d = sorted.slice().reverse()[p.dataIndex];
            return metric === 'unidades' ? fmtU(d.unidades) : '$ ' + d.monto.toFixed(1);
          },
          color: '#6B6B65',
          fontSize: 10,
          fontFamily: FONT,
        },
        emphasis: { itemStyle: { color: '#185FA5' } },
        animationDuration: 500,
        animationDurationUpdate: 400,
        animationEasing: 'cubicOut',
      }],
    };
  }, [sorted, metric, selected]);

  const ref = useECharts(option, [sorted, metric, selected], (e) => {
    const code = sorted.slice().reverse()[e.dataIndex].codigo;
    onPick(code);
  });

  return <div className="chart-host products" ref={ref} />;
}

/* ───────────────────── Provinces ranking bar ───────────────────── */
function ProvinceRanking({ provinces, selected, onPick }) {
  const top = provinces.slice(0, 7);
  const option = useMemo(() => ({
    grid: { left: 90, right: 36, top: 6, bottom: 6 },
    xAxis: { type: 'value', show: false, min: 0, max: 'dataMax' },
    yAxis: {
      type: 'category',
      data: top.map((p) => p.nombre).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#1A1A1A', fontSize: 11, fontFamily: FONT,
        formatter: (v) => v.length > 14 ? v.slice(0, 13) + '…' : v,
      },
    },
    tooltip: {
      ...TIP,
      trigger: 'item',
      formatter: (p) => {
        const d = top.slice().reverse()[p.dataIndex];
        return `<div style="font-weight:500; margin-bottom:2px;">${d.nombre}</div>
          <div style="color:#6B6B65;">${fmtM(d.total)} · ${d.porc}%</div>
          <div style="color:#6B6B65;">${d.facturas} fact · ${d.clientes} clientes</div>`;
      },
    },
    series: [{
      type: 'bar',
      data: top.map((p) => p.total).reverse(),
      barWidth: 12,
      itemStyle: {
        color: (p) => {
          const name = top.slice().reverse()[p.dataIndex].nombre;
          if (selected && selected !== name) return '#C7D6E8';
          return name === selected ? '#D85A30' : '#0C447C';
        },
        borderRadius: [0, 4, 4, 0],
      },
      label: {
        show: true,
        position: 'right',
        formatter: (p) => {
          const d = top.slice().reverse()[p.dataIndex];
          return d.porc + '%';
        },
        color: '#6B6B65',
        fontSize: 10,
        fontFamily: FONT,
      },
      animationDuration: 500,
      animationDurationUpdate: 400,
    }],
  }), [top, selected]);

  const ref = useECharts(option, [top, selected], (e) => {
    const name = top.slice().reverse()[e.dataIndex].nombre;
    onPick(name);
  });
  return <div className="chart-host provinces" ref={ref} />;
}

/* ───────────────────── Argentina map ───────────────────── */
const AR_GEO_URL = 'https://gist.githubusercontent.com/aguspina/570fe8c52bb9628f38618ad9b037f4e7/raw/argentina.geojson';
let _arGeo = null;
let _arGeoPromise = null;
async function loadArGeo() {
  if (_arGeo) return _arGeo;
  if (_arGeoPromise) return _arGeoPromise;
  _arGeoPromise = fetch(AR_GEO_URL).then((r) => r.json()).then((g) => { _arGeo = g; return g; });
  return _arGeoPromise;
}

/* Map provinces in dataset → geojson feature name (rough) */
const PROV_NAME_MAP = {
  'Buenos Aires': 'Buenos Aires',
  'Santa Fe': 'Santa Fe',
  'Córdoba': 'Córdoba',
  'Tucumán': 'Tucumán',
  'Chaco': 'Chaco',
  'Mendoza': 'Mendoza',
  'Entre Ríos': 'Entre Ríos',
  'Ciudad de Buenos Aires': 'Ciudad de Buenos Aires',
  'San Juan': 'San Juan',
  'La Pampa': 'La Pampa',
  'Río Negro': 'Río Negro',
  'Salta': 'Salta',
  'San Luis': 'San Luis',
  'Misiones': 'Misiones',
  'Corrientes': 'Corrientes',
  'Jujuy': 'Jujuy',
  'Neuquén': 'Neuquén',
};

function ArgentinaMap({ provinces, selected, onPick }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const fallbackRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadArGeo().then((geo) => {
      if (cancelled || !ref.current) return;
      // Normalize feature names — gist uses NAME_1
      const features = geo.features.map((f) => {
        const n = (f.properties && (f.properties.NAME_1 || f.properties.name || f.properties.nombre)) || '';
        return { ...f, properties: { ...f.properties, name: n } };
      });
      const geoFixed = { ...geo, features };
      echarts.registerMap('argentina', geoFixed);
      const c = echarts.init(ref.current, null, { renderer: 'svg' });
      chartRef.current = c;
      const ro = new ResizeObserver(() => c.resize());
      ro.observe(ref.current);
      // Initial render handled by separate effect
      c._ro = ro;
    }).catch((err) => {
      console.warn('Map geojson failed, using fallback', err);
      if (fallbackRef.current) fallbackRef.current.style.display = 'flex';
    });
    return () => {
      cancelled = true;
      if (chartRef.current) {
        if (chartRef.current._ro) chartRef.current._ro.disconnect();
        chartRef.current.dispose();
        chartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) {
      // try again later if geo is still loading
      const id = setInterval(() => {
        if (chartRef.current) { clearInterval(id); render(); }
      }, 80);
      setTimeout(() => clearInterval(id), 3000);
      return () => clearInterval(id);
    }
    render();
    function render() {
      if (!chartRef.current) return;
      const byName = Object.fromEntries(provinces.map((p) => [PROV_NAME_MAP[p.nombre] || p.nombre, p]));
      const data = Object.values(byName).map((p) => ({
        name: PROV_NAME_MAP[p.nombre] || p.nombre,
        value: p.total,
        raw: p,
      }));
      const max = Math.max(...data.map((d) => d.value));
      const option = {
        tooltip: {
          ...TIP,
          trigger: 'item',
          formatter: (p) => {
            if (!p.data || !p.data.raw) return `<div style="color:#9999A0;">${p.name}</div><div style="color:#9999A0; font-size:10px;">sin operaciones</div>`;
            const d = p.data.raw;
            return `<div style="font-weight:500; margin-bottom:2px;">${d.nombre}</div>
              <div style="color:#6B6B65;">${fmtM(d.total)} · ${d.porc}%</div>
              <div style="color:#6B6B65;">${d.facturas} fact · ${d.clientes} clientes</div>`;
          },
        },
        visualMap: {
          show: false,
          min: 0, max,
          inRange: { color: ['#E6EFFA', '#85B7EB', '#378ADD', '#185FA5', '#0C447C'] },
        },
        series: [{
          type: 'map',
          map: 'argentina',
          roam: false,
          aspectScale: 0.95,
          zoom: 1.1,
          itemStyle: { areaColor: '#D0D0CC', borderColor: '#fff', borderWidth: 0.6 },
          emphasis: {
            label: { show: false },
            itemStyle: { areaColor: '#D85A30', borderColor: '#fff' },
          },
          select: {
            label: { show: false },
            itemStyle: { areaColor: '#D85A30', borderColor: '#fff' },
          },
          selectedMode: 'single',
          data,
          animationDuration: 400,
          animationDurationUpdate: 300,
        }],
      };
      chartRef.current.setOption(option, { notMerge: true });
      // sync selection
      chartRef.current.dispatchAction({ type: 'unselect', seriesIndex: 0 });
      if (selected) {
        const target = PROV_NAME_MAP[selected] || selected;
        chartRef.current.dispatchAction({ type: 'select', seriesIndex: 0, name: target });
      }
      chartRef.current.off('click');
      chartRef.current.on('click', (e) => {
        if (!e.data || !e.data.raw) return;
        onPick(e.data.raw.nombre);
      });
    }
  }, [provinces, selected]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div className="chart-host map" ref={ref} />
      <div ref={fallbackRef} style={{
        display: 'none',
        position: 'absolute', inset: 0,
        alignItems: 'center', justifyContent: 'center',
        color: '#9999A0', fontSize: 11, textAlign: 'center', padding: 24,
      }}>
        No se pudo cargar el mapa. Usá el ranking lateral para filtrar por provincia.
      </div>
    </div>
  );
}

Object.assign(window, { Sparkline, ProductsBar, ProvinceRanking, ArgentinaMap, fmtM, fmtU });
