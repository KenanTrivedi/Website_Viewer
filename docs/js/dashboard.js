let users = [];
let questionIds = [
  'q0_0','q0_1','q0_2','q0_3','q0_4','q0_5','q0_6',
  'q1_0','q1_1','q1_2','q1_3','q1_4','q1_5',
  'q2_0','q2_1','q2_2','q2_3','q2_4','q2_5','q2_6',
  'q3_0','q3_1','q3_2','q3_3','q3_4','q3_5','q3_6',
  'q4_0','q4_1','q4_2','q4_3','q4_4','q4_5',
  'q5_0','q5_1','q5_2','q5_3','q5_4','q5_5','q5_6',
  'q6_0','q6_1','q6_2','q6_3','q6_4','q6_5',
];
let currentPage = 1;
const usersPerPage = 50;

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    flatpickr('#dateRange', { mode: 'range', dateFormat: 'd/m/Y' });

    document.getElementById('userSearch')?.addEventListener('input', () => {
      currentPage = 1;
      renderTable();
    });

    document.getElementById('applyDateFilter')?.addEventListener('click', () => {
      currentPage = 1;
      renderTable();
    });
    document.getElementById('clearDateFilter')?.addEventListener('click', () => {
      const drp = document.getElementById('dateRange');
      if (drp && drp._flatpickr) {
        drp._flatpickr.clear();
      }
      currentPage = 1;
      renderTable();
    });

    document.getElementById('exportSelected')?.addEventListener('click', exportSelectedData);
    document.getElementById('exportAll')?.addEventListener('click', () => {
      document.querySelectorAll('.user-select').forEach((box) => (box.checked = true));
      exportSelectedData();
    });

    // Visualization toggles
    document.getElementById('toggleVisualization')?.addEventListener('click', () => {
      const vs = document.getElementById('visualizationSidebar');
      if (vs?.classList.contains('active')) {
        closeVisualization();
      } else {
        openVisualization();
      }
    });
    document.getElementById('closeVisualization')?.addEventListener('click', closeVisualization);
    document.getElementById('visualizationOverlay')?.addEventListener('click', closeVisualization);

    await fetchData();
  } catch (err) {
    console.error('Error initializing dashboard:', err);
    showError('Failed to initialize dashboard');
  }
});

function getAuthToken() {
  return localStorage.getItem('dashboardToken') || '';
}

async function fetchData() {
  try {
    const res = await fetch('/api/dashboard-data', {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch data: ' + res.status);
    }
    const data = await res.json();
    if (!Array.isArray(data.users) || !Array.isArray(data.questionIds)) {
      throw new Error('Invalid data structure from server');
    }
    questionIds = data.questionIds;
    users = data.users.map((u) => ({
      ...u,
      userCode: u.userCode || u.userId,
    }));

    renderTable();
  } catch (err) {
    console.error('Error fetching data:', err);
    showError('Failed to load user data');
  }
}

/*************************
 * Render the wide table with T1, T2, T3 columns
 *************************/
function renderTable() {
  const thead = document.querySelector('#userTable thead tr');
  const tbody = document.querySelector('#userTable tbody');
  if (!thead || !tbody) return;

  const filtered = filterUsers();
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const displaySet = filtered.slice(startIndex, endIndex);

  // Build the HEAD with info icons
  // We'll show T1/T2/T3 columns for each question ID
  thead.innerHTML = `
    <th>
      Select
      <span class="info-icon" data-tooltip="Select users for export">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Code
      <span class="info-icon" data-tooltip="Unique user code">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Versuch
      <span class="info-icon" data-tooltip="Attempt number, e.g. 1,2,3">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Geschlecht
      <span class="info-icon" data-tooltip="z.B. M/W/D">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Geburtsjahr
      <span class="info-icon" data-tooltip="z.B. 1990">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Lehramt?
      <span class="info-icon" data-tooltip="Ja/Nein, ob Lehramt studiert wird">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Art Lehramt
      <span class="info-icon" data-tooltip="Welche Lehramtstyp, z.B. Gym">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Studienfächer
      <span class="info-icon" data-tooltip="Welche Fächer?">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Studiengang
      <span class="info-icon" data-tooltip="z.B. BA, MA">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Semester
      <span class="info-icon" data-tooltip="Fachsemester">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Kurse
      <span class="info-icon" data-tooltip="Absolvierte Kurse">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Feedback
      <span class="info-icon" data-tooltip="Kursfeedback (T2)">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Strategie
      <span class="info-icon" data-tooltip="T1 Strategy?">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      Reflexion
      <span class="info-icon" data-tooltip="Reflexion (T2)">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      T1 Zeitpunkt
      <span class="info-icon" data-tooltip="Wann T1 ausgefüllt">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      T2 Zeitpunkt
      <span class="info-icon" data-tooltip="Wann T2 ausgefüllt">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    <th>
      T3 Zeitpunkt
      <span class="info-icon" data-tooltip="Wann T3 ausgefüllt">
        <i class="fas fa-info-circle"></i>
      </span>
    </th>
    ${questionIds
      .map(
        (id) => `
        <th>${id} (T1)
          <span class="info-icon" data-tooltip="Frage ${id}, T1">
            <i class="fas fa-info-circle"></i>
          </span>
        </th>
        <th>${id} (T2)
          <span class="info-icon" data-tooltip="Frage ${id}, T2">
            <i class="fas fa-info-circle"></i>
          </span>
        </th>
        <th>${id} (T3)
          <span class="info-icon" data-tooltip="Frage ${id}, T3">
            <i class="fas fa-info-circle"></i>
          </span>
        </th>
      `
      )
      .join('')}
  `;

  // Now fill the rows
  tbody.innerHTML = '';

  displaySet.forEach((u) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="checkbox" class="user-select" /></td>
      <td>${escapeHtml(u.userCode || '')}</td>
      <td>${escapeHtml(String(u.attemptNumber || ''))}</td>

      <td>${escapeHtml(u.data?.q0_0 || '')}</td>
      <td>${escapeHtml(u.data?.q0_1 || '')}</td>
      <td>${escapeHtml(u.data?.q0_2 || '')}</td>
      <td>${escapeHtml(u.data?.q0_3 || '')}</td>
      <td>${escapeHtml(u.data?.q0_4 || '')}</td>
      <td>${escapeHtml(u.data?.q0_5 || '')}</td>
      <td>${escapeHtml(u.data?.q0_6 || '')}</td>

      <td>${escapeHtml((u.courses || []).join(', '))}</td>
      <td>${escapeHtml(u.openEndedResponses?.attempt2_course_feedback || '')}</td>
      <td>${escapeHtml(u.openEndedResponses?.t1_strategy || '')}</td>
      <td>${escapeHtml(u.openEndedResponses?.t2_reflection || '')}</td>
      <td>${
        u.t1SubmissionTime ? new Date(u.t1SubmissionTime).toLocaleString() : ''
      }</td>
      <td>${
        u.t2SubmissionTime ? new Date(u.t2SubmissionTime).toLocaleString() : ''
      }</td>
      <td>${
        u.t3SubmissionTime ? new Date(u.t3SubmissionTime).toLocaleString() : ''
      }</td>
      ${questionIds
        .map((id) => {
          return `
            <td>${escapeHtml(u.initialResponses?.[id] || '')}</td>
            <td>${escapeHtml(u.updatedResponses?.[id] || '')}</td>
            <td>${escapeHtml(u.followUpResponses?.[id] || '')}</td>
          `;
        })
        .join('')}
    `;
    tbody.appendChild(row);
  });

  updatePagination(filtered.length);
}

function filterUsers() {
  const searchTerm = (document.getElementById('userSearch')?.value || '').toLowerCase();
  const dateRange = document.getElementById('dateRange')?._flatpickr;
  let start = null;
  let end = null;
  if (dateRange && dateRange.selectedDates.length === 2) {
    start = dateRange.selectedDates[0];
    end = dateRange.selectedDates[1];
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  return users.filter((u) => {
    // Filter by T1 date if needed
    if (start && end) {
      const t1 = u.t1SubmissionTime ? new Date(u.t1SubmissionTime) : null;
      if (!t1) return false;
      if (t1 < start || t1 > end) return false;
    }

    // Filter by search
    if (searchTerm) {
      const fields = [
        u.userCode,
        u.attemptNumber,
        u.data?.q0_0,
        u.data?.q0_1,
        u.data?.q0_2,
        u.data?.q0_3,
        u.data?.q0_4,
        u.data?.q0_5,
        u.data?.q0_6,
        (u.courses || []).join(', '),
        u.openEndedResponses?.attempt2_course_feedback,
        u.openEndedResponses?.t1_strategy,
        u.openEndedResponses?.t2_reflection,
      ];
      const combined = fields.join(' ').toLowerCase();
      if (!combined.includes(searchTerm)) return false;
    }
    return true;
  });
}

function updatePagination(totalCount) {
  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;
  const totalPages = Math.ceil(totalCount / usersPerPage);

  paginationEl.innerHTML = `
    <button id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>
    <span>Page ${currentPage} of ${totalPages}</span>
    <button id="nextPage" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
  `;

  document.getElementById('prevPage')?.addEventListener('click', () => changePage(-1));
  document.getElementById('nextPage')?.addEventListener('click', () => changePage(1));
}

function changePage(direction) {
  const filtered = filterUsers();
  const totalPages = Math.ceil(filtered.length / usersPerPage);
  currentPage = Math.min(Math.max(1, currentPage + direction), totalPages);
  renderTable();
}

function showError(msg) {
  const el = document.getElementById('errorMessage');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => {
      el.style.display = 'none';
    }, 5000);
  } else {
    console.error(msg);
  }
}

/***********************
 * Visualization
 ***********************/
function openVisualization() {
  const sidebar = document.getElementById('visualizationSidebar');
  const overlay = document.getElementById('visualizationOverlay');
  const toggleBtn = document.getElementById('toggleVisualization');
  if (!sidebar || !overlay || !toggleBtn) return;
  sidebar.classList.add('active');
  overlay.classList.add('active');
  toggleBtn.innerHTML = '<i class="fas fa-chart-line me-2"></i>Hide Visualization';
  updateVisualization();
}
function closeVisualization() {
  const sidebar = document.getElementById('visualizationSidebar');
  const overlay = document.getElementById('visualizationOverlay');
  const toggleBtn = document.getElementById('toggleVisualization');
  if (!sidebar || !overlay || !toggleBtn) return;
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
  toggleBtn.innerHTML = '<i class="fas fa-chart-line me-2"></i>Show Visualization';
}

function updateVisualization() {
  // Example: find the last selected user, show a simple chart
  const canvas = document.getElementById('visualization');
  if (!canvas) return;
  const checked = [...document.querySelectorAll('.user-select:checked')];
  if (!checked.length) {
    if (window.myChart) window.myChart.destroy();
    return;
  }
  // The last selected row
  const last = checked[checked.length - 1];
  const row = last.closest('tr');
  // code is in col #2
  const codeCell = row?.querySelector('td:nth-child(2)');
  if (!codeCell) {
    if (window.myChart) window.myChart.destroy();
    return;
  }
  const userCode = codeCell.textContent.trim();
  const user = users.find((u) => u.userCode === userCode);
  if (!user) {
    if (window.myChart) window.myChart.destroy();
    return;
  }

  // If you have T1/T2/T3 scores, you can build a data set
  if (window.myChart) window.myChart.destroy();

  // Just a trivial example chart
  const ctx = canvas.getContext('2d');
  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['(No real data)'],
      datasets: [
        { label: 'T1 Score', data: [50], backgroundColor:'#8C52FF', borderColor:'#666', borderWidth:1},
      ]
    },
    options: { responsive:true }
  });
}

/***********************
 * Export CSV
 ***********************/
function exportSelectedData() {
  const checked = document.querySelectorAll('.user-select:checked');
  if (!checked.length) {
    showError('Please select at least one user to export data.');
    return;
  }
  // gather them
  const selectedUsers = [];
  checked.forEach((c) => {
    const row = c.closest('tr');
    const codeCell = row.querySelector('td:nth-child(2)');
    if (!codeCell) return;
    const userCode = codeCell.textContent.trim();
    const user = users.find((u) => u.userCode === userCode);
    if (user) selectedUsers.push(user);
  });

  const csvRows = [];
  const headers = [
    'Code','Versuch','Geschlecht','Geburtsjahr','Lehramt?','Art Lehramt',
    'Studienfächer','Studiengang','Semester','Kurse','Feedback','Strategie','Reflexion',
    'T1 Zeitpunkt','T2 Zeitpunkt','T3 Zeitpunkt',
    ...questionIds.flatMap((id) => [`${id} (T1)`, `${id} (T2)`, `${id} (T3)`]),
  ];
  csvRows.push(headers);

  selectedUsers.forEach((u) => {
    const row = [
      u.userCode,
      u.attemptNumber || '',
      u.data?.q0_0 || '',
      u.data?.q0_1 || '',
      u.data?.q0_2 || '',
      u.data?.q0_3 || '',
      u.data?.q0_4 || '',
      u.data?.q0_5 || '',
      u.data?.q0_6 || '',
      (u.courses||[]).join(';'),
      u.openEndedResponses?.attempt2_course_feedback || '',
      u.openEndedResponses?.t1_strategy || '',
      u.openEndedResponses?.t2_reflection || '',
      u.t1SubmissionTime ? new Date(u.t1SubmissionTime).toLocaleString() : '',
      u.t2SubmissionTime ? new Date(u.t2SubmissionTime).toLocaleString() : '',
      u.t3SubmissionTime ? new Date(u.t3SubmissionTime).toLocaleString() : '',
      ...questionIds.flatMap((id) => [
        u.initialResponses?.[id] || '',
        u.updatedResponses?.[id] || '',
        u.followUpResponses?.[id] || '',
      ]),
    ];
    csvRows.push(row);
  });

  const csvString = csvRows
    .map((arr) =>
      arr
        .map((cell) => {
          if (typeof cell === 'string' && cell.includes(',')) {
            return `"${cell}"`;
          }
          return cell;
        })
        .join(',')
    )
    .join('\n');

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'survey_data.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
