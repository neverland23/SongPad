const params = new URLSearchParams(window.location.search);
const phoneNumber = params.get('phoneNumber');
const countryCode = params.get('countryCode') || '';
const monthlyCost = params.get('monthlyCost') || '0';

const phoneSpan = document.getElementById('orderPhoneNumber');
const costSpan = document.getElementById('orderMonthlyCost');
const confirmOrderButton = document.getElementById('confirmOrderButton');
const orderStatusEl = document.getElementById('orderStatus');

if (!localStorage.getItem('voip_token')) {
  window.location.href = './login.html';
}

if (phoneSpan) phoneSpan.textContent = phoneNumber || 'Unknown';
if (costSpan) costSpan.textContent = monthlyCost;

if (confirmOrderButton) {
  confirmOrderButton.addEventListener('click', async () => {
    if (!phoneNumber) {
      orderStatusEl.textContent = 'No phone number provided.';
      return;
    }
    orderStatusEl.textContent = 'Placing order...';

    try {
      await apiRequest('/numbers/order', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber,
          countryCode,
          monthlyCost: Number(monthlyCost) || 0,
        }),
      });
      orderStatusEl.textContent = 'Order successful! Redirecting to dashboard...';
      setTimeout(() => {
        window.location.href = './dashboard.html';
      }, 1200);
    } catch (err) {
      orderStatusEl.textContent = `Order failed: ${err.message}`;
    }
  });
}
