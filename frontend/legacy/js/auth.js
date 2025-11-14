// Redirect to dashboard if already logged in
if (localStorage.getItem('voip_token')) {
  if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html')) {
    window.location.href = './dashboard.html';
  }
}

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailOrUsername = document.getElementById('emailOrUsername').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrUsername, password }),
      });
      localStorage.setItem('voip_token', data.token);
      localStorage.setItem('voip_user', JSON.stringify(data.user));
      window.location.href = './dashboard.html';
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('d-none');
    }
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('registerError');

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      localStorage.setItem('voip_token', data.token);
      localStorage.setItem('voip_user', JSON.stringify(data.user));
      window.location.href = './dashboard.html';
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('d-none');
    }
  });
}
