import gsap from 'gsap';

document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap !== 'undefined') {
    const revealElements = document.querySelectorAll('.gsap-reveal');
    if (revealElements.length > 0) {
      gsap.fromTo(
        revealElements,
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }
});

import { API_BASE_URL } from './constants.js';

const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const alertContainer = document.getElementById('alert-container');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Clear previous alerts
  alertContainer.innerHTML = '';

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alertContainer.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>';

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      alertContainer.innerHTML = `<div class="alert alert-danger">${data.error?.message || 'Login failed. Please check your credentials.'}</div>`;
    }
  } catch (error) {
    console.error('Login error:', error);
    alertContainer.innerHTML =
      '<div class="alert alert-danger">An unexpected error occurred. Check if the server is running.</div>';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log In';
  }
});
