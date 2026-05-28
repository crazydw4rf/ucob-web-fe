import gsap from "gsap";

export function showLoader() {
  let loader = document.getElementById("global-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "global-loader";
    loader.className = "loader-overlay";
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
  }

  loader.classList.add("active");
}

export function hideLoader() {
  const loader = document.getElementById("global-loader");
  if (loader) {
    loader.classList.remove("active");
  }
}

export function gsapAnimReveal() {
  const revealElements = document.querySelectorAll(".gsap-reveal");
  if (revealElements.length > 0) {
    gsap.fromTo(
      revealElements,
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }
    );
  }
}
