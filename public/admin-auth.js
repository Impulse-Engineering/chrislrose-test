(function () {
  'use strict';

  var form = document.getElementById('login-form');
  var emailInput = document.getElementById('login-email');
  var passwordInput = document.getElementById('login-password');
  var submitBtn = document.getElementById('login-submit');
  var errorEl = document.getElementById('login-error');
  var redirectInput = document.getElementById('login-redirect');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var email = emailInput.value.trim();
    var password = passwordInput.value;

    if (!email || !password) {
      showError('Please enter your email and password.');
      return;
    }

    hideError();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in\u2026';

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';

        if (!result.ok) {
          showError(result.data.error || 'Invalid credentials');
          passwordInput.value = '';
          passwordInput.focus();
          return;
        }

        var redirect = redirectInput ? redirectInput.value : '/reading-list';
        window.location.href = redirect;
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
        showError('Network error. Please try again.');
      });
  });

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function hideError() {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
})();
