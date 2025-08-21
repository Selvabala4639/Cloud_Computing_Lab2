const API = '/api/contacts';

const $ = (id) => document.getElementById(id);

function setStatus(msg, type = 'info') {
  const el = $('status');
  el.textContent = msg;
  el.style.color = type === 'error' ? '#ef4444' : '#22c55e';
  if (msg) setTimeout(() => (el.textContent = ''), 2500);
}

async function fetchContacts() {
  const res = await fetch(API);
  if (!res.ok) {
    setStatus('Failed to load contacts', 'error');
    return [];
  }
  return res.json();
}

function renderTable(contacts) {
  const tbody = $('contacts-body');
  tbody.innerHTML = '';
  contacts.forEach((c) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.name || ''}</td>
      <td>${c.email || ''}</td>
      <td>${c.phone || ''}</td>
      <td class="actions-cell">
        <button data-id="${c.id}" class="edit">Edit</button>
        <button data-id="${c.id}" class="danger delete">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function load() {
  const contacts = await fetchContacts();
  renderTable(contacts);
}

function resetForm() {
  $('contact-form').reset();
  $('contact-id').value = '';
  $('save-btn').textContent = 'Save';
}

async function handleSubmit(e) {
  e.preventDefault();
  const id = $('contact-id').value;
  const name = $('name').value.trim();
  const email = $('email').value.trim() || null;
  const phone = $('phone').value.trim() || null;

  if (!name) {
    setStatus('Name is required', 'error');
    return;
  }

  const payload = { name, email, phone };
  let res;
  try {
    if (id) {
      res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus(data.error || 'Request failed', 'error');
      return;
    }

    resetForm();
    await load();
    setStatus(id ? 'Contact updated' : 'Contact created');
  } catch (err) {
    setStatus('Network error', 'error');
  }
}

async function handleTableClick(e) {
  const t = e.target;
  if (t.classList.contains('edit')) {
    const id = t.getAttribute('data-id');
    const res = await fetch(`${API}/${id}`);
    if (!res.ok) return setStatus('Failed to fetch contact', 'error');
    const c = await res.json();
    $('contact-id').value = c.id;
    $('name').value = c.name || '';
    $('email').value = c.email || '';
    $('phone').value = c.phone || '';
    $('save-btn').textContent = 'Update';
  }

  if (t.classList.contains('delete')) {
    const id = t.getAttribute('data-id');
    if (!confirm('Delete this contact?')) return;
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok) return setStatus('Failed to delete', 'error');
    await load();
    setStatus('Contact deleted');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('contact-form').addEventListener('submit', handleSubmit);
  $('reset-btn').addEventListener('click', resetForm);
  $('contacts-body').addEventListener('click', handleTableClick);
  load();
});
