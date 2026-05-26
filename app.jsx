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

function ClienteFilter({ value, onChange }) {
  const [q, setQ] = useState('');
  const clientes = useMemo(() => Array.from(new Set(DATA.clientesDetalle.map((r) => r.cliente))).sort(), []);
  const filtered = useMemo(() => {
    if (!q) return clientes;
    return clientes.filter((c) => c.toLowerCase().includes(q.toLowerCase()));
  }, [q, clientes]);
  const short = value === 'todos' ? 'todos' : (value.length > 22 ? value.slice(0, 22) + '…' : value);
  return (
    <FilterChip label="Cliente" value={short} isDefault={value === 'todos'} align="right">
      {(close) => (
        <React.Fragment>
          <input className="dropdown-search" placeholder="Buscar entre 126 clientes…"
                 value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          <div className={classNames('dropdown-item', value === 'todos' && 'selected')}
               onClick={() => { onChange('todos'); setQ(''); close(); }}>
            <span>Todos los clientes</span>
            <span className="dim">126</span>
          </div>
          {filtered.map((c) => (
            <div key={c}
              className={classNames('dropdown-item', value === c && 'selected')}
              onClick={() => { onChange(c); setQ(''); close(); }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{c}</span>
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
      <ClienteFilter value={filters.cliente} onChange={(v) => setFilters((f) => ({ ...f, cliente: v }))} />
      {anyActive && (
        <button className="chip-reset" onClick={onReset}>Limpiar filtros</button>
      )}
    </div>
  );
}

/* ───────────────────── KPI cards ───────────────────── */
function KPIRow({ view, filters, onPickPeriod, onPickVendor, onPickProduct }) {
  const monthly = view.monthly;
  const monthIdx = { enero: 0, febrero: 1, marzo: 2, abril: 3 };
  const periodoIdx = monthIdx[filters.periodo];

  return (
    <div className="kpi-row">
      <div className="kpi">
        <div className="kpi-label">Venta del período</div>
        <div className="kpi-value">{fmtM(view.total)}</div>
        <div>
          {view.variation != null ? (
            <span className={classNames('kpi-var', view.variation < 0 ? 'neg' : 'pos')}>
              <span>{view.variation < 0 ? '↓' : '↑'}</span>
              {' '}{(view.variation >= 0 ? '+' : '') + view.variation.toFixed(0)}% vs mes ant.
            </span>
          ) : <span className="kpi-sub">acumulado ene–abr</span>}
        </div>
        <div className="kpi-foot">
          <Sparkline series={monthly} highlightLast={filters.periodo === 'abril' || filters.periodo === 'todo'}
                     highlightIndex={periodoIdx} onPick={onPickPeriod} />
        </div>
      </div>

      <div className="kpi">
        <div className="kpi-label">Promedio últ. 3 meses</div>
        <div className="kpi-value">{fmtM(view.last3Avg)}</div>
        <div className="kpi-sub">feb · mar · abr</div>
        <div className="kpi-foot">
          <Sparkline series={monthly.slice(1)}
                     highlightIndex={periodoIdx != null && periodoIdx >= 1 ? periodoIdx - 1 : null}
                     highlightLast={filters.periodo === 'abril' || filters.periodo === 'todo'}
                     onPick={(m) => onPickPeriod(m)} />
        </div>
      </div>

      <div className="kpi clickable" onClick={() => onPickProduct(view.topProduct.codigo)}
           title="click para filtrar por este producto">
        <div className="kpi-label">Producto top del período</div>
        <div className="kpi-value">{view.topProduct.codigo}</div>
        <div className="kpi-sub">{fmtM(view.topProduct.monto)} · {view.topProduct.facturas || 32} facturas</div>
        <div className="kpi-foot" style={{ paddingTop: 6 }}>
          <span className={classNames('kpi-var', view.topProduct.varPct < 0 ? 'neg' : 'pos')}>
            <span>{view.topProduct.varPct < 0 ? '↓' : '↑'}</span>
            {' '}{(view.topProduct.varPct >= 0 ? '+' : '') + Math.round(view.topProduct.varPct)}% vs mes ant.
          </span>
        </div>
      </div>

      <div className="kpi clickable" onClick={() => onPickVendor(view.topVendor.nombre)}
           title="click para filtrar por este vendedor">
        <div className="kpi-label">Top vendedor del período</div>
        <div className="kpi-value">{view.topVendor.nombre.split(' ').slice(-1)[0]}</div>
        <div className="kpi-sub">{fmtM(view.topVendor.totalView)} · {view.topVendor.porc}% del total</div>
        <div className="kpi-foot">
          <div className="kpi-progress" title={`${view.topVendor.porc}%`}>
            <div className="kpi-progress-fill" style={{ width: view.topVendor.porc + '%' }} />
          </div>
          <div className="kpi-progress-labels">
            <span>0%</span>
            <span style={{ color: '#D85A30', fontWeight: 500 }}>{view.topVendor.porc}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Products card ───────────────────── */
function ProductsCard({ products, metric, setMetric, selectedProduct, onPick }) {
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
      <ProductsBar products={products} metric={metric} selected={selectedProduct} onPick={onPick} />
    </div>
  );
}

/* ───────────────────── Geo card ───────────────────── */
function GeoCard({ provinces, selectedProvincia, onPick }) {
  const tailTotal = provinces.slice(7).reduce((s, p) => s + p.total, 0);
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Distribución geográfica</div>
          <div className="card-subtitle">color e intensidad según volumen del período</div>
        </div>
      </div>
      <div className="geo-split">
        <ArgentinaMap provinces={provinces} selected={selectedProvincia} onPick={onPick} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <ProvinceRanking provinces={provinces} selected={selectedProvincia} onPick={onPick} />
          <div className="geo-tail">
            <div>+ 10 provincias · {fmtM(tailTotal)}</div>
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

function DetailTable({ rows, selectedProducto, selectedProvincia, selectedCliente, onPickProducto, onPickProvincia, onRowClick }) {
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
  function fullProvName(short) {
    // dataset uses 'Bs As' shorthand for Buenos Aires
    if (short === 'Bs As') return 'Buenos Aires';
    return short;
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">Detalle por cliente × artículo</div>
          <div className="card-subtitle">click en una fila para filtrar por cliente · artículo · provincia · click en headers para ordenar</div>
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
            {visible.map((r) => {
              const provFull = fullProvName(r.provincia);
              const isProdActive = selectedProducto === r.articulo;
              const isProvActive = selectedProvincia === provFull;
              const isCliActive  = selectedCliente === r.cliente;
              const rowActive = isProdActive && isProvActive && isCliActive;
              function stop(e, fn) { e.stopPropagation(); fn(); }
              return (
                <tr key={r.cliente + '·' + r.articulo}
                    className={classNames('clickable', rowActive && 'active')}
                    onClick={() => onRowClick(r)}>
                  <td>
                    <span className={classNames('cell-chip neutral', isCliActive && 'on')}
                          style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}
                          title={r.cliente}>{r.cliente}</span>
                  </td>
                  <td>
                    <button className={classNames('cell-chip', isProdActive && 'on')}
                            onClick={(e) => stop(e, () => onPickProducto(r.articulo))}>
                      {r.articulo}
                    </button>
                  </td>
                  <td>
                    <button className={classNames('cell-chip neutral', isProvActive && 'on')}
                            onClick={(e) => stop(e, () => onPickProvincia(provFull))}>
                      {r.provincia}
                    </button>
                  </td>
                  <td className="col-num">$ {r.ventaActual.toFixed(1)} M</td>
                  <td className={classNames('col-num', varClass(r.varDinero, 1))}>
                    {(r.varDinero >= 0 ? '+' : '') + r.varDinero.toFixed(1)} M
                  </td>
                  <td className="col-num">{r.unidadesActual.toLocaleString('es-AR')}</td>
                  <td className={classNames('col-num', varClass(r.varUnidades, 100))}>
                    {(r.varUnidades >= 0 ? '+' : '') + r.varUnidades.toLocaleString('es-AR')}
                  </td>
                </tr>
              );
            })}
            {!visible.length && (
              <tr>
                <td colSpan={COLS.length} style={{ color: '#9999A0', textAlign: 'center', padding: '24px 0' }}>
                  Sin filas para los filtros activos
                </td>
              </tr>
            )}
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
const MONTH_IDX = { enero: 0, febrero: 1, marzo: 2, abril: 3 };
const PROV_SHORT = { 'Buenos Aires': 'Bs As' };

function buildView(filters) {
  const months = DATA.ventasMensuales;
  // Month factor — period total / abril total (abril is the data baseline)
  let periodTotal, prevTotal = null, isAggregate = false;
  if (filters.periodo === 'todo') {
    periodTotal = months.reduce((s, m) => s + m.total, 0);
    isAggregate = true;
  } else {
    const i = MONTH_IDX[filters.periodo];
    periodTotal = months[i].total;
    prevTotal = i > 0 ? months[i - 1].total : null;
  }
  const monthFactor = periodTotal / months[3].total; // baseline = abril

  // Vendor
  const activeVendor = filters.vendedor === 'todos' ? null
    : DATA.vendedores.find((v) => v.nombre === filters.vendedor);
  const vendorFactor = activeVendor ? activeVendor.porc / 100 : 1;

  // Cliente — share of period derived from this cliente's rows in the detail dataset
  const activeCliente = filters.cliente === 'todos' ? null : filters.cliente;
  let clienteFactor = 1;
  if (activeCliente) {
    const clientRows = DATA.clientesDetalle.filter((r) => r.cliente === activeCliente);
    const clientSum = clientRows.reduce((s, r) => s + r.ventaActual, 0);
    clienteFactor = clientSum > 0 ? Math.min(1, clientSum / months[3].total) : 0.01;
  }

  // Provincia
  const activeProv = filters.provincia === 'todas' ? null
    : DATA.provincias.find((p) => p.nombre === filters.provincia);
  const provinciaFactor = activeProv ? activeProv.porc / 100 : 1;

  // Producto
  const activeProd = filters.producto === 'todos' ? null : filters.producto;
  const productInPeriod = activeProd
    ? (DATA.topProductosAbril.find((p) => p.codigo === activeProd) || { monto: 4, unidades: 800 })
    : null;
  const productoFactor = activeProd
    ? (productInPeriod.monto / months[3].total)
    : 1;

  // Overall scaled total (combine all)
  const total = months[3].total * monthFactor * vendorFactor * provinciaFactor * productoFactor * clienteFactor;

  // Variation vs previous month — normalize for April (parcial, hasta el 22 = 22/31 del mes ant.)
  // Spec: "comparativos sobre mismo rango"
  const periodDayShare = filters.periodo === 'abril' ? (22 / 31) : 1;
  const prevScaledTotal = prevTotal != null
    ? prevTotal * periodDayShare * vendorFactor * provinciaFactor * productoFactor * clienteFactor
    : null;
  const variation = prevScaledTotal != null && prevScaledTotal > 0
    ? ((total - prevScaledTotal) / prevScaledTotal) * 100
    : null;

  // Last 3 months avg (always feb/mar/abr) scaled by non-period filters
  const last3Avg = ((months[1].total + months[2].total + months[3].total) / 3)
    * vendorFactor * provinciaFactor * productoFactor * clienteFactor;

  // Products: scale by everything except product (and except provincia for ranking purposes — keep)
  const productsScale = monthFactor * vendorFactor * provinciaFactor * clienteFactor;
  const products = DATA.topProductosAbril.map((p) => ({
    ...p,
    monto: p.monto * productsScale,
    unidades: Math.round(p.unidades * productsScale),
  }));

  // Provinces: scale by month/vendor/product (NOT by provincia — that's the dim we display)
  const provinceScale = monthFactor * vendorFactor * productoFactor * clienteFactor;
  const provinces = DATA.provincias.map((p) => ({
    ...p,
    total: Math.round(p.total * provinceScale * 10) / 10,
  }));

  // Table rows
  let rows = DATA.clientesDetalle;
  if (activeProv) {
    const short = PROV_SHORT[activeProv.nombre] || activeProv.nombre;
    rows = rows.filter((r) => r.provincia === short || r.provincia === activeProv.nombre);
  }
  if (activeProd) rows = rows.filter((r) => r.articulo === activeProd);
  if (activeCliente) rows = rows.filter((r) => r.cliente === activeCliente);
  const rowScale = monthFactor * vendorFactor;
  rows = rows.map((r) => ({
    ...r,
    ventaActual: r.ventaActual * rowScale,
    varDinero: r.varDinero * rowScale,
    unidadesActual: Math.round(r.unidadesActual * rowScale),
    varUnidades: Math.round(r.varUnidades * rowScale),
  }));

  // Top product (from filtered products view). Top-product MoM is independent of the
  // overall period direction — lock to +92% (per spec/baseline) so it isn't flipped.
  const sortedProducts = products.slice().sort((a, b) => b.monto - a.monto);
  const topProductRaw = activeProd
    ? products.find((p) => p.codigo === activeProd) || sortedProducts[0]
    : sortedProducts[0];
  const topProduct = {
    ...topProductRaw,
    facturas: Math.max(1, Math.round(32 * monthFactor * vendorFactor * provinciaFactor)),
    varPct: 92,
  };

  // Top vendor
  let topVendor;
  if (activeVendor) {
    topVendor = {
      ...activeVendor,
      totalView: activeVendor.total * monthFactor * provinciaFactor * productoFactor,
    };
  } else {
    topVendor = {
      ...DATA.vendedores[0],
      totalView: DATA.vendedores[0].total * monthFactor * provinciaFactor * productoFactor,
    };
  }

  return {
    monthly: months,
    total, last3Avg, variation,
    products, provinces, rows,
    topProduct, topVendor,
    isAggregate,
  };
}

function App() {
  const [filters, setFilters] = useState({
    periodo: 'abril',
    vendedor: 'todos',
    provincia: 'todas',
    producto: 'todos',
    cliente: 'todos',
  });
  const [productMetric, setProductMetric] = useState('monto');

  const partial = filters.periodo === 'abril' || filters.periodo === 'todo';
  const anyActive = filters.periodo !== 'abril' || filters.vendedor !== 'todos'
    || filters.provincia !== 'todas' || filters.producto !== 'todos'
    || filters.cliente !== 'todos';

  function resetFilters() {
    setFilters({ periodo: 'abril', vendedor: 'todos', provincia: 'todas', producto: 'todos', cliente: 'todos' });
  }

  // Unified cross-filter handlers — clicking same value clears
  function pickPeriod(mes) {
    setFilters((f) => ({ ...f, periodo: f.periodo === mes ? 'todo' : mes }));
  }
  function pickVendor(nombre) {
    setFilters((f) => ({ ...f, vendedor: f.vendedor === nombre ? 'todos' : nombre }));
  }
  function pickProvincia(nombre) {
    setFilters((f) => ({ ...f, provincia: f.provincia === nombre ? 'todas' : nombre }));
  }
  function pickProducto(code) {
    setFilters((f) => ({ ...f, producto: f.producto === code ? 'todos' : code }));
  }
  function pickCliente(nombre) {
    setFilters((f) => ({ ...f, cliente: f.cliente === nombre ? 'todos' : nombre }));
  }
  // Row click — set ALL row dimensions at once. Clicking the same row clears them.
  function pickRow(r) {
    const provFull = r.provincia === 'Bs As' ? 'Buenos Aires' : r.provincia;
    setFilters((f) => {
      const same = f.cliente === r.cliente && f.producto === r.articulo && f.provincia === provFull;
      if (same) return { ...f, cliente: 'todos', producto: 'todos', provincia: 'todas' };
      return { ...f, cliente: r.cliente, producto: r.articulo, provincia: provFull };
    });
  }

  const view = useMemo(() => buildView(filters), [filters]);

  const selectedProvincia = filters.provincia !== 'todas' ? filters.provincia : null;
  const selectedProducto = filters.producto !== 'todos' ? filters.producto : null;

  return (
    <div className="app">
      <div className="brandbar">
        <span className="brand-mark">VMG</span>
        <span className="brand-title">VMG — Tablero Ventas 2026</span>
        <span className="brand-spacer" />
      </div>

      <FiltersBar filters={filters} setFilters={setFilters} partial={partial}
                  anyActive={anyActive} onReset={resetFilters} />

      <KPIRow view={view} filters={filters}
              onPickPeriod={pickPeriod} onPickVendor={pickVendor} onPickProduct={pickProducto} />

      <div className="split">
        <ProductsCard products={view.products}
                      metric={productMetric} setMetric={setProductMetric}
                      selectedProduct={selectedProducto} onPick={pickProducto} />
        <GeoCard provinces={view.provinces}
                 selectedProvincia={selectedProvincia}
                 onPick={pickProvincia} />
      </div>

      <DetailTable rows={view.rows}
                   selectedProducto={selectedProducto}
                   selectedProvincia={selectedProvincia}
                   selectedCliente={filters.cliente !== 'todos' ? filters.cliente : null}
                   onPickProducto={pickProducto}
                   onPickProvincia={pickProvincia}
                   onRowClick={pickRow} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
