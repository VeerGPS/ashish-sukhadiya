let allAppointments = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  loadAppointments();

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = 'login.html';
  });

  document.getElementById('filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-filter-btn');
    if (!btn) return;
    document.querySelectorAll('.admin-filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.getAttribute('data-filter');
    render();
  });
});

async function loadAppointments() {
  const loadingState = document.getElementById('loadingState');
  const table = document.getElementById('appointmentsTable');
  const emptyState = document.getElementById('emptyState');

  try {
    const res = await fetch('/api/admin/appointments', { credentials: 'same-origin' });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load appointments');

    allAppointments = data.appointments || [];
    loadingState.style.display = 'none';
    updateStats();
    render();
  } catch (err) {
    loadingState.textContent = err.message || 'Failed to load appointments.';
  }
}

function updateStats() {
  document.getElementById('statTotal').textContent = allAppointments.length;
  document.getElementById('statPending').textContent = allAppointments.filter((a) => a.status === 'pending').length;
  document.getElementById('statConfirmed').textContent = allAppointments.filter((a) => a.status === 'confirmed').length;
  document.getElementById('statDmit').textContent = allAppointments.filter((a) => a.type === 'dmit').length;
}

function getFiltered() {
  if (currentFilter === 'all') return allAppointments;
  if (['counseling', 'dmit'].includes(currentFilter)) {
    return allAppointments.filter((a) => a.type === currentFilter);
  }
  return allAppointments.filter((a) => a.status === currentFilter);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function render() {
  const table = document.getElementById('appointmentsTable');
  const emptyState = document.getElementById('emptyState');
  const tbody = document.getElementById('appointmentsBody');
  const filtered = getFiltered();

  if (!filtered.length) {
    table.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  table.style.display = 'table';
  emptyState.style.display = 'none';

  tbody.innerHTML = filtered
    .map((appt) => {
      const typeBadge = appt.type === 'dmit'
        ? '<span class="badge badge-dmit">DMIT</span>'
        : '<span class="badge badge-counseling">Counseling</span>';

      const student = appt.studentName
        ? `${escapeHtml(appt.studentName)}${appt.studentAge ? ` (${escapeHtml(appt.studentAge)})` : ''}`
        : '—';

      const slot = `${formatDate(appt.preferredDate)}${appt.preferredTime ? `<br><span style="color:var(--silver-500)">${escapeHtml(appt.preferredTime)}</span>` : ''}`;

      return `
        <tr>
          <td>${formatDate(appt.createdAt)}</td>
          <td>${typeBadge}</td>
          <td>
            <strong>${escapeHtml(appt.name)}</strong><br>
            <span style="color:var(--silver-500)">${escapeHtml(appt.email)}</span><br>
            <span style="color:var(--silver-500)">${escapeHtml(appt.phone)}</span>
          </td>
          <td>${student}</td>
          <td>${slot}</td>
          <td style="max-width:220px; white-space:pre-wrap;">${escapeHtml(appt.message) || '—'}</td>
          <td>
            <select class="status-select status-${appt.status}" data-id="${appt._id}">
              <option value="pending" ${appt.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="confirmed" ${appt.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="completed" ${appt.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="cancelled" ${appt.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>
            <div class="row-actions">
              <button class="icon-btn" data-delete="${appt._id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  tbody.querySelectorAll('.status-select').forEach((select) => {
    select.addEventListener('change', (e) => updateStatus(e.target.getAttribute('data-id'), e.target.value, e.target));
  });

  tbody.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => deleteAppointment(btn.getAttribute('data-delete')));
  });
}

async function updateStatus(id, status, selectEl) {
  try {
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ status }),
    });
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    if (!res.ok) throw new Error('Failed to update status');

    const appt = allAppointments.find((a) => a._id === id);
    if (appt) appt.status = status;
    selectEl.className = `status-select status-${status}`;
    updateStats();
  } catch (err) {
    alert(err.message || 'Failed to update status.');
  }
}

async function deleteAppointment(id) {
  if (!confirm('Delete this appointment request? This cannot be undone.')) return;

  try {
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    if (!res.ok) throw new Error('Failed to delete appointment');

    allAppointments = allAppointments.filter((a) => a._id !== id);
    updateStats();
    render();
  } catch (err) {
    alert(err.message || 'Failed to delete appointment.');
  }
}
