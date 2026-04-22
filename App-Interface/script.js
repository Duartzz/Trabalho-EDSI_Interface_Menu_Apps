const statusTime = document.getElementById("statusTime");
const appCards = document.querySelectorAll(".app-card");
const appModal = document.getElementById("appModal");
const modalTitle = document.getElementById("modalTitle");
const closeModal = document.getElementById("closeModal");

function updateClock() {
  const now = new Date();
  statusTime.textContent = now.toLocaleTimeString();
}

function openModal(appName) {
  modalTitle.textContent = appName;
  appModal.classList.remove("hidden");
}

function hideModal() {
  appModal.classList.add("hidden");
}

appCards.forEach((card) => {
  card.addEventListener("click", () => {
    const appName = card.dataset.app || "App";
    openModal(appName);
  });
});

closeModal.addEventListener("click", hideModal);

appModal.addEventListener("click", (event) => {
  if (event.target === appModal) {
    hideModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideModal();
  }
});

updateClock();
setInterval(updateClock, 1000);
