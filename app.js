/**
 * CivicPulse - Municipal Complaint Prioritization & Dispatch System
 * Enterprise Civic Operations Frontend Controller
 */

// API Configuration with dynamic endpoint fallback
let API_BASE = '/api';
let isBackendOnline = false;
let currentComplaints = [];
let allDepartments = [];
let allOfficers = [];
let activeFilterHazard = false;
const votedTicketIds = new Set();

// Fallback seed data in case backend is offline
let mockComplaints = [
  {
    complaintId: 1,
    title: "Major Water Pipeline Burst Flooding Main Road",
    description: "Sub-surface 600mm water pipe ruptured, flooding major intersection and threatening local water supply contamination.",
    departmentId: 2,
    departmentName: "Water Supply & Sewerage",
    zoneId: "ZONE-NORTH",
    latitude: 12.9716,
    longitude: 77.5946,
    severityLevel: 5,
    affectedCount: 45,
    priorityScore: 68.6,
    isCriticalHazard: true,
    status: "IN_PROGRESS",
    assignedOfficerId: 4,
    assignedOfficerName: "Officer Vikram Singh",
    ageInHours: 13.0,
    createdAt: new Date(Date.now() - 13 * 3600000).toISOString(),
    photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb1861593"
  },
  {
    complaintId: 5,
    title: "Fallen Live High-Voltage Cable on 8th Main",
    description: "Monsoon wind storm blew down overhead power conductor, sparking actively onto public sidewalk.",
    departmentId: 3,
    departmentName: "Electrical & Street Lighting",
    zoneId: "ZONE-CENTRAL",
    latitude: 12.9750,
    longitude: 77.6010,
    severityLevel: 5,
    affectedCount: 31,
    priorityScore: 63.6,
    isCriticalHazard: true,
    status: "IN_PROGRESS",
    assignedOfficerId: 6,
    assignedOfficerName: "Officer Suresh Menon",
    ageInHours: 9.0,
    createdAt: new Date(Date.now() - 9 * 3600000).toISOString(),
    photoUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5"
  },
  {
    complaintId: 2,
    title: "Dangerous Deep Pothole Near Primary School",
    description: "2-foot wide crater causing two-wheeler skids and vehicle suspension damage during evening peak hours.",
    departmentId: 1,
    departmentName: "Roads & Infrastructure",
    zoneId: "ZONE-SOUTH",
    latitude: 12.9352,
    longitude: 77.6245,
    severityLevel: 4,
    affectedCount: 22,
    priorityScore: 62.8,
    isCriticalHazard: true,
    status: "REPORTED",
    assignedOfficerId: null,
    assignedOfficerName: null,
    ageInHours: 21.0,
    createdAt: new Date(Date.now() - 21 * 3600000).toISOString(),
    photoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7"
  },
  {
    complaintId: 3,
    title: "Streetlight 42 Flickering at Residential Cross",
    description: "Overhead sodium bulb intermittent in lane 3, causing localized dark pocket at pedestrian crossing.",
    departmentId: 3,
    departmentName: "Electrical & Street Lighting",
    zoneId: "ZONE-CENTRAL",
    latitude: 12.9780,
    longitude: 77.6408,
    severityLevel: 2,
    affectedCount: 4,
    priorityScore: 4.4,
    isCriticalHazard: false,
    status: "REPORTED",
    assignedOfficerId: null,
    assignedOfficerName: null,
    ageInHours: 11.0,
    createdAt: new Date(Date.now() - 11 * 3600000).toISOString(),
    photoUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5"
  },
  {
    complaintId: 4,
    title: "Overflowing Waste Bin at Community Park",
    description: "Municipal container exceeded capacity following weekend market. Cleared and sanitized.",
    departmentId: 4,
    departmentName: "Sanitation & Waste Management",
    zoneId: "ZONE-NORTH",
    latitude: 12.9800,
    longitude: 77.5800,
    severityLevel: 3,
    affectedCount: 15,
    priorityScore: 0.0,
    isCriticalHazard: false,
    status: "RESOLVED",
    assignedOfficerId: 4,
    assignedOfficerName: "Officer Vikram Singh",
    ageInHours: 48.0,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    photoUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b"
  }
];

// Fallback Departments
const mockDepartments = [
  { deptId: 1, deptName: "Roads & Infrastructure" },
  { deptId: 2, deptName: "Water Supply & Sewerage" },
  { deptId: 3, deptName: "Electrical & Street Lighting" },
  { deptId: 4, deptName: "Sanitation & Waste Management" }
];

// Fallback Officers
const mockOfficers = [
  { userId: 4, name: "Officer Vikram Singh", zoneId: "ZONE-NORTH" },
  { userId: 5, name: "Officer Ananya Roy", zoneId: "ZONE-SOUTH" },
  { userId: 6, name: "Officer Suresh Menon", zoneId: "ZONE-CENTRAL" }
];

/* ==========================================================================
   Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupKeyboardListeners();
  updatePhotoPreview();
  updateLiveScorePreview();
  runSimulation();

  await determineApiBase();
  await Promise.all([
    checkBackendStatus(),
    fetchDepartments(),
    fetchOfficers()
  ]);

  // Periodic heartbeat every 8 seconds
  setInterval(checkBackendStatus, 8000);
});

// Determine working API URL (proxy /api vs http://localhost:8080/api)
async function determineApiBase() {
  try {
    const res = await fetch('/api/complaints/priority?onlyActive=false');
    if (res.ok) {
      API_BASE = '/api';
      return;
    }
  } catch (e) {}

  try {
    const directRes = await fetch('http://localhost:8080/api/complaints/priority?onlyActive=false');
    if (directRes.ok) {
      API_BASE = 'http://localhost:8080/api';
    }
  } catch (e) {
    API_BASE = '/api';
  }
}

/* ==========================================================================
   Navigation & Tabs
   ========================================================================== */
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));

  const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
  if (targetBtn) targetBtn.classList.add('active');

  const targetView = document.getElementById(tabId);
  if (targetView) targetView.classList.add('active');

  if (tabId === 'analyticsTab') {
    fetchZoneAnalytics();
  } else if (tabId === 'officerTab') {
    fetchPriorityQueue();
  }
}

function setupKeyboardListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTimelineModal();
      closeStatusModal();
      closeAssignModal();
    }
  });
}

function handleModalBackdropClick(event, modalId) {
  if (event.target.id === modalId) {
    document.getElementById(modalId).classList.add('hidden');
  }
}

/* ==========================================================================
   Backend Health & Master Data
   ========================================================================== */
async function checkBackendStatus() {
  const pill = document.getElementById('backendStatus');
  const text = document.getElementById('backendStatusText');

  try {
    const res = await fetch(`${API_BASE}/complaints/priority?onlyActive=false`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        isBackendOnline = true;
        currentComplaints = json.data;
        if (pill) pill.className = 'status-pill status-online';
        if (text) text.textContent = 'Engine Online: MySQL Connected';
        renderQueue(currentComplaints);
        updateKPIs(currentComplaints);
        renderCommunityFeed(currentComplaints);
        return;
      }
    }
  } catch (err) {}

  isBackendOnline = false;
  if (pill) pill.className = 'status-pill status-offline';
  if (text) text.textContent = 'Engine Offline (Standalone Mode)';
  renderQueue(mockComplaints);
  updateKPIs(mockComplaints);
  renderCommunityFeed(mockComplaints);
}

async function fetchDepartments() {
  try {
    const res = await fetch(`${API_BASE}/departments`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        allDepartments = json.data;
        populateDepartmentSelects(allDepartments);
        return;
      }
    }
  } catch (e) {}

  allDepartments = mockDepartments;
  populateDepartmentSelects(allDepartments);
}

function populateDepartmentSelects(depts) {
  const formSelect = document.getElementById('deptSelect');
  const filterSelect = document.getElementById('filterDeptSelect');

  if (formSelect) {
    formSelect.innerHTML = depts.map(d => 
      `<option value="${d.deptId}">${escapeHtml(d.deptName)}</option>`
    ).join('');
  }

  if (filterSelect) {
    const currentVal = filterSelect.value;
    filterSelect.innerHTML = `<option value="">All Departments</option>` +
      depts.map(d => `<option value="${d.deptId}">${escapeHtml(d.deptName)}</option>`).join('');
    filterSelect.value = currentVal;
  }
}

async function fetchOfficers() {
  try {
    const res = await fetch(`${API_BASE}/users/officers`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        allOfficers = json.data;
        return;
      }
    }
  } catch (e) {}

  allOfficers = mockOfficers;
}

/* ==========================================================================
   Priority Queue & Filter Engine
   ========================================================================== */
async function fetchPriorityQueue() {
  if (!isBackendOnline) {
    renderQueue(mockComplaints);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/complaints/priority?onlyActive=false`);
    const json = await res.json();
    if (json.success && json.data) {
      currentComplaints = json.data;
      renderQueue(currentComplaints);
      updateKPIs(currentComplaints);
      renderCommunityFeed(currentComplaints);
      showToast("Priority queue synchronized with MySQL engine", "success");
    }
  } catch (err) {
    renderQueue(mockComplaints);
  }
}

function handleFilterChange() {
  const list = isBackendOnline ? currentComplaints : mockComplaints;
  renderQueue(list);
}

function toggleHazardFilter() {
  activeFilterHazard = !activeFilterHazard;
  const btn = document.getElementById('filterHazardToggle');
  if (btn) {
    btn.classList.toggle('active', activeFilterHazard);
  }
  handleFilterChange();
}

function getFilteredQueue(list) {
  const query = (document.getElementById('queueSearchInput')?.value || '').toLowerCase().trim();
  const deptId = document.getElementById('filterDeptSelect')?.value;
  const zoneId = document.getElementById('filterZoneSelect')?.value;
  const status = document.getElementById('filterStatusSelect')?.value;

  return list.filter(item => {
    if (activeFilterHazard && !item.isCriticalHazard) return false;
    if (deptId && item.departmentId != deptId) return false;
    if (zoneId && item.zoneId !== zoneId) return false;
    if (status && item.status !== status) return false;

    if (query) {
      const matchTitle = (item.title || '').toLowerCase().includes(query);
      const matchDept = (item.departmentName || '').toLowerCase().includes(query);
      const matchZone = (item.zoneId || '').toLowerCase().includes(query);
      const matchOfficer = (item.assignedOfficerName || '').toLowerCase().includes(query);
      if (!matchTitle && !matchDept && !matchZone && !matchOfficer) return false;
    }

    return true;
  });
}

function renderQueue(rawList) {
  const tbody = document.getElementById('priorityTableBody');
  if (!tbody) return;

  const filtered = getFilteredQueue(rawList);

  if (!filtered || filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <h4>No matching civic incidents found</h4>
          <p>Try resetting active department, zone, or hazard filters above.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((item, index) => {
    const isResolved = item.status === 'RESOLVED';
    const scoreBadgeClass = isResolved ? 'score-resolved' :
                            item.isCriticalHazard ? 'score-hazard' :
                            item.priorityScore >= 30 ? 'score-high' :
                            item.priorityScore >= 10 ? 'score-medium' : 'score-low';

    const rankCls = index === 0 ? 'rank-top-1' : index === 1 ? 'rank-top-2' : '';
    const ageHrs = typeof item.ageInHours === 'number' ? item.ageInHours.toFixed(1) : '0.0';

    return `
      <tr>
        <td>
          <span class="rank-pill ${rankCls}">#${index + 1}</span>
        </td>
        <td>
          <div class="priority-score-wrap">
            <span class="badge-score ${scoreBadgeClass}" title="Dynamic Formula Score">
              ${item.priorityScore.toFixed(1)}
            </span>
            ${item.isCriticalHazard ? `
              <svg class="hazard-flame-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" title="Life-Safety Hazard (+50.0 Boost)">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
                <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            ` : ''}
          </div>
        </td>
        <td class="table-issue-cell">
          <strong class="table-issue-title">${escapeHtml(item.title)}</strong>
          <span class="table-dept-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            ${escapeHtml(item.departmentName || 'Civic Services')}
          </span>
        </td>
        <td>
          <span class="zone-pill">${escapeHtml(item.zoneId)}</span>
          <div class="geo-coords">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <a href="https://www.google.com/maps?q=${item.latitude},${item.longitude}" target="_blank" rel="noopener" style="color:inherit; text-decoration:underline;">
              ${item.latitude}, ${item.longitude}
            </a>
          </div>
        </td>
        <td>
          <div style="font-weight:600; color:#ffffff; font-size:0.83rem;">
            👥 ${item.affectedCount} impacted
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono); margin-top:0.15rem;">
            ⏳ ${ageHrs}h elapsed
          </div>
        </td>
        <td>
          ${item.assignedOfficerName ? `
            <div style="display:flex; align-items:center; gap:0.4rem; font-weight:600; color:#34d399; font-size:0.82rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px; height:14px;">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              ${escapeHtml(item.assignedOfficerName)}
            </div>
            <button class="btn btn-sm btn-secondary" style="margin-top:0.35rem; font-size:0.72rem; padding:0.2rem 0.5rem;" onclick="openAssignModal(${item.complaintId})">
              Reassign
            </button>
          ` : `
            <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
              <button class="btn btn-sm btn-secondary" onclick="openAssignModal(${item.complaintId})">
                Assign
              </button>
              <button class="btn btn-sm btn-primary" onclick="autoDispatch(${item.complaintId})">
                Auto
              </button>
            </div>
          `}
        </td>
        <td>
          <span class="badge-status ${item.status}">${item.status}</span>
        </td>
        <td>
          <div class="table-actions" style="justify-content: flex-end;">
            <button class="btn btn-sm btn-secondary" onclick="openTimelineModal(${item.complaintId})" title="View Audit Trail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Audit
            </button>
            <button class="btn btn-sm btn-primary" onclick="openStatusModal(${item.complaintId})" title="Advance Resolution Pipeline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              Stage
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateKPIs(list) {
  const active = list.filter(c => c.status !== 'RESOLVED');
  const hazards = list.filter(c => c.isCriticalHazard && c.status !== 'RESOLVED').length;
  const avg = list.length > 0 ? (list.reduce((acc, c) => acc + c.priorityScore, 0) / list.length).toFixed(1) : '0.0';
  const resolved = list.filter(c => c.status === 'RESOLVED').length;
  const rate = list.length > 0 ? Math.round((resolved / list.length) * 100) : 0;

  document.getElementById('kpiActive').textContent = active.length;
  document.getElementById('kpiHazards').textContent = hazards;
  document.getElementById('kpiAvgScore').textContent = avg;
  document.getElementById('kpiResolutionRate').textContent = `${rate}%`;
}

/* ==========================================================================
   Citizen Community Feed & Upvoting
   ========================================================================== */
function renderCommunityFeed(list) {
  const feed = document.getElementById('communityFeed');
  if (!feed) return;

  feed.innerHTML = list.map(item => {
    const isVoted = votedTicketIds.has(item.complaintId);
    return `
      <div class="feed-item">
        <div class="feed-top">
          <div class="feed-title">${escapeHtml(item.title)}</div>
          <span class="badge-status ${item.status}">${item.status}</span>
        </div>
        <div class="feed-desc">${escapeHtml(item.description || 'Civic infrastructure malfunction logged for municipal attention.')}</div>
        ${item.photoUrl ? `<img src="${escapeHtml(item.photoUrl)}" alt="Photo Proof" class="feed-image-thumb" onerror="this.style.display='none'">` : ''}
        <div class="feed-meta">
          <div>
            <span class="zone-pill">${escapeHtml(item.zoneId)}</span>
            <span style="margin-left:0.4rem;">Score: <strong style="color:#38bdf8;">${item.priorityScore.toFixed(1)}</strong></span>
          </div>
          <button class="upvote-btn ${isVoted ? 'voted' : ''}" onclick="upvoteIssue(${item.complaintId})">
            <svg viewBox="0 0 24 24" fill="${isVoted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            ${isVoted ? 'Supported' : 'Upvote'} (${item.affectedCount})
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function upvoteIssue(complaintId) {
  if (isBackendOnline) {
    try {
      const res = await fetch(`${API_BASE}/complaints/${complaintId}/upvote`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        votedTicketIds.add(complaintId);
        showToast(`Complaint #${complaintId} upvoted! Dynamic Priority recalculated to ${json.data.priorityScore.toFixed(1)}`, "success");
        fetchPriorityQueue();
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Fallback local update
  const item = mockComplaints.find(c => c.complaintId === complaintId);
  if (item) {
    votedTicketIds.add(complaintId);
    item.affectedCount += 1;
    item.priorityScore += 0.3; // W2 weight
    showToast(`Complaint #${complaintId} upvoted! New Score: ${item.priorityScore.toFixed(1)}`, "success");
    renderQueue(mockComplaints);
    renderCommunityFeed(mockComplaints);
  }
}

/* ==========================================================================
   Dispatch & Officer Allocation
   ========================================================================== */
async function autoDispatch(complaintId) {
  if (isBackendOnline) {
    try {
      const res = await fetch(`${API_BASE}/complaints/${complaintId}/auto-dispatch`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast(`Smart Dispatch: Ticket #${complaintId} assigned to ${json.data.assignedOfficerName}`, "success");
        fetchPriorityQueue();
        return;
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Fallback local
  const item = mockComplaints.find(c => c.complaintId === complaintId);
  if (item) {
    item.assignedOfficerName = "Officer Suresh Menon";
    item.status = "ASSIGNED";
    showToast(`Smart Dispatch: Assigned ticket to Officer Suresh Menon`, "success");
    renderQueue(mockComplaints);
  }
}

function openAssignModal(complaintId) {
  const list = isBackendOnline ? currentComplaints : mockComplaints;
  const complaint = list.find(c => c.complaintId == complaintId);
  if (!complaint) return;

  document.getElementById('assignComplaintId').value = complaintId;
  const meta = document.getElementById('assignTicketMeta');
  meta.innerHTML = `
    <strong style="color:#ffffff;">Ticket #${complaint.complaintId}: ${escapeHtml(complaint.title)}</strong>
    <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.25rem;">
      Zone: <strong>${complaint.zoneId}</strong> • Dept: ${complaint.departmentName || 'Civic'}
    </div>
  `;

  const select = document.getElementById('assignOfficerSelect');
  select.innerHTML = allOfficers.map(o => `
    <option value="${o.userId}">${escapeHtml(o.name)} (${escapeHtml(o.zoneId || 'General')})</option>
  `).join('');

  document.getElementById('assignModal').classList.remove('hidden');
}

function closeAssignModal() {
  document.getElementById('assignModal').classList.add('hidden');
}

async function handleAssignSubmit(event) {
  event.preventDefault();
  const complaintId = document.getElementById('assignComplaintId').value;
  const officerId = parseInt(document.getElementById('assignOfficerSelect').value);
  const notes = document.getElementById('assignNotes').value;

  if (isBackendOnline) {
    try {
      const res = await fetch(`${API_BASE}/complaints/${complaintId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerId, notes })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Incident #${complaintId} allocated to field officer!`, "success");
        closeAssignModal();
        fetchPriorityQueue();
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Fallback local
  const item = mockComplaints.find(c => c.complaintId == complaintId);
  const officer = allOfficers.find(o => o.userId == officerId);
  if (item && officer) {
    item.assignedOfficerName = officer.name;
    item.assignedOfficerId = officer.userId;
    item.status = 'ASSIGNED';
    showToast(`Allocated to ${officer.name}`, "success");
    closeAssignModal();
    renderQueue(mockComplaints);
  }
}

/* ==========================================================================
   Citizen Complaint Submission
   ========================================================================== */
function selectSeverity(level) {
  document.getElementById('severitySlider').value = level;
  document.querySelectorAll('.severity-pill').forEach(pill => {
    pill.classList.toggle('selected', parseInt(pill.dataset.level) === level);
  });

  const titles = {
    1: 'Level 1: Minor Cosmetic',
    2: 'Level 2: Moderate Disruption',
    3: 'Level 3: Severe Disruption',
    4: 'Level 4: Urgent Hazard',
    5: 'Level 5: Critical Infrastructure Failure'
  };

  document.getElementById('severityValBadge').textContent = titles[level] || `Level ${level}`;
  updateLiveScorePreview();
}

function updatePhotoPreview() {
  const url = document.getElementById('photoUrl').value.trim();
  const wrap = document.getElementById('formPhotoPreview');
  const img = document.getElementById('previewImg');

  if (url) {
    img.src = url;
    wrap.style.display = 'block';
  } else {
    wrap.style.display = 'none';
  }
}

function updateLiveScorePreview() {
  const sev = parseInt(document.getElementById('severitySlider').value) || 4;
  const aff = parseInt(document.getElementById('affectedCount').value) || 1;
  const isHazard = document.getElementById('hazardToggle').checked;

  const score = calculateFormula(sev, aff, 0, isHazard);
  document.getElementById('previewScoreBadge').textContent = score.toFixed(1);

  const boostText = isHazard ? ' + 50.0 boost' : '';
  document.getElementById('previewFormulaText').textContent =
    `(${sev} × 0.5) + (${aff} × 0.3) + (0h × 0.2)${boostText} = ${score.toFixed(1)}`;
}

async function handleComplaintSubmit(event) {
  event.preventDefault();

  const title = document.getElementById('title').value.trim();
  const departmentId = parseInt(document.getElementById('deptSelect').value);
  const zoneId = document.getElementById('zoneSelect').value;
  const latitude = parseFloat(document.getElementById('latitude').value);
  const longitude = parseFloat(document.getElementById('longitude').value);
  const photoUrl = document.getElementById('photoUrl').value.trim();
  const severityLevel = parseInt(document.getElementById('severitySlider').value);
  const affectedCount = parseInt(document.getElementById('affectedCount').value) || 1;
  const isCriticalHazard = document.getElementById('hazardToggle').checked;

  const payload = {
    title,
    description: `Citizen field ticket reported via online verification portal.`,
    citizenId: 1,
    departmentId,
    zoneId,
    latitude,
    longitude,
    photoUrl: photoUrl || null,
    severityLevel,
    affectedCount,
    isCriticalHazard
  };

  if (isBackendOnline) {
    try {
      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Complaint submitted! Initial Priority Score: ${json.data.priorityScore.toFixed(1)}`, "success");
        document.getElementById('complaintForm').reset();
        selectSeverity(4);
        updatePhotoPreview();
        switchTab('officerTab');
        fetchPriorityQueue();
        return;
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Fallback local
  const score = calculateFormula(severityLevel, affectedCount, 0, isCriticalHazard);
  const dept = allDepartments.find(d => d.deptId == departmentId);
  const newMock = {
    complaintId: mockComplaints.length + 1,
    title,
    description: payload.description,
    departmentId,
    departmentName: dept ? dept.deptName : "General Civic",
    zoneId,
    latitude,
    longitude,
    severityLevel,
    affectedCount,
    priorityScore: score,
    isCriticalHazard,
    status: "REPORTED",
    assignedOfficerName: null,
    assignedOfficerId: null,
    ageInHours: 0.1,
    createdAt: new Date().toISOString(),
    photoUrl
  };
  mockComplaints.unshift(newMock);
  mockComplaints.sort((a, b) => b.priorityScore - a.priorityScore);
  showToast(`Complaint filed! Initial Priority: ${score.toFixed(1)}`, "success");
  document.getElementById('complaintForm').reset();
  selectSeverity(4);
  updatePhotoPreview();
  switchTab('officerTab');
  renderQueue(mockComplaints);
}

function fillCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      document.getElementById('latitude').value = pos.coords.latitude.toFixed(4);
      document.getElementById('longitude').value = pos.coords.longitude.toFixed(4);
      showToast("GPS coordinates detected successfully", "success");
    }, () => {
      showToast("GPS permission denied. Using municipal coordinates.", "hazard");
    });
  }
}

/* ==========================================================================
   Modals: Timeline & Resolution Pipeline
   ========================================================================== */
async function openTimelineModal(complaintId) {
  const modal = document.getElementById('timelineModal');
  modal.classList.remove('hidden');

  const metaBox = document.getElementById('modalTicketMeta');
  const stepper = document.getElementById('pipelineStepper');
  const logsBox = document.getElementById('timelineLogs');

  const list = isBackendOnline ? currentComplaints : mockComplaints;
  const complaint = list.find(c => c.complaintId == complaintId);
  if (!complaint) return;

  document.getElementById('modalTitle').textContent = `Ticket #${complaint.complaintId} - Resolution Pipeline`;

  metaBox.innerHTML = `
    <strong style="color:#ffffff; font-size:1rem;">${escapeHtml(complaint.title)}</strong>
    <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.35rem; display:flex; gap:0.75rem; flex-wrap:wrap;">
      <span>Dept: <strong style="color:#cbd5e1;">${escapeHtml(complaint.departmentName || 'Civic')}</strong></span>
      <span>Zone: <strong style="color:#cbd5e1;">${escapeHtml(complaint.zoneId)}</strong></span>
      <span>Priority Score: <strong style="color:#38bdf8;">${complaint.priorityScore.toFixed(1)}</strong></span>
      <span>Impact: <strong style="color:#cbd5e1;">${complaint.affectedCount} Citizens</strong></span>
    </div>
  `;

  // 5-Stage Stepper
  const stages = ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
  const currentIndex = stages.indexOf(complaint.status);

  stepper.innerHTML = stages.map((st, idx) => {
    const isCompleted = idx < currentIndex;
    const isActive = idx === currentIndex;
    const cls = isCompleted ? 'completed' : isActive ? 'active' : '';
    return `
      <div class="step-item ${cls}">
        <div class="step-dot">${isCompleted ? '✓' : idx + 1}</div>
        <span>${st}</span>
      </div>
    `;
  }).join('');

  // Fetch real logs from backend
  if (isBackendOnline) {
    try {
      const res = await fetch(`${API_BASE}/complaints/${complaintId}/timeline`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        logsBox.innerHTML = json.data.map(log => `
          <div class="timeline-entry">
            <div class="timeline-entry-header">
              <span class="badge-status ${log.status}">${log.status}</span>
              <span class="timeline-entry-time">${new Date(log.updatedAt).toLocaleString()}</span>
            </div>
            <div style="color:#e2e8f0; margin-top:0.35rem;">
              ${escapeHtml(log.remarks || 'Stage progress verified.')}
            </div>
            ${log.updatedByName ? `
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">
                Audited by: <strong>${escapeHtml(log.updatedByName)}</strong>
              </div>
            ` : ''}
          </div>
        `).join('');
        return;
      }
    } catch (e) {}
  }

  // Fallback logs
  logsBox.innerHTML = `
    <div class="timeline-entry">
      <div class="timeline-entry-header">
        <span class="badge-status REPORTED">REPORTED</span>
        <span class="timeline-entry-time">Initial Filing</span>
      </div>
      <div style="color:#e2e8f0; margin-top:0.35rem;">Civic issue verified with geo-tag coordinates and priority algorithm baseline.</div>
    </div>
    ${complaint.status !== 'REPORTED' ? `
      <div class="timeline-entry">
        <div class="timeline-entry-header">
          <span class="badge-status ${complaint.status}">${complaint.status}</span>
          <span class="timeline-entry-time">Field Update</span>
        </div>
        <div style="color:#e2e8f0; margin-top:0.35rem;">Stage advanced by active zone dispatcher. Field team mobilized.</div>
      </div>
    ` : ''}
  `;
}

function closeTimelineModal() {
  document.getElementById('timelineModal').classList.add('hidden');
}

/* ==========================================================================
   Modals: Stage Advancement
   ========================================================================== */
function openStatusModal(complaintId) {
  document.getElementById('statusComplaintId').value = complaintId;
  document.getElementById('statusModal').classList.remove('hidden');
}

function closeStatusModal() {
  document.getElementById('statusModal').classList.add('hidden');
}

async function handleStatusSubmit(event) {
  event.preventDefault();
  const complaintId = document.getElementById('statusComplaintId').value;
  const status = document.getElementById('nextStatus').value;
  const remarks = document.getElementById('statusRemarks').value;
  const photoUrl = document.getElementById('statusPhotoUrl').value;

  if (isBackendOnline) {
    try {
      const res = await fetch(`${API_BASE}/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks, photoUrl: photoUrl || null, updatedByUserId: 4 })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Resolution stage updated to ${status}!`, "success");
        closeStatusModal();
        fetchPriorityQueue();
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Fallback local
  const item = mockComplaints.find(c => c.complaintId == complaintId);
  if (item) {
    item.status = status;
    if (status === 'RESOLVED') item.priorityScore = 0.0;
    showToast(`Status updated to ${status}`, "success");
    closeStatusModal();
    renderQueue(mockComplaints);
  }
}

/* ==========================================================================
   Zone Analytics
   ========================================================================== */
async function fetchZoneAnalytics() {
  if (isBackendOnline) {
    try {
      const [sumRes, anaRes] = await Promise.all([
        fetch(`${API_BASE}/reports/summary`),
        fetch(`${API_BASE}/reports/analytics`)
      ]);

      const sumJson = await sumRes.json();
      const anaJson = await anaRes.json();

      if (sumJson.success && sumJson.data) {
        document.getElementById('anaTotal').textContent = sumJson.data.totalComplaints || 0;
        document.getElementById('anaPending').textContent = sumJson.data.pendingTotal || 0;
        document.getElementById('anaResolved').textContent = sumJson.data.resolvedTotal || 0;
        document.getElementById('anaRate').textContent = `${(sumJson.data.overallResolutionRatePercentage || 0).toFixed(0)}%`;
      }

      if (anaJson.success && Array.isArray(anaJson.data)) {
        renderZoneCards(anaJson.data);
        return;
      }
    } catch (e) {}
  }

  // Fallback analytics data
  const fallbackSummary = { total: 5, pending: 4, resolved: 1, rate: 20 };
  document.getElementById('anaTotal').textContent = fallbackSummary.total;
  document.getElementById('anaPending').textContent = fallbackSummary.pending;
  document.getElementById('anaResolved').textContent = fallbackSummary.resolved;
  document.getElementById('anaRate').textContent = `${fallbackSummary.rate}%`;

  const fallbackZones = [
    { zoneId: "ZONE-NORTH", totalComplaints: 2, resolvedComplaints: 1, pendingComplaints: 1, averagePriorityScore: 34.3, resolutionRatePercentage: 50.0 },
    { zoneId: "ZONE-SOUTH", totalComplaints: 1, resolvedComplaints: 0, pendingComplaints: 1, averagePriorityScore: 62.8, resolutionRatePercentage: 0.0 },
    { zoneId: "ZONE-CENTRAL", totalComplaints: 2, resolvedComplaints: 0, pendingComplaints: 2, averagePriorityScore: 34.0, resolutionRatePercentage: 0.0 }
  ];
  renderZoneCards(fallbackZones);
}

function renderZoneCards(zones) {
  const grid = document.getElementById('zoneAnalyticsGrid');
  if (!grid) return;

  grid.innerHTML = zones.map(z => {
    const rate = z.resolutionRatePercentage != null ? z.resolutionRatePercentage.toFixed(0) : '0';
    return `
      <div class="zone-card">
        <div class="zone-card-header">
          <div class="zone-name">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px; height:18px; color:#38bdf8;">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            ${escapeHtml(z.zoneId)}
          </div>
          <span class="brand-badge">${rate}% Resolved</span>
        </div>

        <div class="zone-progress-wrap">
          <div class="zone-progress-label">
            <span>SLA Turnaround Completion</span>
            <span>${rate}%</span>
          </div>
          <div class="zone-progress-bar">
            <div class="zone-progress-fill" style="width: ${rate}%;"></div>
          </div>
        </div>

        <div class="zone-stats-list">
          <div class="zone-metric-row">
            <span>Total Logged Incidents:</span>
            <strong>${z.totalComplaints}</strong>
          </div>
          <div class="zone-metric-row">
            <span>Pending in Queue:</span>
            <strong style="color:#fbbf24;">${z.pendingComplaints != null ? z.pendingComplaints : (z.totalComplaints - z.resolvedComplaints)}</strong>
          </div>
          <div class="zone-metric-row">
            <span>Successfully Resolved:</span>
            <strong style="color:#34d399;">${z.resolvedComplaints}</strong>
          </div>
          <div class="zone-metric-row">
            <span>Average Priority Score:</span>
            <strong style="color:#38bdf8;">${z.averagePriorityScore != null ? z.averagePriorityScore.toFixed(1) : '0.0'}</strong>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ==========================================================================
   Algorithm Simulator
   ========================================================================== */
function runSimulation() {
  const sev = parseInt(document.getElementById('simSev').value);
  const aff = parseInt(document.getElementById('simAff').value);
  const age = parseInt(document.getElementById('simAge').value);
  const isHazard = document.getElementById('simHazard').checked;

  document.getElementById('simSevVal').textContent = sev;
  document.getElementById('simAffVal').textContent = aff;
  document.getElementById('simAgeVal').textContent = `${age} hrs`;

  const sevPart = sev * 0.5;
  const affPart = aff * 0.3;
  const agePart = age * 0.2;
  const boost = isHazard ? 50.0 : 0.0;
  const total = sevPart + affPart + agePart + boost;

  document.getElementById('simResultScore').textContent = total.toFixed(2);
  document.getElementById('simValSev').textContent = sevPart.toFixed(2);
  document.getElementById('simValAff').textContent = affPart.toFixed(2);
  document.getElementById('simValAge').textContent = agePart.toFixed(2);

  // Update contribution share visual widths
  const baseSum = sevPart + affPart + agePart;
  if (baseSum > 0) {
    document.getElementById('simBarSev').style.width = `${Math.min(100, (sevPart / baseSum) * 100)}%`;
    document.getElementById('simBarAff').style.width = `${Math.min(100, (affPart / baseSum) * 100)}%`;
    document.getElementById('simBarAge').style.width = `${Math.min(100, (agePart / baseSum) * 100)}%`;
  }

  const hazardRow = document.getElementById('simHazardRow');
  if (hazardRow) {
    hazardRow.style.display = isHazard ? 'flex' : 'none';
  }

  document.getElementById('simBreakdownText').textContent =
    `Severity: ${sevPart.toFixed(2)} | Impact: ${affPart.toFixed(2)} | Age: ${agePart.toFixed(2)} | Boost: ${boost.toFixed(2)}`;
}

function loadSimPreset(presetId) {
  document.querySelectorAll('.preset-chip').forEach((c, idx) => {
    c.classList.toggle('active', idx + 1 === presetId);
  });

  if (presetId === 1) {
    // Burst Main Pipeline
    document.getElementById('simSev').value = 5;
    document.getElementById('simAff').value = 45;
    document.getElementById('simAge').value = 4;
    document.getElementById('simHazard').checked = true;
  } else if (presetId === 2) {
    // Fallen 11kV Cable
    document.getElementById('simSev').value = 5;
    document.getElementById('simAff').value = 30;
    document.getElementById('simAge').value = 2;
    document.getElementById('simHazard').checked = true;
  } else if (presetId === 3) {
    // School Pothole
    document.getElementById('simSev').value = 4;
    document.getElementById('simAff').value = 25;
    document.getElementById('simAge').value = 24;
    document.getElementById('simHazard').checked = false;
  } else {
    // Aging Streetlight
    document.getElementById('simSev').value = 2;
    document.getElementById('simAff').value = 5;
    document.getElementById('simAge').value = 72;
    document.getElementById('simHazard').checked = false;
  }

  runSimulation();
}

function calculateFormula(sev, aff, age, isHazard) {
  const s = (sev * 0.5) + (aff * 0.3) + (age * 0.2) + (isHazard ? 50.0 : 0.0);
  return Math.round(s * 100) / 100;
}

/* ==========================================================================
   Toast Notifications
   ========================================================================== */
function showToast(msg, type = "info") {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px; height:18px; color:#38bdf8; flex-shrink:0;">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  `;

  if (type === "success") {
    iconSvg = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px; height:18px; color:#34d399; flex-shrink:0;">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    `;
  } else if (type === "hazard") {
    iconSvg = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px; height:18px; color:#f87171; flex-shrink:0;">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
        <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    `;
  }

  toast.innerHTML = `${iconSvg}<div>${escapeHtml(msg)}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 250);
  }, 3800);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
}

// Window global bindings for inline handlers
window.switchTab = switchTab;
window.fetchPriorityQueue = fetchPriorityQueue;
window.handleFilterChange = handleFilterChange;
window.toggleHazardFilter = toggleHazardFilter;
window.autoDispatch = autoDispatch;
window.openAssignModal = openAssignModal;
window.closeAssignModal = closeAssignModal;
window.handleAssignSubmit = handleAssignSubmit;
window.upvoteIssue = upvoteIssue;
window.openStatusModal = openStatusModal;
window.closeStatusModal = closeStatusModal;
window.handleStatusSubmit = handleStatusSubmit;
window.openTimelineModal = openTimelineModal;
window.closeTimelineModal = closeTimelineModal;
window.selectSeverity = selectSeverity;
window.updatePhotoPreview = updatePhotoPreview;
window.handleComplaintSubmit = handleComplaintSubmit;
window.updateLiveScorePreview = updateLiveScorePreview;
window.runSimulation = runSimulation;
window.loadSimPreset = loadSimPreset;
window.fillCurrentLocation = fillCurrentLocation;
window.handleModalBackdropClick = handleModalBackdropClick;
