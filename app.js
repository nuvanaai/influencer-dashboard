// Cata Freer Command Center — Dashboard Logic (Pastel Redesign)

const BIZ_COLORS = {
  brand: { dot: 'bg-pink-400', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', label: 'Personal Brand' },
  nuvana: { dot: 'bg-blue-400', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Nuvana' },
  storytime: { dot: 'bg-green-400', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'Storytime' },
  restaurant: { dot: 'bg-orange-400', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: 'Restaurant' }
};

const TYPE_ICONS = {
  deal: '💰',
  email: '📧',
  event: '📅',
  task: '📋',
  bill: '💳',
  milestone: '🚀'
};

let dashboardData = null;
let contactsData = null;
let calendarData = null;
let revenueData = null;
let outreachData = null;
let growthData = null;
let activeFilter = 'all';
let activeRevFilter = 'all';
let activeOutreachFilter = 'all';
let columnFilter = null; // for stat-click filtering
let calYear = 2026;
let calMonth = 2; // March (0-indexed)

// Load data
async function loadData() {
  try {
    const [dashRes, contactsRes, calRes, revRes, outRes, growthRes] = await Promise.all([
      fetch('data/dashboard.json'),
      fetch('data/contacts.json'),
      fetch('data/calendar.json'),
      fetch('data/revenue.json'),
      fetch('data/outreach.json'),
      fetch('data/growth.json')
    ]);
    dashboardData = await dashRes.json();
    contactsData = await contactsRes.json();
    calendarData = await calRes.json();
    revenueData = await revRes.json();
    outreachData = await outRes.json();
    growthData = await growthRes.json();
    render();
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

// Render everything
let activeDealView = 'inbox'; // default to inbox

function render() {
  if (!dashboardData) return;
  renderStats();
  renderCards();
  renderInboxView();
  renderEvents();
  renderLastUpdated();
  // Initialize view toggle state
  switchDealView(activeDealView);
}

// ===== DEAL VIEW TOGGLE =====
function switchDealView(view) {
  activeDealView = view;
  const inbox = document.getElementById('inbox-view');
  const board = document.getElementById('kanban-board');
  const inboxBtn = document.getElementById('view-btn-inbox');
  const boardBtn = document.getElementById('view-btn-board');
  if (view === 'inbox') {
    if (inbox) inbox.classList.remove('hidden');
    if (board) board.classList.add('hidden');
    if (inboxBtn) inboxBtn.classList.add('active');
    if (boardBtn) boardBtn.classList.remove('active');
    renderInboxView();
  } else {
    if (inbox) inbox.classList.add('hidden');
    if (board) board.classList.remove('hidden');
    if (inboxBtn) inboxBtn.classList.remove('active');
    if (boardBtn) boardBtn.classList.add('active');
  }
}

// ===== INBOX VIEW =====
const INBOX_STATUS_COLORS = {
  todo: { dot: '#f43f5e', label: 'To Do' },
  in_progress: { dot: '#f59e0b', label: 'In Progress' },
  follow_up: { dot: '#38bdf8', label: 'Follow Up' },
  done: { dot: '#10b981', label: 'Done' },
  confirmed: { dot: '#22c55e', label: 'Confirmed' },
  sent: { dot: '#8b5cf6', label: 'Sent' }
};

const INBOX_GROUPS = [
  { id: 'action', label: '\uD83D\uDD25 Needs Action', columns: ['todo', 'in_progress'] },
  { id: 'waiting', label: '\u23F3 Waiting for Reply', columns: ['follow_up'] },
  { id: 'confirmed', label: '\u2705 Confirmed', columns: ['confirmed', 'done'] },
  { id: 'sent', label: '\uD83D\uDCE4 Sent', columns: ['__sent__'] }
];

let expandedInboxCard = null;

function renderInboxView() {
  if (!dashboardData || activeDealView !== 'inbox') return;
  const container = document.getElementById('inbox-list');
  if (!container) return;

  const search = (document.getElementById('inbox-search')?.value || '').toLowerCase();
  const sentIds = getSentCardIds();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  let html = '';

  INBOX_GROUPS.forEach(group => {
    let cards;
    if (group.id === 'sent') {
      cards = dashboardData.cards.filter(c =>
        sentIds.includes(c.id) && c.column !== 'confirmed' && (activeFilter === 'all' || c.business === activeFilter)
      );
    } else if (group.id === 'confirmed') {
      cards = dashboardData.cards.filter(c =>
        group.columns.includes(c.column) && (activeFilter === 'all' || c.business === activeFilter)
      );
    } else {
      cards = dashboardData.cards.filter(c =>
        group.columns.includes(c.column) && !sentIds.includes(c.id) && (activeFilter === 'all' || c.business === activeFilter)
      );
    }

    // Search filter
    if (search) {
      cards = cards.filter(c =>
        c.title.toLowerCase().includes(search) ||
        (c.description || '').toLowerCase().includes(search) ||
        (c.contact || '').toLowerCase().includes(search)
      );
    }

    // Sort newest first
    cards.sort((a, b) => (b.updatedAt || '2020-01-01').localeCompare(a.updatedAt || '2020-01-01'));

    if (cards.length === 0) return;

    html += `<div class="inbox-group-header">${group.label} <span class="text-stone-400 font-normal ml-1">(${cards.length})</span></div>`;

    cards.forEach(card => {
      const effectiveCol = group.id === 'sent' ? 'sent' : card.column;
      const statusColor = INBOX_STATUS_COLORS[effectiveCol] || INBOX_STATUS_COLORS.todo;
      const biz = BIZ_COLORS[card.business] || BIZ_COLORS.brand;
      const isExpanded = expandedInboxCard === card.id;
      const isSent = getSentStatus(card.id);

      // Check if updated today
      const isNew = card.updatedAt && card.updatedAt >= todayStr;

      // Time indicator
      let timeStr = '';
      if (card.deadline) {
        const daysLeft = getDaysUntil(card.deadline);
        if (daysLeft === 0) timeStr = '<span class="text-rose-500 font-semibold">Today</span>';
        else if (daysLeft === 1) timeStr = '<span class="text-amber-500">Tomorrow</span>';
        else if (daysLeft > 0 && daysLeft <= 7) timeStr = `<span class="text-amber-500">${daysLeft}d left</span>`;
        else if (daysLeft < 0) timeStr = `<span class="text-stone-400">${Math.abs(daysLeft)}d ago</span>`;
        else {
          const dd = new Date(card.deadline + 'T00:00:00');
          timeStr = `<span class="text-stone-400">${dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>`;
        }
      } else if (card.updatedAt) {
        const ud = new Date(card.updatedAt + 'T00:00:00');
        timeStr = `<span class="text-stone-300">${ud.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>`;
      }

      // Action button
      let actionBtn = '';
      if (isSent && card.column !== 'confirmed') {
        actionBtn = `<span class="text-xs text-stone-400 bg-stone-50 px-2 py-1 rounded-lg">Sent</span>`;
      } else if (card.draftLink) {
        actionBtn = `<a href="${card.draftLink}" target="_blank" rel="noopener" class="text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors" onclick="event.stopPropagation()">${card.draftLabel || 'Open draft'}</a>`;
      } else if (card.link) {
        actionBtn = `<a href="${card.link}" target="_blank" rel="noopener" class="text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors" onclick="event.stopPropagation()">${card.linkLabel || 'Open'}</a>`;
      } else {
        const composeUrl = card.contactEmail
          ? `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(card.contactEmail)}&su=${encodeURIComponent(card.composeSubject || 'Re: ' + card.title)}`
          : null;
        if (composeUrl) {
          actionBtn = `<a href="${composeUrl}" target="_blank" rel="noopener" class="text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors" onclick="event.stopPropagation()">Compose</a>`;
        }
      }

      // Value badge
      const valueBadge = card.value ? `<span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">${card.value}</span>` : '';

      html += `
        <div class="inbox-row ${isExpanded ? 'expanded' : ''}" onclick="toggleInboxExpand('${card.id}')">
          ${isNew ? '<div class="inbox-new-dot"></div>' : '<div style="width:8px;flex-shrink:0;"></div>'}
          <div class="inbox-status-dot" style="background:${statusColor.dot};" title="${statusColor.label}"></div>
          <span class="biz-dot ${biz.dot} flex-shrink-0"></span>
          <div class="flex-1 min-w-0 flex items-center gap-3">
            <span class="font-semibold text-stone-700 text-sm truncate" style="min-width:80px;max-width:180px;">${card.title}</span>
            <span class="inbox-desc text-xs text-stone-400 truncate hidden sm:inline" style="max-width:250px;">${card.description || ''}</span>
          </div>
          <div class="inbox-actions flex items-center gap-2 flex-shrink-0">
            ${valueBadge}
            <span class="text-xs whitespace-nowrap">${timeStr}</span>
            ${actionBtn}
          </div>
        </div>`;

      // Expanded detail
      if (isExpanded) {
        const icon = TYPE_ICONS[card.type] || '\uD83D\uDCCC';
        const contactHTML = card.contact ? `<p class="text-xs text-stone-500 mb-1"><strong>Contact:</strong> ${card.contact}${card.contactEmail ? ' (' + card.contactEmail + ')' : ''}</p>` : '';

        let allButtonsHTML = '';
        if (!isSent || card.column === 'confirmed') {
          const gmailBtn = card.link ? `<a href="${card.link}" target="_blank" rel="noopener" class="text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors" onclick="event.stopPropagation()">${card.linkLabel || 'Open in Gmail'}</a>` : '';
          const draftBtn = card.draftLink ? `<a href="${card.draftLink}" target="_blank" rel="noopener" class="text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors" onclick="event.stopPropagation()">${card.draftLabel || 'Send follow-up'}</a>` : '';
          const composeUrl = card.contactEmail
            ? `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(card.contactEmail)}&su=${encodeURIComponent(card.composeSubject || 'Re: ' + card.title)}`
            : null;
          const composeBtn = composeUrl && !card.link && !card.draftLink ? `<a href="${composeUrl}" target="_blank" rel="noopener" class="text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors" onclick="event.stopPropagation()">Compose</a>` : '';
          const sentBtn = `<button class="text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors" onclick="event.stopPropagation(); markAsSent('${card.id}'); renderInboxView();">Mark as Sent</button>`;
          allButtonsHTML = [gmailBtn, draftBtn, composeBtn, sentBtn].filter(Boolean).join('');
        } else {
          allButtonsHTML = `
            <span class="text-xs font-medium text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg">Sent ${getSentDate(card.id)}</span>
            <button class="text-xs text-stone-400 hover:text-stone-600 underline" onclick="event.stopPropagation(); unmarkSent('${card.id}'); renderInboxView();">undo</button>`;
        }

        let deadlineHTML = '';
        if (card.deadline) {
          const dl = getDaysUntil(card.deadline);
          const dd = new Date(card.deadline + 'T00:00:00');
          const urgency = dl <= 3 ? 'text-rose-600 font-semibold' : dl <= 7 ? 'text-amber-500' : 'text-stone-400';
          deadlineHTML = `<p class="text-xs ${urgency} mb-1">Deadline: ${dd.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} (${dl === 0 ? 'Today!' : dl === 1 ? 'Tomorrow' : dl < 0 ? Math.abs(dl) + ' days ago' : dl + ' days left'})</p>`;
        }

        html += `
          <div class="inbox-expanded" onclick="event.stopPropagation()">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm">${icon}</span>
              <span class="text-xs px-2 py-0.5 rounded-full ${biz.bg} ${biz.text} font-medium">${biz.label}</span>
              <span class="text-xs text-stone-400">${statusColor.label}</span>
            </div>
            <p class="text-sm text-stone-600 mb-2">${card.description || 'No description'}</p>
            ${contactHTML}
            ${deadlineHTML}
            <div class="flex flex-wrap gap-1 mb-3">
              ${(card.tags || []).map(t => `<span class="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-400">${t}</span>`).join('')}
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              ${allButtonsHTML}
            </div>
          </div>`;
      }
    });
  });

  if (!html) {
    html = '<div class="p-8 text-center text-stone-400">No deals match your search.</div>';
  }

  container.innerHTML = html;
}

function toggleInboxExpand(cardId) {
  expandedInboxCard = expandedInboxCard === cardId ? null : cardId;
  renderInboxView();
}

// Stats bar
function renderStats() {
  const s = dashboardData.stats;
  document.getElementById('stat-deals').textContent = s.activeDeals;
  document.getElementById('stat-revenue').textContent = s.potentialRevenue;
  // Count confirmed deals dynamically
  const confirmedCount = dashboardData.cards.filter(c => c.column === 'confirmed').length;
  document.getElementById('stat-closed').textContent = confirmedCount;
  document.getElementById('stat-pending').textContent = s.pendingReplies;
}

// Last updated
function renderLastUpdated() {
  const d = new Date(dashboardData.lastUpdated);
  const now = new Date();
  const today = now.toDateString() === d.toDateString();
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  document.getElementById('last-updated').textContent = today
    ? `Updated today at ${timeStr}`
    : `Updated ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeStr}`;
}

// Filter by column (clickable stats)
function filterByColumn(col) {
  if (columnFilter === col) {
    columnFilter = null; // toggle off
  } else {
    columnFilter = col;
  }
  renderCards();
}

// Cards
function renderCards() {
  const columns = ['todo', 'in_progress', 'follow_up', 'done', 'confirmed', 'sent'];
  columns.forEach(col => {
    const container = document.getElementById(`col-${col}`);
    if (!container) return;

    // Determine visibility based on columnFilter
    const colEl = container.parentElement;
    if (columnFilter && col !== columnFilter && col !== 'sent') {
      colEl.style.display = 'none';
      return;
    } else {
      colEl.style.display = '';
    }

    let cards;
    if (col === 'sent') {
      if (columnFilter) {
        colEl.style.display = 'none';
        return;
      }
      colEl.style.display = '';
      const sentIds = getSentCardIds();
      // Only show in Sent column if NOT in confirmed column
      cards = dashboardData.cards.filter(c =>
        sentIds.includes(c.id) && c.column !== 'confirmed' && (activeFilter === 'all' || c.business === activeFilter)
      );
    } else if (col === 'confirmed') {
      // Confirmed column always shows its cards — sent status does NOT override confirmed
      cards = dashboardData.cards.filter(c =>
        c.column === 'confirmed' && (activeFilter === 'all' || c.business === activeFilter)
      );
    } else {
      const sentIds = getSentCardIds();
      cards = dashboardData.cards.filter(c =>
        c.column === col && !sentIds.includes(c.id) && (activeFilter === 'all' || c.business === activeFilter)
      );
    }
    // Sort: newest cards first by updatedAt date
    cards.sort((a, b) => {
      const aDate = a.updatedAt || '2020-01-01';
      const bDate = b.updatedAt || '2020-01-01';
      return bDate.localeCompare(aDate);
    });
    container.innerHTML = cards.map(card => createCardHTML(card)).join('');
    const countEl = document.getElementById(`count-${col}`);
    if (countEl) countEl.textContent = cards.length;
  });
}

// Single card HTML
function createCardHTML(card) {
  const biz = BIZ_COLORS[card.business] || BIZ_COLORS.brand;
  const icon = TYPE_ICONS[card.type] || '📌';
  const isDeadlineSoon = card.deadline && isWithinDays(card.deadline, 7);
  const deadlineClass = isDeadlineSoon ? 'deadline-soon border-2' : 'border';

  let deadlineHTML = '';
  if (card.deadline) {
    const d = new Date(card.deadline + 'T00:00:00');
    const daysLeft = getDaysUntil(card.deadline);
    const urgency = daysLeft <= 3 ? 'text-rose-600 font-semibold' : daysLeft <= 7 ? 'text-amber-500' : 'text-stone-400';
    deadlineHTML = `
      <div class="flex items-center gap-1 ${urgency} text-xs mt-2">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        ${daysLeft === 0 ? 'Today!' : daysLeft === 1 ? 'Tomorrow' : daysLeft < 0 ? Math.abs(daysLeft) + 'd ago' : daysLeft + ' days left'}
        <span class="text-stone-300 ml-1">${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>`;
  }

  let valueHTML = '';
  if (card.value) {
    valueHTML = `<span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">${card.value}</span>`;
  }

  let contactHTML = '';
  if (card.contact) {
    contactHTML = `<p class="text-xs text-stone-400 mt-1">Contact: ${card.contact}</p>`;
  }

  const isSent = getSentStatus(card.id);

  const composeUrl = card.contactEmail
    ? `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(card.contactEmail)}&su=${encodeURIComponent(card.composeSubject || 'Re: ' + card.title)}`
    : card.contact
      ? `https://mail.google.com/mail/u/0/?view=cm&fs=1&su=${encodeURIComponent('Re: ' + card.title)}&body=${encodeURIComponent('Hi ' + card.contact.split(' ')[0] + ',\n\n')}`
      : null;

  // Draft follow-up link (pre-written draft ready to send)
  const draftBtn = card.draftLink ? (isSent ? `
    <span class="flex items-center gap-1.5 text-xs font-medium text-stone-400 bg-stone-50 px-3 py-1.5 rounded-lg">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      Already sent
    </span>` : `
    <a href="${card.draftLink}" target="_blank" rel="noopener"
       class="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
       onclick="event.stopPropagation()">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
      ${card.draftLabel || 'Send follow-up'}
    </a>`) : '';

  // Compose URL fallback for cards without any link
  const composeBtn = composeUrl ? `
    <a href="${composeUrl}" target="_blank" rel="noopener"
       class="flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
       onclick="event.stopPropagation()">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
      Compose
    </a>` : '';

  const sentBtn = `
    <button class="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
            onclick="event.stopPropagation(); markAsSent('${card.id}')">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      Sent
    </button>`;

  let linkHTML = '';
  if (isSent) {
    linkHTML = `
      <div class="flex items-center gap-2 mt-3 flex-wrap">
        <span class="flex items-center gap-1 text-xs font-medium text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Sent ${getSentDate(card.id)}
        </span>
        ${card.link ? `<a href="${card.link}" target="_blank" rel="noopener" class="text-[10px] text-sky-500 hover:text-sky-700 underline" onclick="event.stopPropagation()">view</a>` : ''}
        ${draftBtn}
        <button class="text-[10px] text-stone-400 hover:text-stone-600 underline"
                onclick="event.stopPropagation(); unmarkSent('${card.id}')">undo</button>
      </div>`;
  } else {
    // Always show all available action buttons
    const gmailBtn = card.link ? `
      <a href="${card.link}" target="_blank" rel="noopener"
         class="flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors"
         onclick="event.stopPropagation()">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        ${card.linkLabel || 'Open in Gmail'}
      </a>` : '';

    const buttons = [gmailBtn, draftBtn, !card.link && !card.draftLink ? composeBtn : '', sentBtn].filter(b => b.trim()).join('\n');
    linkHTML = buttons ? `<div class="flex items-center gap-2 mt-3 flex-wrap">${buttons}</div>` : '';
  }

  const sentOpacity = isSent ? 'opacity-75' : '';
  const clickAttr = card.link && !isSent ? `onclick="window.open('${card.link}', '_blank')"` : '';

  return `
    <div class="card bg-white rounded-2xl ${deadlineClass} border-stone-200 p-4 ${card.link && !isSent ? 'cursor-pointer' : ''} ${sentOpacity}" style="box-shadow:0 1px 3px rgba(0,0,0,0.04);" ${clickAttr}>
      <div class="flex items-start justify-between mb-2">
        <div class="flex items-center gap-1.5">
          <span class="text-sm">${icon}</span>
          <span class="biz-dot ${biz.dot}"></span>
        </div>
        ${valueHTML}
      </div>
      <h3 class="font-semibold text-stone-700 text-sm leading-snug">${card.title}</h3>
      <p class="text-xs text-stone-400 mt-1 leading-relaxed">${card.description}</p>
      ${contactHTML}
      ${deadlineHTML}
      ${linkHTML}
      <div class="flex flex-wrap gap-1 mt-2">
        ${(card.tags || []).map(t => `<span class="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-400">${t}</span>`).join('')}
      </div>
    </div>`;
}

// Events sidebar
function renderEvents() {
  const container = document.getElementById('events-list');
  const sortedEvents = [...dashboardData.events].sort((a, b) => new Date(a.date) - new Date(b.date));

  container.innerHTML = sortedEvents.map(ev => {
    const d = new Date(ev.date + 'T00:00:00');
    const daysLeft = getDaysUntil(ev.date);
    const isPast = daysLeft < 0;
    const isToday = daysLeft === 0;
    const isSoon = daysLeft > 0 && daysLeft <= 3;

    const dotColor = isPast ? 'bg-stone-300' : isToday ? 'bg-rose-400' : isSoon ? 'bg-amber-400' : 'bg-violet-300';
    const textColor = isPast ? 'text-stone-400 line-through' : 'text-stone-600';

    return `
      <div class="flex gap-3 items-start">
        <div class="flex flex-col items-center flex-shrink-0 w-10 text-center">
          <span class="text-[10px] uppercase text-stone-400 font-medium">${d.toLocaleDateString('en-US', { month: 'short' })}</span>
          <span class="text-lg font-bold text-stone-700">${d.getDate()}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full ${dotColor} flex-shrink-0"></div>
            <p class="text-sm font-medium ${textColor} truncate">${ev.title}</p>
          </div>
          <p class="text-xs text-stone-400 ml-3.5">${ev.time}${ev.location ? ' · ' + ev.location : ''}</p>
        </div>
      </div>`;
  }).join('');
}

// Filter handling
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    columnFilter = null; // reset column filter when using biz filter
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.remove('active');
      b.style.background = '';
      b.style.color = '';
    });
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderCards();
    renderInboxView();
  });
});

// Sent tracking (persists in browser)
function getSentStatus(cardId) {
  try {
    const sent = JSON.parse(localStorage.getItem('sentCards') || '{}');
    return sent[cardId] || false;
  } catch { return false; }
}

function getSentDate(cardId) {
  try {
    const sent = JSON.parse(localStorage.getItem('sentCards') || '{}');
    if (sent[cardId]) {
      const d = new Date(sent[cardId]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return '';
  } catch { return ''; }
}

function getSentCardIds() {
  try {
    return Object.keys(JSON.parse(localStorage.getItem('sentCards') || '{}'));
  } catch { return []; }
}

function markAsSent(cardId) {
  try {
    const sent = JSON.parse(localStorage.getItem('sentCards') || '{}');
    sent[cardId] = new Date().toISOString();
    localStorage.setItem('sentCards', JSON.stringify(sent));
  } catch {}
  renderCards();
}

function unmarkSent(cardId) {
  try {
    const sent = JSON.parse(localStorage.getItem('sentCards') || '{}');
    delete sent[cardId];
    localStorage.setItem('sentCards', JSON.stringify(sent));
  } catch {}
  renderCards();
}

// Helpers
function getDaysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function isWithinDays(dateStr, days) {
  const d = getDaysUntil(dateStr);
  return d >= 0 && d <= days;
}

// ============================================
// TAB SWITCHING
// ============================================
let activeTab = 'deals';

function switchTab(tab) {
  activeTab = tab;
  const allTabs = ['deals', 'growth', 'outreach', 'revenue', 'calendar', 'rates'];
  allTabs.forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) el.style.display = t === tab ? '' : 'none';
  });
  document.querySelectorAll('.main-tab').forEach(t => {
    if (t.dataset.tab === tab) {
      t.classList.add('active');
      t.style.background = '#ede9fe';
      t.style.color = '#6d28d9';
      t.style.boxShadow = 'none';
    } else {
      t.classList.remove('active');
      t.style.background = '';
      t.style.color = '';
      t.style.boxShadow = '';
    }
  });
  if (tab === 'calendar') renderCalendar();
  if (tab === 'revenue') renderRevenue();
  if (tab === 'outreach') renderMergedOutreach();
  if (tab === 'growth') renderGrowth();
}

// ===== REVENUE TAB =====

const STATUS_BADGES = {
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Confirmed' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Pending' },
  negotiating: { bg: 'bg-sky-50', text: 'text-sky-600', label: 'Negotiating' },
  potential: { bg: 'bg-violet-50', text: 'text-violet-600', label: 'Potential' },
  outreach: { bg: 'bg-stone-100', text: 'text-stone-500', label: 'Outreach' },
  paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Paid' }
};

function filterRevenue(filter) {
  activeRevFilter = filter;
  document.querySelectorAll('.rev-filter').forEach(b => {
    if (b.dataset.filter === filter) {
      b.className = 'rev-filter text-xs px-3 py-1 rounded-full bg-violet-100 text-violet-700';
    } else {
      b.className = 'rev-filter text-xs px-3 py-1 rounded-full bg-stone-50 text-stone-400';
    }
  });
  renderRevenue();
}

function getRemovedDeals() {
  try { return JSON.parse(localStorage.getItem('removedRevenueDeals') || '[]'); }
  catch { return []; }
}

function removeRevenueDeal(dealId) {
  try {
    const removed = getRemovedDeals();
    if (!removed.includes(dealId)) {
      removed.push(dealId);
      localStorage.setItem('removedRevenueDeals', JSON.stringify(removed));
    }
  } catch {}
  renderRevenue();
}

function restoreAllDeals() {
  localStorage.setItem('removedRevenueDeals', '[]');
  renderRevenue();
}

function showRemovedDeals() {
  const removed = getRemovedDeals();
  if (removed.length === 0) return;
  const names = removed.map(id => {
    const d = revenueData.deals.find(deal => deal.id === id);
    return d ? d.brand : id;
  }).join(', ');
  if (confirm('Removed deals: ' + names + '\n\nRestore all?')) {
    restoreAllDeals();
  }
}

const DEFAULT_TAX_RATE = 30;

function getTaxRate() {
  const v = parseFloat(localStorage.getItem('taxRatePct'));
  return (isNaN(v) || v < 0 || v > 60) ? DEFAULT_TAX_RATE : v;
}

function updateTaxRate(value) {
  const n = parseFloat(value);
  if (isNaN(n) || n < 0 || n > 60) return;
  localStorage.setItem('taxRatePct', String(n));
  renderRevenue();
}

function isTaxableDeal(d) {
  return d.type !== 'Gifting' && (d.status === 'confirmed' || d.status === 'pending' || d.status === 'paid');
}

function renderRevenue() {
  if (!revenueData) return;

  const removedIds = getRemovedDeals();
  const visibleDeals = revenueData.deals.filter(d => !removedIds.includes(d.id));

  const confirmed = visibleDeals.filter(d => d.status === 'confirmed').reduce((s, d) => s + d.value, 0);
  const pending = visibleDeals.filter(d => d.status === 'pending').reduce((s, d) => s + d.value, 0);
  const gifting = visibleDeals.filter(d => d.type === 'Gifting').reduce((s, d) => s + d.value, 0);
  const pipeline = visibleDeals.reduce((s, d) => s + d.value, 0);

  const taxRate = getTaxRate();
  const taxableTotal = visibleDeals.filter(isTaxableDeal).reduce((s, d) => s + d.value, 0);
  const taxToSave = taxableTotal * (taxRate / 100);

  document.getElementById('rev-confirmed').textContent = '$' + confirmed.toLocaleString();
  document.getElementById('rev-pending').textContent = '$' + pending.toLocaleString();
  document.getElementById('rev-gifting').textContent = '$' + gifting.toLocaleString();
  document.getElementById('rev-pipeline').textContent = '$' + pipeline.toLocaleString();
  document.getElementById('rev-goal').textContent = '$' + revenueData.monthlyGoal.toLocaleString();
  document.getElementById('rev-bar-goal').textContent = '$' + revenueData.monthlyGoal.toLocaleString();
  document.getElementById('rev-tax-save').textContent = '$' + Math.round(taxToSave).toLocaleString();
  const taxRateInput = document.getElementById('rev-tax-rate');
  if (taxRateInput && document.activeElement !== taxRateInput) taxRateInput.value = taxRate;

  const pct = Math.min(100, Math.round(((confirmed + pending) / revenueData.monthlyGoal) * 100));
  document.getElementById('rev-percent').textContent = pct + '%';
  document.getElementById('rev-bar').style.width = pct + '%';

  const filtered = activeRevFilter === 'all' ? visibleDeals : visibleDeals.filter(d => d.status === activeRevFilter);
  const tbody = document.getElementById('rev-table');
  tbody.innerHTML = filtered.map(d => {
    const badge = STATUS_BADGES[d.status] || STATUS_BADGES.outreach;
    const taxable = isTaxableDeal(d);
    const dealTax = taxable ? Math.round(d.value * (taxRate / 100)) : 0;
    const taxCell = taxable
      ? `<span class="text-sm font-semibold text-rose-500">$${dealTax.toLocaleString()}${d.recurring ? '/mo' : ''}</span>`
      : `<span class="text-xs text-stone-300">—</span>`;
    return `<tr class="border-b border-stone-50 hover:bg-stone-50 transition-colors">
      <td class="px-5 py-3 text-sm font-medium text-stone-700">${d.brand}</td>
      <td class="px-5 py-3 text-xs text-stone-400">${d.type}${d.recurring ? ' <span class="text-emerald-400">recurring</span>' : ''}</td>
      <td class="px-5 py-3 text-sm font-semibold text-stone-700">$${d.value.toLocaleString()}${d.recurring ? '/mo' : ''}</td>
      <td class="px-5 py-3">${taxCell}</td>
      <td class="px-5 py-3"><span class="text-xs px-2 py-1 rounded-full ${badge.bg} ${badge.text} font-medium">${badge.label}</span></td>
      <td class="px-5 py-3 text-xs text-stone-400 max-w-xs truncate">${d.notes}</td>
      <td class="px-5 py-3"><button class="text-stone-300 hover:text-rose-400 transition-colors text-lg leading-none" onclick="removeRevenueDeal('${d.id}')" title="Remove deal">&times;</button></td>
    </tr>`;
  }).join('');

  // Show/hide removed section
  const removedSection = document.getElementById('rev-removed-section');
  if (removedSection) {
    removedSection.style.display = removedIds.length > 0 ? '' : 'none';
  }
}

// ===== MERGED OUTREACH + CONTACTS TAB =====

const PRIORITY_BADGES = {
  hot: { label: 'Hot', bg: 'bg-rose-100', text: 'text-rose-600' },
  reengage: { label: 'Re-engage', bg: 'bg-emerald-100', text: 'text-emerald-600' },
  maybe: { label: 'Maybe', bg: 'bg-amber-100', text: 'text-amber-600' },
  active: { label: 'Active', bg: 'bg-sky-100', text: 'text-sky-600' },
  sent: { label: 'Sent', bg: 'bg-violet-100', text: 'text-violet-600' },
  waiting: { label: 'Waiting', bg: 'bg-amber-100', text: 'text-amber-600' },
  idea: { label: 'Idea', bg: 'bg-stone-100', text: 'text-stone-500' },
  drafted: { label: 'Draft Ready', bg: 'bg-sky-100', text: 'text-sky-600' }
};

function filterOutreach(filter) {
  activeOutreachFilter = filter;
  document.querySelectorAll('.outreach-filter').forEach(b => {
    if (b.dataset.ofilter === filter) {
      b.className = 'outreach-filter active px-4 py-1.5 rounded-full text-sm font-medium bg-violet-100 text-violet-700';
    } else {
      b.className = 'outreach-filter px-4 py-1.5 rounded-full text-sm font-medium bg-stone-50 text-stone-400 hover:bg-stone-100';
    }
  });
  renderMergedOutreach();
}

function renderMergedOutreach() {
  if (!contactsData && !outreachData) return;

  // Build unified list from contacts + outreach active leads
  let unified = [];

  // Add contacts
  if (contactsData) {
    contactsData.forEach(c => {
      unified.push({
        brand: c.brand,
        contact: c.contact,
        email: c.email,
        status: c.status,
        priority: c.priority,
        lastContact: c.lastContact,
        notes: c.notes,
        link: c.link,
        type: c.type,
        source: 'contact'
      });
    });
  }

  // Add outreach active leads (avoid duplicates by email)
  if (outreachData && outreachData.activeOutreach) {
    outreachData.activeOutreach.forEach(a => {
      const exists = unified.find(u => u.email && u.email.toLowerCase() === (a.email || '').toLowerCase());
      if (!exists) {
        unified.push({
          brand: a.brand,
          contact: a.contact,
          email: a.email,
          status: a.status === 'sent' ? 'Sent' : a.status === 'waiting' ? 'Waiting' : a.status,
          priority: a.status === 'sent' ? 'active' : a.status === 'waiting' ? 'hot' : 'reengage',
          lastContact: a.lastAction,
          notes: a.notes,
          link: a.link,
          type: a.category,
          source: 'outreach'
        });
      }
    });
  }

  // Search filter
  const search = (document.getElementById('outreach-search')?.value || '').toLowerCase();
  if (search) {
    unified = unified.filter(u => u.brand.toLowerCase().includes(search));
  }

  // Priority filter
  if (activeOutreachFilter === 'hot') {
    unified = unified.filter(u => u.priority === 'hot');
  } else if (activeOutreachFilter === 'active') {
    unified = unified.filter(u => u.priority === 'reengage' || u.status === 'Active' || u.status === 'Sent' || u.status === 'Draft Ready');
  } else if (activeOutreachFilter === 'followup') {
    unified = unified.filter(u => u.status === 'No Reply' || u.status === 'NEVER REPLIED' || u.status === 'Waiting' || u.status === 'Stale');
  }

  // Stats
  const totalEl = document.getElementById('outreach-total');
  const hotEl = document.getElementById('outreach-hot');
  const activeEl = document.getElementById('outreach-active');
  const followEl = document.getElementById('outreach-followup');
  if (totalEl) totalEl.textContent = unified.length;
  if (hotEl) hotEl.textContent = (contactsData || []).filter(c => c.priority === 'hot').length;
  if (activeEl) activeEl.textContent = unified.filter(u => u.status === 'Active' || u.status === 'Sent' || u.status === 'Draft Ready').length;
  if (followEl) followEl.textContent = unified.filter(u => u.status === 'No Reply' || u.status === 'NEVER REPLIED' || u.status === 'Waiting').length;

  // Render cards
  const container = document.getElementById('outreach-cards');
  if (!container) return;

  container.innerHTML = unified.map(u => {
    const priorityBadge = PRIORITY_BADGES[u.priority] || PRIORITY_BADGES.maybe;
    const statusStyle = getStatusStyle(u.status);
    const composeUrl = u.email
      ? `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(u.email)}&su=${encodeURIComponent('Collaboration with Catalina Freer — @catafreer')}`
      : '#';

    // Check if brand has been contacted (in dashboard.json sent cards or localStorage)
    const alreadyContacted = isBrandAlreadyContacted(u.brand, u.email);
    // Check if link is a draft link
    const isDraftLink = u.link && u.link.includes('#drafts');

    let actionHTML = '';
    if (alreadyContacted) {
      actionHTML = `<span class="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        Already contacted
      </span>`;
      if (u.link) {
        actionHTML += `<a href="${u.link}" target="_blank" rel="noopener" class="text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors" onclick="event.stopPropagation()">View</a>`;
      }
    } else if (isDraftLink) {
      actionHTML = `<a href="${u.link}" target="_blank" rel="noopener"
         class="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
         onclick="event.stopPropagation()">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
        Open Draft
      </a>`;
    } else if (u.email) {
      actionHTML = `<a href="${composeUrl}" target="_blank" rel="noopener"
         class="flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
         onclick="event.stopPropagation()">
        Compose
      </a>`;
      if (u.link) {
        actionHTML += `<a href="${u.link}" target="_blank" rel="noopener" class="text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors" onclick="event.stopPropagation()">Open</a>`;
      }
    } else {
      actionHTML = '<span class="text-xs text-stone-300">No email yet</span>';
    }

    return `
      <div class="bg-white rounded-2xl border border-stone-200 p-4 hover:shadow-md transition-shadow" style="box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <div class="flex items-start justify-between mb-2">
          <h4 class="font-semibold text-stone-700 text-sm">${u.brand}</h4>
          <div class="flex items-center gap-1">
            ${alreadyContacted ? '<span class="text-[10px] text-emerald-500 font-medium">CONTACTED</span>' : ''}
            <span class="text-xs px-2 py-0.5 rounded-full ${priorityBadge.bg} ${priorityBadge.text} font-medium">${priorityBadge.label}</span>
          </div>
        </div>
        ${u.contact ? `<p class="text-xs text-stone-500">${u.contact}</p>` : ''}
        ${u.email ? `<p class="text-xs text-stone-400">${u.email}</p>` : ''}
        <div class="flex items-center gap-2 mt-2">
          <span class="text-xs px-2 py-0.5 rounded-full ${statusStyle} font-medium">${u.status}</span>
          ${u.lastContact ? `<span class="text-xs text-stone-300">${u.lastContact}</span>` : ''}
        </div>
        ${u.notes ? `<p class="text-xs text-stone-400 mt-2 line-clamp-2">${u.notes}</p>` : ''}
        <div class="flex items-center gap-2 mt-3">
          ${actionHTML}
        </div>
      </div>`;
  }).join('');

  // Dream brands
  renderDreamBrands();
}

// Global function to check if a brand has been contacted
function isBrandAlreadyContacted(brandName, email) {
  if (!dashboardData) return false;
  const sentIds = getSentCardIds();
  const brandLower = (brandName || '').toLowerCase();
  const emailLower = (email || '').toLowerCase();

  // Check if any card in dashboard.json matches this brand and has been marked sent via localStorage
  const matchingSentCards = dashboardData.cards.filter(c => {
    const titleLower = c.title.toLowerCase();
    return sentIds.includes(c.id) && (
      titleLower.includes(brandLower) ||
      (emailLower && c.contactEmail && c.contactEmail.toLowerCase() === emailLower)
    );
  });
  if (matchingSentCards.length > 0) return true;

  // Also check cards that have "sent" in their tags or descriptions indicating they were already sent
  const alreadySentCards = dashboardData.cards.filter(c => {
    const titleLower = c.title.toLowerCase();
    const descLower = (c.description || '').toLowerCase();
    return (titleLower.includes(brandLower) || (emailLower && c.contactEmail && c.contactEmail.toLowerCase() === emailLower)) &&
      (c.tags && c.tags.includes('sent') || descLower.includes('sent mar'));
  });
  return alreadySentCards.length > 0;
}

function getStatusStyle(status) {
  const map = {
    'Active': 'bg-emerald-50 text-emerald-600',
    'Draft Ready': 'bg-sky-50 text-sky-600',
    'Replied': 'bg-sky-50 text-sky-500',
    'No Reply': 'bg-amber-50 text-amber-600',
    'Stale': 'bg-amber-50 text-amber-500',
    'NEVER REPLIED': 'bg-rose-50 text-rose-600',
    'Declined': 'bg-stone-100 text-stone-400',
    'Sent': 'bg-violet-50 text-violet-600',
    'Waiting': 'bg-amber-50 text-amber-600',
    'sent': 'bg-violet-50 text-violet-600',
    'waiting': 'bg-amber-50 text-amber-600'
  };
  return map[status] || 'bg-stone-100 text-stone-500';
}

function renderDreamBrands() {
  if (!outreachData || !outreachData.dreamBrands) return;
  const container = document.getElementById('dream-brand-cards');
  if (!container) return;

  container.innerHTML = outreachData.dreamBrands.map(d => {
    const statusBadge = PRIORITY_BADGES[d.status] || PRIORITY_BADGES.idea;
    const composeUrl = d.email
      ? `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(d.email)}&su=${encodeURIComponent('Collaboration Inquiry — Catalina Freer (@catafreer)')}`
      : '#';
    const alreadyContacted = isBrandAlreadyContacted(d.brand, d.email);

    let actionHTML = '';
    if (alreadyContacted) {
      actionHTML = `<span class="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        Already contacted
      </span>`;
    } else if (d.email) {
      actionHTML = `<a href="${composeUrl}" target="_blank" rel="noopener" class="flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors">Compose</a>`;
    } else {
      actionHTML = '<span class="text-xs text-stone-300">No email yet</span>';
    }

    return `
      <div class="bg-white rounded-2xl border border-stone-200 p-4 hover:shadow-md transition-shadow" style="box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <div class="flex items-start justify-between mb-2">
          <h4 class="font-semibold text-stone-700 text-sm">${d.brand}</h4>
          <div class="flex items-center gap-1">
            ${alreadyContacted ? '<span class="text-[10px] text-emerald-500 font-medium">CONTACTED</span>' : ''}
            <span class="text-xs px-2 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text} font-medium">${statusBadge.label}</span>
          </div>
        </div>
        <p class="text-xs text-stone-400 capitalize">${d.category}</p>
        ${d.notes ? `<p class="text-xs text-stone-400 mt-1">${d.notes}</p>` : ''}
        <div class="flex items-center gap-2 mt-3">
          ${actionHTML}
        </div>
      </div>`;
  }).join('');
}

// ===== CALENDAR TAB =====

const CAT_COLORS = {
  event: { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-400', label: 'Event' },
  content: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400', label: 'Content' },
  deadline: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-400', label: 'Deadline' },
  milestone: { bg: 'bg-sky-50', text: 'text-sky-600', dot: 'bg-sky-400', label: 'Milestone' },
  work: { bg: 'bg-sky-50', text: 'text-sky-500', dot: 'bg-sky-300', label: 'Work' },
  bill: { bg: 'bg-stone-100', text: 'text-stone-500', dot: 'bg-stone-300', label: 'Bill' },
  followup: { bg: 'bg-rose-50', text: 'text-rose-500', dot: 'bg-rose-300', label: 'Follow Up' }
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function calPrevMonth() { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); }
function calNextMonth() { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); }
function calToday() { const d = new Date(); calYear = d.getFullYear(); calMonth = d.getMonth(); renderCalendar(); }

function getEventsForDate(dateStr) {
  if (!calendarData) return [];
  return calendarData.events.filter(e => e.date === dateStr);
}

function renderCalendar() {
  if (!calendarData) return;

  document.getElementById('cal-month-title').textContent = `${MONTHS[calMonth]} ${calYear}`;

  const grid = document.getElementById('cal-grid');
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  let html = '';

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="min-h-[100px] border-b border-r border-stone-100 bg-stone-50/50 p-1"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const events = getEventsForDate(dateStr);
    const isToday = dateStr === todayStr;

    html += `<div class="min-h-[100px] border-b border-r border-stone-100 p-1.5 cursor-pointer hover:bg-violet-50/50 transition-colors ${isToday ? 'bg-violet-50/30' : ''}" onclick="showDayDetail('${dateStr}')">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-medium ${isToday ? 'bg-violet-400 text-white w-7 h-7 rounded-full flex items-center justify-center' : 'text-stone-600'}">${d}</span>
        ${events.length > 0 ? `<span class="text-[10px] text-stone-400">${events.length}</span>` : ''}
      </div>
      <div class="space-y-0.5">
        ${events.slice(0, 3).map(e => {
          const cat = CAT_COLORS[e.category] || CAT_COLORS.event;
          return `<div class="text-[10px] px-1.5 py-0.5 rounded ${cat.bg} ${cat.text} truncate font-medium">${e.title}</div>`;
        }).join('')}
        ${events.length > 3 ? `<div class="text-[10px] text-stone-400 px-1">+${events.length - 3} more</div>` : ''}
      </div>
    </div>`;
  }

  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 0; i < remaining; i++) {
    html += '<div class="min-h-[100px] border-b border-r border-stone-100 bg-stone-50/50 p-1"></div>';
  }

  grid.innerHTML = html;
  renderUpcoming();
}

function showDayDetail(dateStr) {
  const events = getEventsForDate(dateStr);
  const detail = document.getElementById('cal-day-detail');
  const d = new Date(dateStr + 'T12:00:00');
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (events.length === 0) {
    detail.innerHTML = `<p class="font-medium text-stone-600 mb-2">${dayName}</p><p class="text-stone-400 text-sm">Nothing scheduled</p>`;
    return;
  }

  detail.innerHTML = `
    <p class="font-medium text-stone-600 mb-3">${dayName}</p>
    <div class="space-y-3">
      ${events.map(e => {
        const cat = CAT_COLORS[e.category] || CAT_COLORS.event;
        return `<div class="p-3 rounded-xl border border-stone-100 hover:shadow-sm transition-shadow">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full ${cat.dot}"></span>
            <span class="font-semibold text-stone-700 text-sm">${e.title}</span>
          </div>
          ${e.time ? `<p class="text-xs text-stone-400 ml-4">${e.time}</p>` : ''}
          ${e.location ? `<p class="text-xs text-stone-400 ml-4">${e.location}</p>` : ''}
          ${e.notes ? `<p class="text-xs text-stone-300 ml-4 mt-1">${e.notes}</p>` : ''}
        </div>`;
      }).join('')}
    </div>`;
}

function renderUpcoming() {
  if (!calendarData) return;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const upcoming = calendarData.events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const container = document.getElementById('cal-upcoming');
  container.innerHTML = upcoming.map(e => {
    const cat = CAT_COLORS[e.category] || CAT_COLORS.event;
    const d = new Date(e.date + 'T12:00:00');
    const daysDiff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    const urgency = daysDiff <= 1 ? 'text-rose-500 font-bold' : daysDiff <= 3 ? 'text-amber-500 font-semibold' : 'text-stone-400';
    const daysLabel = daysDiff === 0 ? 'TODAY' : daysDiff === 1 ? 'Tomorrow' : `${daysDiff} days`;

    return `<div class="flex items-start gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors">
      <div class="flex-shrink-0 text-center min-w-[44px]">
        <div class="text-xs text-stone-400 uppercase">${d.toLocaleDateString('en-US', {month:'short'})}</div>
        <div class="text-lg font-bold text-stone-700">${d.getDate()}</div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full ${cat.dot} flex-shrink-0"></span>
          <p class="text-sm font-medium text-stone-700 truncate">${e.title}</p>
        </div>
        ${e.time && e.time !== 'All Day' ? `<p class="text-xs text-stone-400 ml-3.5">${e.time}</p>` : ''}
        ${e.location ? `<p class="text-xs text-stone-400 ml-3.5">${e.location}</p>` : ''}
      </div>
      <span class="text-[10px] ${urgency} whitespace-nowrap">${daysLabel}</span>
    </div>`;
  }).join('');
}

// ============================================
// GROWTH TAB
// ============================================
let growthRelevanceFilter = 'all';
let growthWeekFilter = 0;
let growthRendered = false;
let contentCalMonth = 2; // March (0-indexed)
let contentCalYear = 2026;

function renderGrowth() {
  if (!growthData) return;
  if (growthRendered) return;
  growthRendered = true;
  renderCompetitors();
  renderContentCalendarMonth();
  renderScripts();
  renderStrategy();
  renderPitches();
  renderWatchlist();
}

function switchGrowthSub(sub) {
  const subs = ['calendar','competitors','watchlist','strategy','pitches','scripts'];
  subs.forEach(s => {
    const el = document.getElementById('growth-' + s);
    if (el) el.style.display = s === sub ? '' : 'none';
  });
  const labelMap = {
    'calendar': 'content',
    'competitors': 'comp',
    'watchlist': 'crea',
    'strategy': 'post',
    'pitches': 'pitc'
  };
  document.querySelectorAll('.growth-sub').forEach(btn => {
    const btnText = btn.textContent.toLowerCase();
    const matchKey = labelMap[sub] || sub.substring(0,4);
    if (btnText.includes(matchKey)) {
      btn.classList.add('active');
      btn.style.background = '#ede9fe';
      btn.style.color = '#6d28d9';
    } else {
      btn.classList.remove('active');
      btn.style.background = '';
      btn.style.color = '';
    }
  });
  // Render the content calendar when switching to it
  if (sub === 'calendar') renderContentCalendarMonth();
}

function filterRelevance(level) {
  growthRelevanceFilter = level;
  document.querySelectorAll('.relevance-filter').forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = '';
    btn.style.color = '';
  });
  event.target.classList.add('active');
  event.target.style.background = '#ede9fe';
  event.target.style.color = '#6d28d9';
  renderCompetitors();
}

function renderCompetitors() {
  if (!growthData) return;
  const tbody = document.getElementById('competitors-body');
  const filtered = growthRelevanceFilter === 'all' ? growthData.influencers : growthData.influencers.filter(i => i.relevance === growthRelevanceFilter);
  const relevanceBadge = r => {
    if (r === 'HIGH') return '<span class="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-xs font-medium">HIGH</span>';
    if (r === 'MEDIUM') return '<span class="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-xs font-medium">MED</span>';
    return '<span class="px-2 py-0.5 bg-stone-50 text-stone-400 rounded-full text-xs font-medium">LOW</span>';
  };
  tbody.innerHTML = filtered.map((inf, i) => `
    <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'} hover:bg-violet-50/30 transition-colors">
      <td class="px-4 py-3 font-semibold text-violet-500 whitespace-nowrap">${inf.handle}</td>
      <td class="px-4 py-3 text-stone-600 whitespace-nowrap">${inf.igFollowers}</td>
      <td class="px-4 py-3 text-stone-600 whitespace-nowrap">${inf.ttFollowers}</td>
      <td class="px-4 py-3 text-stone-600 whitespace-nowrap">${inf.engagement}</td>
      <td class="px-4 py-3 text-stone-600 font-semibold">${inf.brandDeals}</td>
      <td class="px-4 py-3 text-stone-500 text-xs">${inf.niche}</td>
      <td class="px-4 py-3 text-stone-500 text-xs max-w-[200px]">${inf.differentiator}</td>
      <td class="px-4 py-3 text-stone-500 text-xs max-w-[200px]">${inf.learnFrom}</td>
      <td class="px-4 py-3">${relevanceBadge(inf.relevance)}</td>
    </tr>`).join('');
}

// Content Calendar Month Navigation
function contentCalPrev() { contentCalMonth--; if (contentCalMonth < 0) { contentCalMonth = 11; contentCalYear--; } renderContentCalendarMonth(); }
function contentCalNext() { contentCalMonth++; if (contentCalMonth > 11) { contentCalMonth = 0; contentCalYear++; } renderContentCalendarMonth(); }

// Parse content calendar dates like "Mar 24 Mon" into {month, day} for 2026
function parseContentDate(dateStr) {
  const monthMap = { 'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11 };
  const parts = dateStr.split(' ');
  if (parts.length < 2) return null;
  const month = monthMap[parts[0]];
  const day = parseInt(parts[1]);
  if (month === undefined || isNaN(day)) return null;
  return { year: 2026, month, day };
}

function getContentForDate(year, month, day) {
  if (!growthData || !growthData.contentCalendar) return [];
  return growthData.contentCalendar.filter(c => {
    const parsed = parseContentDate(c.date);
    if (!parsed) return false;
    return parsed.year === year && parsed.month === month && parsed.day === day;
  });
}

function getScriptForContent(contentItem) {
  if (!growthData || !growthData.comedyScripts) return null;
  // Try to match by hook text
  return growthData.comedyScripts.find(s =>
    contentItem.hook && s.hook && contentItem.hook.toLowerCase().includes(s.hook.substring(0, 30).toLowerCase())
  ) || null;
}

function platformIcon(p) {
  if (p === 'Both' || (p.includes('TikTok') && p.includes('IG'))) return '<span class="inline-block w-4 text-center" title="IG + TikTok">&#x1F4F1;</span>';
  if (p.includes('TikTok')) return '<span class="inline-block w-4 text-center" title="TikTok">&#x266A;</span>';
  if (p.includes('Stories')) return '<span class="inline-block w-4 text-center" title="IG Stories">&#x25CE;</span>';
  return '<span class="inline-block w-4 text-center" title="IG">&#x1F4F7;</span>';
}

function platformBadgeHTML(p) {
  if (p === 'Both') return '<span class="px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full text-xs font-medium">IG + TikTok</span>';
  if (p === 'TikTok') return '<span class="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full text-xs font-medium">TikTok</span>';
  if (p === 'IG Reel') return '<span class="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-xs font-medium">IG Reel</span>';
  if (p === 'IG Stories') return '<span class="px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full text-xs font-medium">Stories</span>';
  return `<span class="px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full text-xs font-medium">${p}</span>`;
}

function contentCellColor(p) {
  if (!p) return 'bg-stone-50';
  if (p === 'Both' || (p.includes('TikTok') && p.includes('IG'))) return 'bg-violet-50';
  if (p.includes('TikTok')) return 'bg-stone-50';
  if (p.includes('Stories')) return 'bg-rose-50/50';
  return 'bg-rose-50';
}

function renderContentCalendarMonth() {
  if (!growthData) return;

  const titleEl = document.getElementById('content-cal-title');
  if (titleEl) titleEl.textContent = `${MONTHS[contentCalMonth]} ${contentCalYear}`;

  const grid = document.getElementById('content-cal-grid');
  if (!grid) return;

  const firstDay = new Date(contentCalYear, contentCalMonth, 1).getDay();
  const daysInMonth = new Date(contentCalYear, contentCalMonth + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  let html = '';

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="min-h-[90px] border-b border-r border-stone-100 bg-stone-50/50 p-1"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${contentCalYear}-${String(contentCalMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const content = getContentForDate(contentCalYear, contentCalMonth, d);
    const isToday = dateStr === todayStr;
    const hasContent = content.length > 0;

    html += `<div class="min-h-[90px] border-b border-r border-stone-100 p-1.5 cursor-pointer hover:bg-violet-50/50 transition-colors ${isToday ? 'bg-violet-50/30' : ''}" onclick="showContentDayDetail(${contentCalYear}, ${contentCalMonth}, ${d})">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-medium ${isToday ? 'bg-violet-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs' : 'text-stone-600'}">${d}</span>
      </div>
      <div class="space-y-0.5">
        ${content.slice(0, 2).map(c => `
          <div class="text-[10px] px-1 py-0.5 rounded ${contentCellColor(c.platform)} truncate font-medium flex items-center gap-1">
            ${platformIcon(c.platform)}
            <span class="truncate">${c.type}</span>
          </div>
        `).join('')}
        ${content.length > 2 ? `<div class="text-[10px] text-stone-400 px-1">+${content.length - 2} more</div>` : ''}
      </div>
    </div>`;
  }

  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 0; i < remaining; i++) {
    html += '<div class="min-h-[90px] border-b border-r border-stone-100 bg-stone-50/50 p-1"></div>';
  }

  grid.innerHTML = html;

  // Hide detail on month change
  const detail = document.getElementById('content-day-detail');
  if (detail) detail.classList.add('hidden');
}

function showContentDayDetail(year, month, day) {
  const content = getContentForDate(year, month, day);
  const detail = document.getElementById('content-day-detail');
  if (!detail) return;

  const d = new Date(year, month, day);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (content.length === 0) {
    detail.classList.remove('hidden');
    detail.innerHTML = `<p class="font-medium text-stone-600 mb-2">${dayName}</p><p class="text-stone-400 text-sm">No content scheduled</p>`;
    return;
  }

  detail.classList.remove('hidden');
  detail.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <p class="font-bold text-stone-800 text-lg">${dayName}</p>
      <button onclick="document.getElementById('content-day-detail').classList.add('hidden')" class="text-stone-400 hover:text-stone-600 text-lg">&times;</button>
    </div>
    <div class="space-y-4">
      ${content.map(c => {
        const script = getScriptForContent(c);
        return `
        <div class="border border-stone-100 rounded-xl p-4">
          <div class="flex items-center gap-2 flex-wrap mb-3">
            ${platformBadgeHTML(c.platform)}
            <span class="px-2 py-0.5 bg-sky-50 text-sky-600 rounded-full text-xs font-medium">${c.type}</span>
            <span class="text-xs text-stone-400 ml-auto">${c.time}</span>
          </div>
          <p class="text-sm font-medium text-stone-700 mb-2">${c.idea}</p>
          ${c.hook && c.hook !== 'N/A (Stories)' ? `
          <div class="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
            <p class="text-xs font-semibold text-amber-700">HOOK:</p>
            <p class="text-sm text-amber-600 italic">"${c.hook}"</p>
          </div>` : ''}
          ${script ? `
          <div class="bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 mb-3">
            <p class="text-xs font-semibold text-violet-700 mb-1">FULL SCRIPT (${script.format}):</p>
            <p class="text-sm text-violet-600">${script.script}</p>
            <div class="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
              <span><strong>Visual:</strong> ${script.visual}</span>
            </div>
            <div class="mt-1 text-xs text-stone-400"><strong>Audio:</strong> ${script.audio}</div>
          </div>` : ''}
          ${c.notes ? `<p class="text-xs text-stone-500"><strong>Notes:</strong> ${c.notes}</p>` : ''}
        </div>`;
      }).join('')}
    </div>`;
}

function renderScripts() {
  if (!growthData) return;
  const grid = document.getElementById('scripts-grid');
  const catColors = {
    'Latina Life': {bg:'bg-rose-50',border:'border-rose-200',text:'text-rose-600'},
    'Industry Humor': {bg:'bg-amber-50',border:'border-amber-200',text:'text-amber-600'},
    'Model Life': {bg:'bg-pink-50',border:'border-pink-200',text:'text-pink-600'},
    'Brand Deals': {bg:'bg-emerald-50',border:'border-emerald-200',text:'text-emerald-600'},
    'Bilingual': {bg:'bg-sky-50',border:'border-sky-200',text:'text-sky-600'},
    'NYC Life': {bg:'bg-violet-50',border:'border-violet-200',text:'text-violet-600'},
    'Entrepreneur Life': {bg:'bg-indigo-50',border:'border-indigo-200',text:'text-indigo-600'}
  };
  grid.innerHTML = growthData.comedyScripts.map(s => {
    const cc = catColors[s.category] || {bg:'bg-stone-50',border:'border-stone-200',text:'text-stone-600'};
    return `
    <div class="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition-shadow" style="box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-xs font-bold text-stone-400">#${s.id}</span>
        <span class="px-2 py-0.5 ${cc.bg} ${cc.text} border ${cc.border} rounded-full text-xs font-medium">${s.category}</span>
        <span class="px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full text-xs">${s.format}</span>
        <span class="px-2 py-0.5 bg-stone-50 text-stone-400 rounded-full text-xs">${s.platform}</span>
      </div>
      <div class="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
        <p class="text-xs font-semibold text-amber-700">HOOK:</p>
        <p class="text-sm text-amber-600 italic font-medium">"${s.hook}"</p>
      </div>
      <p class="text-sm text-stone-600 mb-3">${s.script}</p>
      <div class="flex gap-2 text-xs text-stone-400">
        <span>${s.visual.substring(0, 60)}...</span>
      </div>
      <div class="mt-2 text-xs text-stone-400">${s.audio}</div>
    </div>`;
  }).join('');
}

function renderStrategy() {
  if (!growthData) return;
  const ps = growthData.postingStrategy;
  document.getElementById('strategy-ig-times').innerHTML = `
    <p><strong>Peak:</strong> ${ps.bestTimes.instagram.peak}</p>
    <p><strong>Secondary:</strong> ${ps.bestTimes.instagram.secondary}</p>
    <p><strong>Best Days:</strong> ${ps.bestTimes.instagram.bestDays}</p>
    <p><strong>Frequency:</strong> ${ps.bestTimes.instagram.frequency}</p>`;
  document.getElementById('strategy-tt-times').innerHTML = `
    <p><strong>Peak:</strong> ${ps.bestTimes.tiktok.peak}</p>
    <p><strong>Secondary:</strong> ${ps.bestTimes.tiktok.secondary}</p>
    <p><strong>YOUR Peak:</strong> ${ps.bestTimes.tiktok.bestDay}</p>
    <p><strong>Frequency:</strong> ${ps.bestTimes.tiktok.frequency}</p>`;
  document.getElementById('strategy-algorithm').innerHTML = ps.algorithmCheatSheet.map((a, i) => `
    <div class="flex items-start gap-3 p-3 ${i === 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-stone-50'} rounded-lg">
      <span class="text-lg font-bold text-stone-400">#${i+1}</span>
      <div>
        <p class="font-semibold text-stone-800">${a.signal} <span class="text-xs font-normal text-stone-400">${a.weight}</span></p>
        <p class="text-xs text-stone-500">${a.action}</p>
      </div>
    </div>`).join('');
  document.getElementById('strategy-pillars').innerHTML = ps.contentPillars.map(p => `
    <div class="flex items-center gap-3">
      <div class="w-12 text-right"><span class="text-lg font-bold text-stone-800">${p.percentage}%</span></div>
      <div class="flex-1">
        <div class="h-3 bg-stone-100 rounded-full overflow-hidden">
          <div class="h-full rounded-full ${p.pillar === 'Comedy' ? 'bg-rose-300' : p.pillar === 'Fashion/Beauty' ? 'bg-pink-300' : p.pillar === 'Model BTS' ? 'bg-violet-300' : p.pillar === 'Entrepreneur/Nuvana' ? 'bg-sky-300' : 'bg-emerald-300'}" style="width:${p.percentage}%"></div>
        </div>
        <p class="text-xs text-stone-600 font-medium mt-1">${p.pillar}</p>
        <p class="text-xs text-stone-400">${p.description}</p>
      </div>
    </div>`).join('');
  document.getElementById('strategy-checklist').innerHTML = ps.engagementChecklist.map(c => `
    <label class="flex items-start gap-2 cursor-pointer">
      <input type="checkbox" class="mt-0.5 rounded border-stone-300 text-violet-500 focus:ring-violet-300">
      <span class="text-sm text-stone-600">${c}</span>
    </label>`).join('');
  document.getElementById('strategy-hooks').innerHTML = ps.hookFormulas.map(h => `
    <div class="bg-stone-50 rounded-lg p-4">
      <p class="font-semibold text-stone-800 mb-1">${h.formula}</p>
      <p class="text-sm text-violet-600 italic mb-2">"${h.example}"</p>
      <p class="text-xs text-stone-400">${h.why}</p>
    </div>`).join('');
}

function renderPitches() {
  if (!growthData) return;
  const list = document.getElementById('pitches-list');
  list.innerHTML = growthData.pitchTemplates.map((p, i) => `
    <div class="bg-white rounded-2xl border border-stone-200 overflow-hidden" style="box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <button class="w-full flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors" onclick="togglePitch(${i})">
        <div class="flex items-center gap-3">
          <span class="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm">${i+1}</span>
          <div class="text-left">
            <p class="font-semibold text-stone-800">${p.name}</p>
            <p class="text-xs text-stone-400">${p.useCase}</p>
          </div>
        </div>
        <svg class="w-5 h-5 text-stone-400 transition-transform pitch-arrow-${i}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      <div id="pitch-body-${i}" class="hidden px-6 pb-5">
        <div class="bg-sky-50 border border-sky-100 rounded-lg px-4 py-2 mb-3">
          <p class="text-xs font-semibold text-sky-700">Subject Line:</p>
          <p class="text-sm text-sky-600 font-medium">${p.subject}</p>
        </div>
        <div class="bg-stone-50 rounded-lg px-4 py-3 mb-3">
          <pre class="text-sm text-stone-600 whitespace-pre-wrap font-sans">${p.body}</pre>
        </div>
        <div class="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2">
          <p class="text-xs font-semibold text-amber-700">Key Angles:</p>
          <p class="text-xs text-amber-600">${p.angles}</p>
        </div>
        <button class="mt-3 px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600 transition-colors" onclick="copyPitch(${i})">Copy Email Text</button>
      </div>
    </div>`).join('');
}

function togglePitch(i) {
  const body = document.getElementById('pitch-body-' + i);
  body.classList.toggle('hidden');
}

function copyPitch(i) {
  const p = growthData.pitchTemplates[i];
  const text = `Subject: ${p.subject}\n\n${p.body}`;
  navigator.clipboard.writeText(text).then(() => {
    event.target.textContent = 'Copied!';
    setTimeout(() => { event.target.textContent = 'Copy Email Text'; }, 2000);
  });
}

function renderWatchlist() {
  if (!growthData) return;
  const grid = document.getElementById('watchlist-grid');
  const colors = ['from-rose-300 to-pink-300','from-sky-300 to-violet-300','from-pink-300 to-rose-300','from-amber-300 to-rose-300','from-emerald-300 to-teal-300','from-violet-300 to-sky-300','from-violet-300 to-indigo-300','from-amber-300 to-orange-300','from-teal-300 to-emerald-300','from-rose-300 to-pink-300'];
  grid.innerHTML = growthData.topCreatorsToWatch.map((c, i) => `
    <div class="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition-shadow" style="box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br ${colors[i]} flex items-center justify-center text-white font-bold text-xs">${i+1}</div>
        <div>
          <p class="font-bold text-violet-500">${c.handle}</p>
          <p class="text-xs text-stone-400">Check: ${c.frequency}</p>
        </div>
      </div>
      ${c.postingPace ? `
      <div class="bg-sky-50 border border-sky-100 rounded-lg px-3 py-1.5 mb-3 flex items-center gap-2">
        <span class="text-xs font-semibold text-sky-700">Posting Pace:</span>
        <span class="text-xs text-sky-600">${c.postingPace}</span>
      </div>` : ''}
      <p class="text-sm text-stone-600 mb-2"><strong>Why:</strong> ${c.why}</p>
      <p class="text-sm text-stone-500 mb-2"><strong>Study:</strong> ${c.study}</p>
      <div class="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
        <p class="text-xs font-semibold text-emerald-700">STEAL THIS:</p>
        <p class="text-xs text-emerald-600">${c.steal}</p>
      </div>
    </div>`).join('');
}

// Initialize main tab styling
switchTab('deals');

// Boot
loadData();
