const TYPE_LABEL = {
  long: 'Long',
  short: 'Short',
  long_puts: 'Long-dated puts',
  cash: 'Cash'
};

const TYPE_PILL_CLASS = {
  long: 'pill-long',
  short: 'pill-short',
  long_puts: 'pill-puts',
  cash: 'pill-cash'
};

const TYPE_BAR_CLASS = {
  long: '',
  short: 'bar-short',
  long_puts: 'bar-puts',
  cash: 'bar-cash'
};

const IMPACT_LABEL = {
  positive: 'Positive',
  negative: 'Negative',
  mixed: 'Mixed',
  negative_for_short: 'Headwind for short',
  negative_for_puts: 'Headwind for puts'
};

async function load() {
  try {
    const res = await fetch('data/portfolio.json', { cache: 'no-store' });
    const data = await res.json();
    render(data);
  } catch (e) {
    document.getElementById('as-of').textContent = 'Failed to load portfolio data.';
    console.error(e);
  }
}

function render(data) {
  renderAsOf(data);
  renderSummary(data);
  renderReview(data.dailyReview);
  renderHoldings(data.holdings);
  renderNews(data.news, data.holdings);
}

function renderAsOf(data) {
  const d = new Date(data.asOf + 'T00:00:00');
  const formatted = d.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById('as-of').textContent = `As of ${formatted}`;
  const rd = document.getElementById('review-date');
  if (rd && data.dailyReview) rd.textContent = data.dailyReview.date;
}

function renderSummary(data) {
  const holdings = data.holdings;
  const grossLong = holdings.filter(h => h.type === 'long' || h.type === 'long_puts')
    .reduce((s, h) => s + h.weight, 0);
  const grossShort = holdings.filter(h => h.type === 'short')
    .reduce((s, h) => s + Math.abs(h.weight), 0);
  const cash = holdings.filter(h => h.type === 'cash')
    .reduce((s, h) => s + h.weight, 0);
  const net = grossLong - grossShort;

  const stats = [
    { label: 'Gross long', value: grossLong.toFixed(1) + '%', color: 'text-emerald-400' },
    { label: 'Gross short', value: grossShort.toFixed(1) + '%', color: 'text-rose-400' },
    { label: 'Net exposure', value: net.toFixed(1) + '%', color: net >= 0 ? 'text-emerald-400' : 'text-rose-400' },
    { label: 'Cash', value: cash.toFixed(1) + '%', color: 'text-slate-200' }
  ];

  document.getElementById('summary-stats').innerHTML = stats.map(s => `
    <div class="card px-4 py-3">
      <div class="text-xs text-slate-500 uppercase tracking-wider">${s.label}</div>
      <div class="text-2xl font-semibold mono ${s.color} mt-1">${s.value}</div>
    </div>
  `).join('');
}

function renderReview(review) {
  if (!review) return;
  document.getElementById('review-headline').textContent = review.headline || '';
  document.getElementById('review-summary').textContent = review.summary || '';

  const renderList = (id, items) => {
    const el = document.getElementById(id);
    el.innerHTML = (items || []).map(item => `
      <li class="flex gap-2">
        <span class="text-slate-600 mt-[2px]">•</span>
        <span>${escapeHtml(item)}</span>
      </li>
    `).join('');
  };

  renderList('review-risks', review.risks);
  renderList('review-bright', review.bright_spots);
  renderList('review-actions', review.actions_to_consider);
}

function renderHoldings(holdings) {
  document.getElementById('holding-count').textContent = `${holdings.length} positions`;

  const maxAbs = Math.max(...holdings.map(h => Math.abs(h.weight)));

  const body = document.getElementById('holdings-body');
  body.innerHTML = holdings.map(h => {
    const absW = Math.abs(h.weight);
    const barWidth = (absW / maxAbs) * 100;
    const sign = h.weight < 0 ? '-' : '';
    const valueColor = h.weight < 0 ? 'text-rose-400' : (h.type === 'cash' ? 'text-slate-300' : 'text-white');
    const pillClass = TYPE_PILL_CLASS[h.type] || 'pill-cash';
    const barClass = TYPE_BAR_CLASS[h.type] || '';
    const label = h.ticker ? `${h.name} <span class="text-slate-500 mono text-xs ml-1">${h.ticker}</span>` : h.name;
    return `
      <tr class="row-hover border-b border-slate-800/60">
        <td class="py-2.5 pr-2 text-slate-200">${label}</td>
        <td class="py-2.5 px-2"><span class="pill ${pillClass}">${TYPE_LABEL[h.type]}</span></td>
        <td class="py-2.5 px-2 text-right mono font-semibold ${valueColor}">${sign}${absW.toFixed(1)}%</td>
        <td class="py-2.5 pl-2">
          <div class="bar ${barClass}" style="width: ${barWidth}%"></div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderNews(news, holdings) {
  const list = news || [];
  document.getElementById('news-count').textContent = `${list.length} items`;

  const tickerToName = {};
  holdings.forEach(h => { if (h.ticker) tickerToName[h.ticker] = h.name; });

  const sorted = [...list].sort((a, b) => (a.date < b.date ? 1 : -1));

  const el = document.getElementById('news-list');
  el.innerHTML = sorted.map(item => {
    const chips = (item.positions || []).map(p => `<span class="chip">${p}</span>`).join('');
    const impactClass = 'impact-' + (item.impact || 'mixed');
    const impactLabel = IMPACT_LABEL[item.impact] || item.impact || '';
    const date = item.date ? new Date(item.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
    const sourceLink = item.url
      ? `<a href="${item.url}" target="_blank" rel="noopener" class="text-xs">${escapeHtml(item.source || 'source')} ↗</a>`
      : `<span class="text-xs text-slate-500">${escapeHtml(item.source || '')}</span>`;
    return `
      <article class="news-card border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] mono text-slate-500">${date}</span>
          <span class="text-[11px] font-semibold ${impactClass}">${impactLabel}</span>
        </div>
        <h4 class="text-sm font-semibold text-white leading-snug mb-1.5">${escapeHtml(item.headline)}</h4>
        <p class="text-xs text-slate-400 leading-relaxed mb-2">${escapeHtml(item.summary || '')}</p>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>${chips}</div>
          ${sourceLink}
        </div>
      </article>
    `;
  }).join('');
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

load();
