/* global React, ReactDOM */
const { useState, useMemo, useRef, useEffect } = React;
const DATA = window.DATA;

/* ───────────────────── Utilities ───────────────────── */
function classNames(...xs) { return xs.filter(Boolean).join(' '); }

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onOutside]);
}

const PERIODOS = [
  { id: 'abril',  label: 'Abril 2026',   short: 'abril 2026' },
  { id: 'marzo',  label: 'Marzo 2026',   short: 'marzo 2026' },
  { id: 'febrero',label: 'Febrero 2026', short: 'febrero 2026' },
  { id: 'enero',  label: 'Enero 2026',   short: 'enero 2026' },
  { id: 'todo',   label: 'Todo el período (ene–abr)', short: 'ene–abr 2026' },
];

/* Fake product universe = 10 top + a synthetic long tail for search demo */
const PRODUCTOS_UNIVERSO = (() => {
  const base = DATA.topProductosAbril.map((p) => p.codigo);
  const extra = [];
  for (let i = 1; i < 90; i++) {
    extra.push('BA' + (100 + i * 7));
    extra.push('RF' + (i.toString().padStart(3, '0')));
  }
  return Array.from(new Set([...base, ...extra]));
})();

/* ───────────────────── Chip + Dropdown ───────────────────── */
function FilterChip({ label, value, defaultValue, isDefault, children, align }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={classNames('chip', !isDefault && 'active')}
        onClick={() => setOpen((o) => !o)}>
        <span className="chip-label">{label}:</span>
        <span className="chip-value">{value}</span>
        <span className="chip-caret">▾</span>
      </button>
      {open && (
        <div className={classNames('dropdown', align === 'right' && 'right')}>
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

function PeriodoFilter({ value, onChange }) {
  const current = PERIODOS.find((p) => p.id === value) || PERIODOS[0];
  return (
    <FilterChip label="Período" value={current.short} isDefault={value === 'abril'}>
      {(close) => PERIODOS.map((p) => (
        <div key={p.id}
          className={classNames('dropdown-item', value === p.id && 'selected')}
          onClick={() => { onChange(p.id); close(); }}>
          <span>{p.label}</span>
          {p.id === 'abril' && <span className="dim">parcial</span>}
        </div>
      ))}
    </FilterChip>
  );
}

function VendedorFilter({ value, onChange }) {
  return (
    <FilterChip label="Vendedor" value={value === 'todos' ? 'todos' : value.split(' ')[0]} isDefault={value === 'todos'}>
      {(close) => (
        <React.Fragment>
          <div className={classNames('dropdown-item', value === 'todos' && 'selected')}
               onClick={() => { onChange('todos'); close(); }}>
            <span>Todos los vendedores</span>
            <span className="dim">6</span>
          </div>
          {DATA.vendedores.map((v) => (
            <div key={v.nombre}
              className={classNames('dropdown-item', value === v.nombre && 'selected')}
              onClick={() => { onChange(v.nombre); close(); }}>
              <span>{v.nombre}</span>
              <span className="dim">{v.porc}%</span>
            </div>
          ))}
        </React.Fragment>
      )}
    </FilterChip>
  );
}

function ProvinciaFilter({ value, onChange }) {
  return (
    <FilterChip label="Provincia" value={value === 'todas' ? 'todas' : value} isDefault={value === 'todas'}>
      {(close) => (
        <React.Fragment>
          <div className={classNames('dropdown-item', value === 'todas' && 'selected')}
               onClick={() => { onChange('todas'); close(); }}>
            <span>Todas las provincias</span>
            <span className="dim">17</span>
          </div>
          {DATA.provincias.map((p) => (
            <div key={p.nombre}
              className={classNames('dropdown-item', value === p.nombre && 'selected')}
              onClick={() => { onChange(p.nombre); close(); }}>
              <span>{p.nombre}</span>
              <span className="dim">{p.porc}%</span>
            </div>
          ))}
        </React.Fragment>
      )}
    </FilterChip>
  );
}

function ProductoFilter({ value, onChange }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    if (!q) return PRODUCTOS_UNIVERSO.slice(0, 30);
    return PRODUCTOS_UNIVERSO.filter((c) => c.toLowerCase().includes(q.toLowerCase())).slice(0, 40);
  }, [q]);
  return (
    <FilterChip label="Producto" value={value === 'todos' ? 'todos' : value} isDefault={value === 'todos'}>
      {(close) => (
        <React.Fragment>
          <input className="dropdown-search" placeholder="Buscar entre 877 productos…"
                 value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          <div className={classNames('dropdown-item', value === 'todos' && 'selected')}
               onClick={() => { onChange('todos'); setQ(''); close(); }}>
            <span>Todos los productos</span>
            <span className="dim">877</span>
          </div>
          {filtered.map((p) => (
            <div key={p}
              className={classNames('dropdown-item', value === p && 'selected')}
              onClick={() => { onChange(p); setQ(''); close(); }}>
              <span>{p}</span>
            </div>
          ))}
          {!filtered.length && <div className="dropdown-empty">Sin resultados</div>}
        </React.Fragment>
      )}
    </FilterChip>
  );
}

/* ───────────────────── Filters bar ───────────────────── */
function FiltersBar({ filters, setFilters, partial, anyActive, onReset }) {
  return (
    <div className="filterbar">
      <PeriodoFilter value={filters.periodo} onChange={(v) => setFilters((f) => ({ ...f, periodo: v }))} />
      <VendedorFilter value={filters.vendedor} onChange={(v) => setFilters((f) => ({ ...f, vendedor: v }))} />
      <ProvinciaFilter value={filters.provincia} onChange={(v) => setFilters((f) => ({ ...f, provincia: v }))} />
      <ProductoFilter value={filters.producto} onChange={(v) => setFilters((f) => ({ ...f, producto: v }))} />
      {anyActive && (
        <button className="chip-reset" onClick={onReset}>Limpiar filtros</button>
      )}
    </div>
  );
}

/* ───────────────────── KPI cards ───────────────────── */
function KPIRow({ filters, scaleFactor }) {
  const monthly = DATA.ventasMensuales;
  const total = useMemo(() => {
    const map = { enero: monthly[0], febrero: monthly[1], marzo: monthly[2], abril: monthly[3] };
    if (filters.periodo === 'todo') {
      return monthly.reduce((s, m) => s + m.total, 0);
    }
    return (map[filters.periodo] || monthly[3]).total;
  }, [filters.periodo]);
  const scaledTotal = total * scaleFactor;
  const last3Avg = (monthly[1].total + monthly[2].total + monthly[3].total) / 3;

  const prevMonth = {
    abril: monthly[2].total, marzo: monthly[1].total, febrero: monthly[0].total, enero: null, todo: null,
  }[filters.periodo];
  const variation = prevMonth ? ((total - prevMonth) / prevMonth) * 100 : null;
  const variationLabel = variation == null ? '—' : (variation >= 0 ? '+' : '') + variation.toFixed(0) + '% vs mes ant.';

  // Card 4: top vendor — recompute based on filter
  const vendedorPool = filters.vendedor === 'todos' ? DATA.vendedores : DATA.vendedores.filter((v) => v.nombre === filters.vendedor);
  const topVendedor = vendedorPool[0] || DATA.vendedores[0];

  // Card 3: top product
  const topProd = filters.producto === 'todos'
    ? DATA.topProductosAbril[0]
    : DATA.topProductosAbril.find((p) => p.codigo === filters.producto) || DATA.topProductosAbril[0];

  return (
    <div className="kpi-row">
      <div className="kpi">
        <div className="kpi-label">Venta del período</div>
        <div className="kpi-value">{fmtM(scaledTotal)}</div>
        <div>
          {variation != null ? (
            <span className={classNames('kpi-var', variation < 0 ? 'neg' : 'pos')}>
              <span>{variation < 0 ? '↓' : '↑'}</span> {variationLabel}
            </span>
          ) : <span className="kpi-sub">acumulado ene–abr</span>}
        </div>
        <div className="kpi-foot">
          <Sparkline series={monthly} highlightLast />
        </div>
      </div>

      <div className="kpi">
        <div className="kpi-label">Promedio últ. 3 meses</div>
        <div className="kpi-value">{fmtM(last3Avg)}</div>
        <div className="kpi-sub">feb · mar · abr</div>
        <div className="kpi-foot">
          <Sparkline series={monthly.slice(1)} highlightLast />
        </div>
      </div>

      <div className="kpi">
        <div className="kpi-label">Producto top del período</div>
        <div className="kpi-value">{topProd.codigo}</div>
        <div className="kpi-sub">{fmtM(topProd.monto)} · 32 facturas</div>
        <div className="kpi-foot" style={{ paddingTop: 6 }}>
          <span className="kpi-var pos"><span>↑</span> +92% vs mes ant.</span>
        </div>
      </div>

      <div className="kpi">
        <div className="kpi-label">Top vendedor del período</div>
        <div className="kpi-value">{topVendedor.nombre.split(' ').slice(-1)[0]}</div>
        <div className="kpi-sub">{fmtM(topVendedor.total)} · {topVendedor.porc}% del total</div>
        <div className="kpi-foot">
          <div className="kpi-progress" title={`${topVendedor.porc}%`}>
            <div className="kpi-progress-fill" style={{ width: topVendedor.porc + '%' }} />
          </div>
          <div className="kpi-progress-labels">
            <span>0%</span>
            <span style={{ color: '#D85A30', fontWeight: 500 }}>{topVendedor.porc}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Products card ───────────────────── */
function ProductsCard({ metric, setMetric, selectedProduct, onPick }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Top 10 productos</div>
          <div className="card-subtitle">click en una barra para filtrar el dashboard</div>
        </div>
        <div className="toggle">
          <button className={classNames('toggle-btn', metric === 'monto' && 'on')}
                  onClick={() => setMetric('monto')}>Ventas $</button>
          <button className={classNames('toggle-btn', metric === 'unidades' && 'on')}
                  onClick={() => setMetric('unidades')}>Unidades</button>
        </div>
      </div>
      <ProductsBar products={DATA.topProductosAbril} metric={metric} selected={selectedProduct} onPick={onPick} />
    </div>
  );
}

/* ───────────────────── Geo card ───────────────────── */
function GeoCard({ scaledProvinces, selectedProvincia, onPick }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Distribución geográfica</div>
          <div className="card-subtitle">color e intensidad según volumen del período</div>
        </div>
      </div>
      <div className="geo-split">
        <ArgentinaMap provinces={scaledProvinces} selected={selectedProvincia} onPick={onPick} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <ProvinceRanking provinces={scaledProvinces} selected={selectedProvincia} onPick={onPick} />
          <div className="geo-tail">
            <div>+ 10 provincias · {fmtM(scaledProvinces.slice(7).reduce((s, p) => s + p.total, 0))}</div>
            <div className="empty">Sin operaciones: 7 provincias</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Detail table ───────────────────── */
const COLS = [
  { key: 'cliente',        label: 'Cliente',           align: 'left' },
  { key: 'articulo',       label: 'Artículo',          align: 'left' },
  { key: 'provincia',      label: 'Provincia',         align: 'left' },
  { key: 'ventaActual',    label: 'Venta $ actual',    align: 'right', isNum: true },
  { key: 'varDinero',      label: 'Var $ mes ant.',    align: 'right', isNum: true },
  { key: 'unidadesActual', label: 'Unidades actual',   align: 'right', isNum: true },
  { key: 'varUnidades',    label: 'Var u. mes ant.',   align: 'right', isNum: true },
];

function DetailTable({ rows }) {
  const [sortKey, setSortKey] = useState('ventaActual');
  const [sortDir, setSortDir] = useState('desc');
  const sorted = useMemo(() => {
    const sign = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') return sign * av.localeCompare(bv);
      return sign * (av - bv);
    });
  }, [rows, sortKey, sortDir]);
  const visible = sorted.slice(0, 10);

  function clickHeader(k) {
    if (k === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(k);
      setSortDir(k === 'cliente' || k === 'articulo' || k === 'provincia' ? 'asc' : 'desc');
    }
  }
  function varClass(v, threshold) {
    if (Math.abs(v) < threshold) return 'var-neutral';
    return v < 0 ? 'var-neg' : 'var-pos';
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Detalle por cliente × artículo</div>
          <div className="card-subtitle">click en los headers para ordenar</div>
        </div>
      </div>
      <div className="tablewrap">
        <table className="detail">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.key}
                    className={classNames(sortKey === c.key && 'sorted', c.align === 'right' && 'col-num')}
                    onClick={() => clickHeader(c.key)}>
                  {c.label}
                  <span className="sort-ind">{sortKey === c.key ? (sortDir === 'asc' ? '▲' : '▼') : '▾'}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.cliente + '·' + r.articulo}>
                <td className="col-cliente" title={r.cliente}>{r.cliente}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums', color: '#185FA5', fontWeight: 500 }}>{r.articulo}</td>
                <td>{r.provincia}</td>
                <td className="col-num">$ {r.ventaActual.toFixed(1)} M</td>
                <td className={classNames('col-num', varClass(r.varDinero, 1))}>
                  {(r.varDinero >= 0 ? '+' : '') + r.varDinero.toFixed(1)} M
                </td>
                <td className="col-num">{r.unidadesActual.toLocaleString('es-AR')}</td>
                <td className={classNames('col-num', varClass(r.varUnidades, 100))}>
                  {(r.varUnidades >= 0 ? '+' : '') + r.varUnidades.toLocaleString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-foot">
        Mostrando {visible.length} de {rows.length} filas · <a href="#">ver todas</a>
      </div>
    </div>
  );
}

/* ───────────────────── App root ───────────────────── */
function App() {
  const [filters, setFilters] = useState({
    periodo: 'abril',
    vendedor: 'todos',
    provincia: 'todas',
    producto: 'todos',
  });
  // Cross-filters from click events (separate from chip filters, temporary)
  const [crossProduct, setCrossProduct] = useState(null);
  const [crossProvincia, setCrossProvincia] = useState(null);
  const [productMetric, setProductMetric] = useState('monto');

  const partial = filters.periodo === 'abril' || filters.periodo === 'todo';
  const anyActive = filters.periodo !== 'abril' || filters.vendedor !== 'todos'
    || filters.provincia !== 'todas' || filters.producto !== 'todos'
    || crossProduct || crossProvincia;

  function resetFilters() {
    setFilters({ periodo: 'abril', vendedor: 'todos', provincia: 'todas', producto: 'todos' });
    setCrossProduct(null);
    setCrossProvincia(null);
  }

  // Compute scale factor when filters narrow the view (purely indicative for prototype)
  const scaleFactor = useMemo(() => {
    let f = 1;
    if (filters.vendedor !== 'todos') {
      const v = DATA.vendedores.find((x) => x.nombre === filters.vendedor);
      if (v) f *= v.porc / 100;
    }
    if (filters.provincia !== 'todas') {
      const p = DATA.provincias.find((x) => x.nombre === filters.provincia);
      if (p) f *= p.porc / 100;
    }
    if (crossProvincia) {
      const p = DATA.provincias.find((x) => x.nombre === crossProvincia);
      if (p) f *= p.porc / 100;
    }
    if (filters.producto !== 'todos' || crossProduct) f *= 0.08;
    return f;
  }, [filters, crossProduct, crossProvincia]);

  // For the geo card we still show absolute values from provinces, but selection comes from chip or cross
  const selectedProvincia = filters.provincia !== 'todas' ? filters.provincia : crossProvincia;
  const selectedProducto = filters.producto !== 'todos' ? filters.producto : crossProduct;

  // Filter rows for table by selected provincia
  const tableRows = useMemo(() => {
    let rows = DATA.clientesDetalle;
    const provFilter = selectedProvincia;
    if (provFilter) {
      const short = provFilter === 'Buenos Aires' ? 'Bs As' : provFilter;
      rows = rows.filter((r) => r.provincia === short || r.provincia === provFilter);
    }
    return rows;
  }, [selectedProvincia]);

  function handleProductPick(code) {
    setCrossProduct((c) => c === code ? null : code);
  }
  function handleProvinciaPick(name) {
    setCrossProvincia((c) => c === name ? null : name);
  }

  return (
    <div className="app">
      <div className="brandbar">
        <span className="brand-mark">VMG</span>
        <span className="brand-title">VMG — Tablero Ventas 2026</span>
        <span className="brand-spacer" />
      </div>

      <FiltersBar filters={filters} setFilters={setFilters} partial={partial}
                  anyActive={anyActive} onReset={resetFilters} />

      {(crossProduct || crossProvincia) && (
        <div className="crossfilter-row">
          <span>Filtros cruzados activos:</span>
          {crossProduct && (
            <span className="crossfilter-tag">
              Producto: {crossProduct}
              <button onClick={() => setCrossProduct(null)}>×</button>
            </span>
          )}
          {crossProvincia && (
            <span className="crossfilter-tag">
              Provincia: {crossProvincia}
              <button onClick={() => setCrossProvincia(null)}>×</button>
            </span>
          )}
        </div>
      )}

      <KPIRow filters={filters} scaleFactor={scaleFactor} />

      <div className="split">
        <ProductsCard metric={productMetric} setMetric={setProductMetric}
                      selectedProduct={selectedProducto} onPick={handleProductPick} />
        <GeoCard scaledProvinces={DATA.provincias}
                 selectedProvincia={selectedProvincia}
                 onPick={handleProvinciaPick} />
      </div>

      <DetailTable rows={tableRows} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
