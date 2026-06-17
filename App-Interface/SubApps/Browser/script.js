const browsers = [
  {
    id: "opera-gx",
    name: "Opera GX",
    icon: "🎮",
    description: "Browser gaming com controlos de CPU, RAM e rede.",
    downloadUrl: "https://net.geo.opera.com/opera_gx/stable/windows",
    filename: "OperaGXSetup.exe",
  },
  {
    id: "brave",
    name: "Brave",
    icon: "🦁",
    description: "Browser focado em privacidade com bloqueio de anúncios.",
    downloadUrl: "https://laptop-updates.brave.com/latest/winx64",
    filename: "BraveBrowserSetup.exe",
  },
  {
    id: "chrome",
    name: "Google Chrome",
    icon: "🌐",
    description: "Browser rápido e amplamente utilizado da Google.",
    downloadUrl: "https://dl.google.com/chrome/install/latest/chrome_installer.exe",
    filename: "ChromeSetup.exe",
  },
  {
    id: "edge",
    name: "Microsoft Edge",
    icon: "🔷",
    description: "Browser da Microsoft baseado em Chromium.",
    downloadUrl: "https://go.microsoft.com/fwlink/?linkid=2108834&Channel=Stable&language=pt",
    filename: "MicrosoftEdgeSetup.exe",
  },
  {
    id: "tor",
    name: "TOR",
    icon: "🧅",
    description: "Browser para navegação anónima e privada na rede Tor.",
    downloadUrl: "https://www.torproject.org/dist/torbrowser/latest/torbrowser-install-win64.exe",
    filename: "tor-browser-install.exe",
  },
];

const browserGrid = document.getElementById("browserGrid");
const statusHint = document.getElementById("statusHint");

function downloadBrowser(browser) {
  const link = document.createElement("a");
  link.href = browser.downloadUrl;
  link.download = browser.filename;
  link.rel = "noopener noreferrer";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  statusHint.textContent = `Download de ${browser.name} iniciado. Verifica a pasta de downloads do teu PC.`;
  statusHint.classList.add("success");
}

function renderBrowsers() {
  browsers.forEach((browser) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "browser-card";
    card.dataset.id = browser.id;
    card.innerHTML = `
      <span class="browser-icon" aria-hidden="true">${browser.icon}</span>
      <span class="browser-name">${browser.name}</span>
      <span class="browser-desc">${browser.description}</span>
      <span class="browser-action">⬇ Fazer download</span>
    `;

    card.addEventListener("click", () => {
      card.classList.add("downloading");
      card.querySelector(".browser-action").textContent = "A transferir…";
      downloadBrowser(browser);

      setTimeout(() => {
        card.classList.remove("downloading");
        card.querySelector(".browser-action").textContent = "⬇ Fazer download";
      }, 2000);
    });

    browserGrid.appendChild(card);
  });
}

renderBrowsers();
