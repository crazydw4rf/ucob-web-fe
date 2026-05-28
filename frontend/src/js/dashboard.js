import { API_URL } from "./constants";
import { showLoader } from "./utils";
import { Modal } from "bootstrap";

let currentUser = null;
const imageModal = new Modal(document.getElementById("imageModal"));

export function showImage(url) {
  document.getElementById("modalImage").src = url;
  imageModal.show();
}

function getStatusBadge(status) {
  const s = status.toUpperCase();
  if (s === "PENDING") return `<span class="badge badge-pending rounded-pill px-3 py-1">Pending</span>`;
  if (s === "ACCEPTED") return `<span class="badge badge-accepted rounded-pill px-3 py-1">Accepted</span>`;
  if (s === "REJECTED") return `<span class="badge badge-rejected rounded-pill px-3 py-1">Rejected</span>`;
  return `<span class="badge bg-secondary rounded-pill px-3 py-1">${status}</span>`;
}

// --- USER FUNCTIONS ---
async function loadUserHistory() {
  const fetchHistory = async (endpoint) => {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, { headers: { Accept: "application/json" } });
      const result = await res.json();
      return res.ok && result.success ? result.data : [];
    } catch (e) {
      return [];
    }
  };

  const renderTable = (data, tbodyId) => {
    const tbody = document.getElementById(tbodyId);
    if (!data || !data.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted">No records found.</td></tr>`;
      return;
    }
    tbody.innerHTML = data
      .map(
        (item) => `
                    <tr>
                        <td class="ps-4">${new Date(item.created_at).toLocaleDateString()}</td>
                        <td class="fw-bold">${parseFloat(item.quantity_liter).toFixed(2)} L</td>
                        <td>${getStatusBadge(item.status)}</td>
                    </tr>
                `
      )
      .join("");
  };

  const [sellData, buyData] = await Promise.all([fetchHistory("/sell-requests"), fetchHistory("/buy-requests")]);
  renderTable(sellData, "user-sell-history");
  renderTable(buyData, "user-buy-history");
}

function setupImagePreview(inputId, previewImgId, containerId) {
  document.getElementById(inputId).addEventListener("change", function () {
    const file = this.files[0];
    const container = document.getElementById(containerId);
    const img = document.getElementById(previewImgId);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
        container.classList.remove("d-none");
      };
      reader.readAsDataURL(file);
    } else {
      img.src = "";
      container.classList.add("d-none");
    }
  });
}

function setupForm(formId, alertId, type, endpoint, payloadBuilder) {
  document.getElementById(formId).addEventListener("submit", async (e) => {
    e.preventDefault();
    const alertContainer = document.getElementById(alertId);
    alertContainer.innerHTML = "";

    const fileInput = document.getElementById(type === "SELL" ? "sell-photo" : "buy-proof");
    const file = fileInput.files[0];
    if (!file) {
      alertContainer.innerHTML = '<div class="alert alert-danger">Please upload the required file.</div>';
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    try {
      showLoader();
      submitBtn.disabled = true;

      const photoUrl = await uploadImage(file, type);
      const payload = payloadBuilder(photoUrl);

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alertContainer.innerHTML = `<div class="alert alert-success">${type === "SELL" ? "Sell" : "Buy"} request submitted successfully!</div>`;
        e.target.reset();
        document
          .getElementById(type === "SELL" ? "sell-preview-container" : "buy-preview-container")
          .classList.add("d-none");
        loadUserHistory();

        // Switch back to overview
        setTimeout(() => {
          const overviewTab = new bootstrap.Tab(document.getElementById("tab-user-overview"));
          overviewTab.show();
          alertContainer.innerHTML = "";
        }, 1500);
      } else {
        alertContainer.innerHTML = `<div class="alert alert-danger">${data.error?.message || "Failed to submit request."}</div>`;
      }
    } catch (err) {
      alertContainer.innerHTML = `<div class="alert alert-danger">${err.message || "Error occurred."}</div>`;
    } finally {
      submitBtn.disabled = false;
      hideLoader();
    }
  });
}

// --- ADMIN FUNCTIONS ---
async function loadAdminData(type) {
  const tbodyId = type === "sell" ? "admin-sell-body" : "admin-buy-body";
  const endpoint = type === "sell" ? "/admin/sell-requests" : "/admin/buy-requests";
  const tbody = document.getElementById(tbodyId);

  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Loading...</td></tr>';
  try {
    const res = await fetch(`${API_URL}${endpoint}`, { headers: { Accept: "application/json" } });
    const result = await res.json();

    if (res.ok && result.success) {
      if (!result.data || !result.data.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No pending requests.</td></tr>`;
        return;
      }

      tbody.innerHTML = result.data
        .map((item) => {
          const address = type === "sell" ? item.pickup_address : item.delivery_address;
          const imgUrl = type === "sell" ? item.photo_url : item.payment_proof_url;

          let actions =
            item.status === "PENDING"
              ? `<button class="btn btn-sm btn-success me-1" onclick="verifyRequest('${type}', ${item.id}, 'ACCEPTED')" title="Accept"><i class="bi bi-check-lg"></i></button>
                               <button class="btn btn-sm btn-danger" onclick="verifyRequest('${type}', ${item.id}, 'REJECTED')" title="Reject"><i class="bi bi-x-lg"></i></button>`
              : `<span class="text-muted small">Processed</span>`;

          return `
                            <tr>
                                <td class="ps-4 fw-bold">#${item.id}</td>
                                <td><div>${item.user?.first_name || "User"}</div><div class="small text-muted">ID: ${item.user?.id || "-"}</div></td>
                                <td class="fw-bold">${parseFloat(item.quantity_liter).toFixed(2)} L</td>
                                <td class="text-truncate" style="max-width: 200px;" title="${address}">${address}</td>
                                <td>${imgUrl ? `<img src="${imgUrl}" class="table-image" onclick="showImage('${imgUrl}')">` : "-"}</td>
                                <td>${getStatusBadge(item.status)}</td>
                                <td class="text-end pe-4">${actions}</td>
                            </tr>
                        `;
        })
        .join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Failed to load data.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Error connecting to server.</td></tr>`;
  }
}

window.verifyRequest = async (type, id, status) => {
  if (!confirm(`Are you sure you want to mark this as ${status}?`)) return;
  showLoader();
  try {
    const res = await fetch(`${API_URL}/admin/${type}-requests/${id}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await res.json();
    if (res.ok && result.success) {
      loadAdminData(type);
    } else {
      alert(result.error?.message || "Failed to update request");
    }
  } catch (err) {
    alert("An error occurred.");
  } finally {
    hideLoader();
  }
};

// --- INIT ---
document.addEventListener("DOMContentLoaded", async () => {
  showLoader();
  currentUser = await checkAuth();

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("sidebar-user-name").textContent = currentUser.first_name;

  // Style active pills dynamically
  document.querySelectorAll("#v-pills-tab .nav-link").forEach((pill) => {
    pill.addEventListener("shown.bs.tab", (e) => {
      document
        .querySelectorAll("#v-pills-tab .nav-link")
        .forEach((p) => p.classList.remove("bg-light", "text-primary", "text-secondary"));
      e.target.classList.add(
        "bg-light",
        e.target.id.includes("sell") ? "text-primary" : e.target.id.includes("buy") ? "text-secondary" : "text-primary"
      );
    });
  });

  if (currentUser.role === "ADMIN") {
    // Admin Setup
    document.getElementById("admin-badge").classList.remove("d-none");
    document.getElementById("top-navbar").classList.replace("bg-white", "bg-dark");
    document.getElementById("top-navbar").classList.add("navbar-dark");
    document.getElementById("sidebar-user-role").textContent = "Admin";

    document.getElementById("admin-menu").classList.remove("d-none");

    // Activate first admin tab
    const firstAdminTab = new bootstrap.Tab(document.getElementById("tab-admin-sell"));
    firstAdminTab.show();
    document.getElementById("tab-admin-sell").classList.add("bg-light", "text-primary");

    await loadAdminData("sell");
    await loadAdminData("buy");
  } else {
    // User Setup
    document.getElementById("user-menu").classList.remove("d-none");

    // Activate first user tab
    const firstUserTab = new bootstrap.Tab(document.getElementById("tab-user-overview"));
    firstUserTab.show();
    document.getElementById("tab-user-overview").classList.add("bg-light", "text-primary");

    // Setup Forms
    setupImagePreview("sell-photo", "sell-preview-img", "sell-preview-container");
    setupImagePreview("buy-proof", "buy-preview-img", "buy-preview-container");

    setupForm("sell-form", "sell-alert-container", "SELL", "/sell-requests", (photoUrl) => ({
      quantity_liter: parseFloat(document.getElementById("sell-quantity").value),
      pickup_address: document.getElementById("sell-address").value,
      photo_url: photoUrl,
    }));

    setupForm("buy-form", "buy-alert-container", "BUY", "/buy-requests", (photoUrl) => ({
      quantity_liter: parseFloat(document.getElementById("buy-quantity").value),
      delivery_address: document.getElementById("buy-address").value,
      payment_proof_url: photoUrl,
    }));

    await loadUserHistory();
  }

  hideLoader();
});
