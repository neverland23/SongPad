const userInfoEl = document.getElementById('userInfo');
const logoutButton = document.getElementById('logoutButton');

(function initUser() {
  const token = localStorage.getItem('voip_token');
  if (!token) {
    window.location.href = './login.html';
    return;
  }
  const userRaw = localStorage.getItem('voip_user');
  if (userRaw && userInfoEl) {
    const user = JSON.parse(userRaw);
    userInfoEl.textContent = `${user.username} (${user.email})`;
  }
})();

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('voip_token');
    localStorage.removeItem('voip_user');
    window.location.href = './login.html';
  });
}

// Sidebar navigation
const sidebarLinks = document.querySelectorAll('.sidebar-link');
sidebarLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    sidebarLinks.forEach((l) => l.classList.remove('active'));
    link.classList.add('active');

    const targetId = link.getAttribute('data-target');
    document.querySelectorAll('main section').forEach((section) => {
      if (section.id === targetId) {
        section.classList.remove('d-none');
      } else {
        section.classList.add('d-none');
      }
    });
  });
});

// Phone Number Order logic
const countrySelect = document.getElementById('countrySelect');
const searchNumbersButton = document.getElementById('searchNumbersButton');
const numbersTableBody = document.querySelector('#numbersTable tbody');

async function loadCountries() {
  try {
    const countries = await apiRequest('/numbers/countries');
    countrySelect.innerHTML = '';
    countries.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = `${c.name} (${c.code})`;
      countrySelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading countries', err);
  }
}

async function searchNumbers() {
  const countryCode = countrySelect.value;
  if (!countryCode) return;

  numbersTableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

  try {
    const numbers = await apiRequest(`/numbers/search?countryCode=${encodeURIComponent(countryCode)}`);
    if (!numbers.length) {
      numbersTableBody.innerHTML = '<tr><td colspan="5">No numbers found.</td></tr>';
      return;
    }

    numbersTableBody.innerHTML = '';
    numbers.forEach((n) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${n.phoneNumber}</td>
        <td>${n.countryCode}</td>
        <td>${n.monthlyCost || 0}</td>
        <td>${(n.capabilities || []).join(', ')}</td>
        <td><button class="btn btn-sm btn-success order-number-btn">Order</button></td>
      `;
      tr.querySelector('.order-number-btn').addEventListener('click', () => {
        const params = new URLSearchParams({
          phoneNumber: n.phoneNumber,
          countryCode: n.countryCode || '',
          monthlyCost: n.monthlyCost || 0,
        });
        window.location.href = `./order.html?${params.toString()}`;
      });
      numbersTableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error searching numbers', err);
    numbersTableBody.innerHTML = `<tr><td colspan="5">Error: ${err.message}</td></tr>`;
  }
}

if (countrySelect && searchNumbersButton) {
  loadCountries();
  searchNumbersButton.addEventListener('click', searchNumbers);
}

// Voice call logic
const dialInput = document.getElementById('dialInput');
const fromNumberInput = document.getElementById('fromNumberInput');
const callButton = document.getElementById('callButton');
const callStatusEl = document.getElementById('callStatus');
const callLogsTableBody = document.querySelector('#callLogsTable tbody');

document.querySelectorAll('.dial-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const digit = btn.getAttribute('data-digit');
    dialInput.value = (dialInput.value || '') + digit;
  });
});

async function loadCallLogs() {
  try {
    const logs = await apiRequest('/voice/logs');
    callLogsTableBody.innerHTML = '';
    logs.forEach((l) => {
      const tr = document.createElement('tr');
      const created = new Date(l.createdAt);
      tr.innerHTML = `
        <td>${l.from}</td>
        <td>${l.to}</td>
        <td>${l.status}</td>
        <td>${l.direction}</td>
        <td>${l.durationSeconds || '-'}</td>
        <td>${created.toLocaleString()}</td>
      `;
      callLogsTableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading call logs', err);
  }
}

if (callButton) {
  callButton.addEventListener('click', async () => {
    const to = dialInput.value.trim();
    const from = fromNumberInput.value.trim();

    if (!to || !from) {
      callStatusEl.textContent = 'Please enter both from and to numbers.';
      return;
    }

    callStatusEl.textContent = 'Initiating call...';

    try {
      await apiRequest('/voice/call', {
        method: 'POST',
        body: JSON.stringify({ from, to }),
      });
      callStatusEl.textContent = 'Call initiated. Check call logs for updates.';
      dialInput.value = '';
      loadCallLogs();
    } catch (err) {
      callStatusEl.textContent = `Error initiating call: ${err.message}`;
    }
  });

  loadCallLogs();
}

// SMS logic
const contactsList = document.getElementById('contactsList');
const smsMessagesEl = document.getElementById('smsMessages');
const smsConversationTitle = document.getElementById('smsConversationTitle');
const smsForm = document.getElementById('smsForm');
const smsFrom = document.getElementById('smsFrom');
const smsTo = document.getElementById('smsTo');
const smsText = document.getElementById('smsText');
const smsStatusEl = document.getElementById('smsStatus');

let currentContact = null;

async function loadContacts() {
  try {
    const contacts = await apiRequest('/sms/contacts');
    contactsList.innerHTML = '';
    if (!contacts.length) {
      contactsList.innerHTML =
        '<li class="list-group-item bg-slate-900 text-slate-300 small">No contacts yet.</li>';
      return;
    }

    contacts.forEach((c) => {
      const li = document.createElement('li');
      li.className = 'list-group-item bg-slate-900 text-slate-100 contact-item';
      li.textContent = c;
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        currentContact = c;
        smsTo.value = c;
        smsConversationTitle.textContent = `Chat with ${c}`;
        loadConversation();
      });
      contactsList.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading contacts', err);
  }
}

async function loadConversation() {
  if (!currentContact) return;
  try {
    const messages = await apiRequest(`/sms/conversation?contact=${encodeURIComponent(currentContact)}`);
    smsMessagesEl.innerHTML = '';
    messages.forEach((m) => {
      const div = document.createElement('div');
      const alignment = m.direction === 'outbound' ? 'text-end' : 'text-start';
      const bubbleClass =
        m.direction === 'outbound'
          ? 'bg-blue-600 text-white'
          : 'bg-slate-700 text-slate-100';
      div.className = `mb-2 ${alignment}`;
      div.innerHTML = `
        <span class="inline-block px-3 py-2 rounded ${bubbleClass}">
          ${m.body}
        </span>
        <div class="text-xs text-slate-400">${new Date(m.createdAt).toLocaleString()}</div>
      `;
      smsMessagesEl.appendChild(div);
    });
    smsMessagesEl.scrollTop = smsMessagesEl.scrollHeight;
  } catch (err) {
    console.error('Error loading conversation', err);
  }
}

if (smsForm) {
  smsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const from = smsFrom.value.trim();
    const to = smsTo.value.trim();
    const text = smsText.value.trim();

    if (!from || !to || !text) {
      smsStatusEl.textContent = 'Please fill from, to and message.';
      return;
    }

    smsStatusEl.textContent = 'Sending...';

    try {
      await apiRequest('/sms/send', {
        method: 'POST',
        body: JSON.stringify({ from, to, text }),
      });
      smsStatusEl.textContent = 'Message sent.';
      smsText.value = '';
      currentContact = to;
      loadContacts();
      loadConversation();
    } catch (err) {
      smsStatusEl.textContent = `Error sending SMS: ${err.message}`;
    }
  });

  loadContacts();
}

// Notifications logic (simple polling)
const notificationsButton = document.getElementById('notificationsButton');
const notificationsBadge = document.getElementById('notificationsBadge');
const notificationsDropdown = document.getElementById('notificationsDropdown');

let notificationsOpen = false;

async function fetchNotifications() {
  try {
    const notifications = await apiRequest('/notifications?unread=true');
    if (!notifications.length) {
      notificationsBadge.style.display = 'none';
      if (notificationsOpen) {
        notificationsDropdown.innerHTML =
          '<p class="text-muted small mb-0">No new notifications</p>';
      }
      return;
    }

    notificationsBadge.style.display = 'inline-block';
    notificationsBadge.textContent = notifications.length.toString();

    if (notificationsOpen) {
      notificationsDropdown.innerHTML = '';
      notifications.forEach((n) => {
        const div = document.createElement('div');
        div.className = 'mb-2 small';
        div.innerHTML = `
          <strong>${n.title}</strong><br />
          <span class="text-slate-300">${n.message}</span><br />
          <span class="text-slate-500">${new Date(n.createdAt).toLocaleString()}</span>
        `;
        notificationsDropdown.appendChild(div);
      });
    }
  } catch (err) {
    console.error('Error fetching notifications', err);
  }
}

if (notificationsButton && notificationsDropdown) {
  notificationsButton.addEventListener('click', async () => {
    notificationsOpen = !notificationsOpen;
    notificationsDropdown.classList.toggle('show', notificationsOpen);
    if (notificationsOpen) {
      // When opening, load the notifications
      notificationsDropdown.innerHTML =
        '<p class="text-muted small mb-0">Loading...</p>';
      await fetchNotifications();
    } else {
      notificationsDropdown.innerHTML =
        '<p class="text-muted small mb-0">No notifications</p>';
    }
  });

  // Poll for notifications every 10 seconds
  setInterval(fetchNotifications, 10000);
  fetchNotifications();
}
