import { API_URL } from "./constants";

const form = document.getElementById("register-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const alertContainer = document.getElementById("alert-container");
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Clear previous alerts
  alertContainer.innerHTML = "";

  if (password.length < 6) {
    alertContainer.innerHTML = '<div class="alert alert-danger">Password must be at least 6 characters long.</div>';
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';

    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName || undefined,
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alertContainer.innerHTML =
        '<div class="alert alert-success">Registration successful! Redirecting to login...</div>';
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      alertContainer.innerHTML = `<div class="alert alert-danger">${data.error?.message || "Registration failed. Please try again."}</div>`;
    }
  } catch (error) {
    console.error("Registration error:", error);
    alertContainer.innerHTML =
      '<div class="alert alert-danger">An unexpected error occurred. Check if the server is running.</div>';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Register";
  }
});
