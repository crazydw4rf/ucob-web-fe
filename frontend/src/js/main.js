import { API_BASE_URL } from './constants';
import gsap from 'gsap';

export function showLoader() {
  let loader = document.getElementById('global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'loader-overlay';
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
  }
  loader.classList.add('active');
}

export function hideLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.classList.remove('active');
  }
}

export function showToast(message, type = 'success') {
  // Simple alert for now, can be replaced with a proper toast library like Toastify or Bootstrap Toasts
  alert(`${type.toUpperCase()}: ${message}`);
}

// --- Auth Utilities ---

/**
 * Checks if the user is currently authenticated by fetching their profile.
 * Relies on the HttpOnly cookie.
 * @returns {Promise<Object|null>} User data object or null if not authenticated
 */
export async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      // credentials: 'include' is needed if API is on a different domain,
      // but assuming same domain or CORS configured properly.
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

/**
 * Logs the user out and redirects to login page.
 */
export async function logout() {
  showLoader();
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    });
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout failed:', error);
    hideLoader();
  }
}

// --- Upload Utilities ---

/**
 * Uploads an image using the signed URL strategy.
 * @param {File} file - The image file to upload
 * @param {String} transactionType - 'SELL' or 'BUY'
 * @returns {Promise<String>} The public URL of the uploaded image
 */
export async function uploadImage(file, transactionType) {
  if (!file) throw new Error('No file provided');

  // 1. Get signed URL from backend
  const signedUrlRes = await fetch(`${API_BASE_URL}/uploads/signed-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      transaction_type: transactionType,
      content_type: file.type,
    }),
  });

  const signedUrlData = await signedUrlRes.json();
  if (!signedUrlRes.ok || !signedUrlData.success) {
    throw new Error(signedUrlData.error?.message || 'Failed to get signed URL');
  }

  const { upload_url, public_url } = signedUrlData.data;

  // 2. Upload file directly to Cloud Storage using the signed URL
  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error('Failed to upload image to storage');
  }

  // 3. Return the public URL to be saved in the database
  return public_url;
}

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

  // Attach logout handlers
  const logoutBtns = document.querySelectorAll('.btn-logout');
  logoutBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });
});
