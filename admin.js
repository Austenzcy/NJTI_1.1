(() => {
  const DATA = window.NJTI_DATA;
  const $ = (id) => document.getElementById(id);
  const els = {
    adminToken: $('adminToken'),
    loadStatsBtn: $('loadStatsBtn'),
    adminMsg: $('adminMsg'),
    totalCount: $('totalCount'),
    languageStats: $('languageStats'),
    personalityStats: $('personalityStats'),
    dimensionStats: $('dimensionStats'),
    recentStats: $('recentStats')
  };

  const dimMap = Object.fromEntries(DATA.dimensions.map(d => [d.id, d]));

  function zh(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj.zh || obj.en || '';
  }

  function bar(label, count, percent) {
    const item = document.createElement('div');
    item.className = 'admin-bar-row';
    item.innerHTML = `
      <div class="admin-bar-label"><span>${label}</span><strong>${count} · ${percent}%</strong></div>
      <div class="admin-bar"><span style="width:${Math.min(100, percent)}%"></span></div>
    `;
    return item;
  }

  function renderList(container, items, labelKey) {
    container.innerHTML = '';
    if (!items.length) {
      container.textContent = '暂无数据';
      return;
    }
    items.forEach(item => container.appendChild(bar(item[labelKey], item.count, item.percent)));
  }

  function renderDimensions(items) {
    els.dimensionStats.innerHTML = '';
    if (!items.length) {
      els.dimensionStats.textContent = '暂无数据';
      return;
    }
    items.forEach(item => {
      const dim = dimMap[item.dim];
      const leftLabel = dim ? zh(dim.left) : item.dim;
      const rightLabel = dim ? zh(dim.right) : '';
      const row = document.createElement('div');
      row.className = 'metric-row';
      row.innerHTML = `
        <div class="metric-label left"><span>${leftLabel}</span><span class="percent">${item.leftPct}%</span></div>
        <div class="metric-bar"><span class="metric-fill-left" style="width:${item.leftPct}%"></span><span class="metric-fill-right" style="width:${item.rightPct}%"></span><span class="metric-center"></span></div>
        <div class="metric-label right"><span>${rightLabel}</span><span class="percent">${item.rightPct}%</span></div>
      `;
      els.dimensionStats.appendChild(row);
    });
  }

  function renderRecent(items) {
    els.recentStats.innerHTML = '';
    if (!items.length) {
      els.recentStats.textContent = '暂无数据';
      return;
    }
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>时间</th><th>人格</th><th>语言</th><th>分享ID</th></tr></thead><tbody></tbody>';
    const tbody = table.querySelector('tbody');
    items.forEach(item => {
      const tr = document.createElement('tr');
      const time = item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '';
      tr.innerHTML = `<td>${time}</td><td>${item.personality_name || ''}</td><td>${item.language || ''}</td><td>${item.share_id || ''}</td>`;
      tbody.appendChild(tr);
    });
    els.recentStats.appendChild(table);
  }

  async function loadStats() {
    const token = els.adminToken.value.trim();
    localStorage.setItem('njti_admin_token', token);
    els.adminMsg.textContent = '正在加载统计数据……';
    try {
      const url = token ? `/api/stats?token=${encodeURIComponent(token)}` : '/api/stats';
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '加载失败');
      els.totalCount.textContent = data.total || 0;
      renderList(els.languageStats, data.languageDistribution || [], 'language');
      renderList(els.personalityStats, data.personalityDistribution || [], 'name');
      renderDimensions(data.dimensionAverages || []);
      renderRecent(data.recent || []);
      els.adminMsg.textContent = '统计数据已更新。';
    } catch (err) {
      console.error(err);
      els.adminMsg.textContent = `加载失败：${err.message}`;
    }
  }

  function init() {
    els.adminToken.value = localStorage.getItem('njti_admin_token') || '';
    els.loadStatsBtn.addEventListener('click', loadStats);
    loadStats();
  }
  init();
})();
