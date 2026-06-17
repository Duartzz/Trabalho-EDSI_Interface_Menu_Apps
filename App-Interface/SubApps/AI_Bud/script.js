const TONE_KEY = "ai-buddy-tone";
const NOTE_DRAFT_KEY = "ai-buddy-pending-note";
const NOTEPAD_KEY = "browser-notepad-content";

const API_BASE =
  window.location.protocol === "file:" ? "http://localhost:3001" : "";

const chatArea = document.getElementById("chatArea");
const welcomeCard = document.getElementById("welcomeCard");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.getElementById("typingIndicator");
const toneSelect = document.getElementById("toneSelect");
const clearBtn = document.getElementById("clearBtn");
const connectionStatus = document.getElementById("connectionStatus");

let messages = [];
let isStreaming = false;

function loadTone() {
  const saved = localStorage.getItem(TONE_KEY);
  if (saved && toneSelect.querySelector(`option[value="${saved}"]`)) {
    toneSelect.value = saved;
  }
}

toneSelect.addEventListener("change", () => {
  localStorage.setItem(TONE_KEY, toneSelect.value);
});

function hideWelcome() {
  if (welcomeCard) welcomeCard.remove();
}

function createMessageBubble(role, text = "") {
  hideWelcome();
  const bubble = document.createElement("div");
  bubble.className = `message ${role}`;
  bubble.textContent = text;
  chatArea.appendChild(bubble);
  chatArea.scrollTop = chatArea.scrollHeight;
  return bubble;
}

function setTyping(active) {
  typingIndicator.classList.toggle("hidden", !active);
  if (active) chatArea.scrollTop = chatArea.scrollHeight;
}

function setInputEnabled(enabled) {
  messageInput.disabled = !enabled;
  sendBtn.disabled = !enabled;
  isStreaming = !enabled;
}

async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    if (!data.geminiConfigured) {
      connectionStatus.textContent = "API Key em falta (.env)";
      connectionStatus.style.color = "#ffb4b4";
    } else {
      connectionStatus.textContent = "Online · MeuPhone AI Buddy";
    }
  } catch {
    connectionStatus.textContent = "Offline — corre start.bat na pasta ai-buddy-server";
    connectionStatus.style.color = "#ffb4b4";
  }
}

async function handlePrepareNote(payload) {
  const { title, body, requiresConfirmation } = payload;
  const preview = title ? `${title}\n\n${body}` : body;

  if (requiresConfirmation) {
    const existing = localStorage.getItem(NOTEPAD_KEY);
    let message = `Queres criar esta nota no Bloco de Notas?\n\nTítulo: ${title}\n\n${body}`;

    if (existing?.trim()) {
      message =
        "Já tens texto no Bloco de Notas. Substituir pelo conteúdo novo?\n\n" + message;
    }

    const confirmed = confirm(message);
    if (!confirmed) {
      createMessageBubble(
        "system",
        "Nota não aplicada. Podes pedir-me para ajustar o conteúdo."
      );
      return;
    }
  }

  localStorage.setItem(
    NOTE_DRAFT_KEY,
    JSON.stringify({ title, body, preview })
  );

  createMessageBubble(
    "system",
    "Nota guardada! Abre o Bloco de Notas para a ver aplicada."
  );
}

async function streamChat(userText) {
  hideWelcome();
  createMessageBubble("user", userText);
  messages.push({ role: "user", content: userText });

  const assistantBubble = createMessageBubble("assistant", "");
  let assistantText = "";

  setInputEnabled(false);
  setTyping(true);

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        tone: toneSelect.value,
      }),
    });

    if (!response.ok) {
      throw new Error("network");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;

        let event;
        try {
          event = JSON.parse(raw);
        } catch {
          continue;
        }

        if (event.type === "token" && event.text) {
          setTyping(false);
          assistantText += event.text;
          assistantBubble.textContent = assistantText;
          chatArea.scrollTop = chatArea.scrollHeight;
        }

        if (event.type === "action" && event.action === "prepare_note") {
          await handlePrepareNote(event.payload);
        }

        if (event.type === "error") {
          setTyping(false);
          assistantBubble.remove();
          createMessageBubble("error", event.message);
          return;
        }
      }
    }

    if (assistantText) {
      messages.push({ role: "assistant", content: assistantText });
    } else if (!assistantBubble.textContent) {
      assistantBubble.remove();
    }
  } catch {
    setTyping(false);
    assistantBubble.remove();
    const offlineHelp =
      window.location.protocol === "file:"
        ? "Abre o projeto em http://localhost:3001 (não uses duplo-clique no HTML).\n\n1. Instala Node.js: https://nodejs.org\n2. Na pasta ai-buddy-server, corre start.bat ou: npm install && npm start\n3. Abre http://localhost:3001 no browser"
        : "Não foi possível comunicar com o AI Buddy. Verifica se o servidor está a correr (start.bat na pasta ai-buddy-server) e se tens internet.";
    createMessageBubble("error", offlineHelp);
  } finally {
    setTyping(false);
    setInputEnabled(true);
    messageInput.focus();
  }
}

function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed || isStreaming) return;
  messageInput.value = "";
  messageInput.style.height = "auto";
  streamChat(trimmed);
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(messageInput.value);
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage(messageInput.value);
  }
});

messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 120)}px`;
});

clearBtn.addEventListener("click", () => {
  if (!messages.length) return;
  if (!confirm("Limpar toda a conversa desta sessão?")) return;

  messages = [];
  chatArea.innerHTML = "";
  const welcome = document.createElement("div");
  welcome.className = "welcome-card";
  welcome.id = "welcomeCard";
  welcome.innerHTML = `
    <p>Conversa limpa. Em que posso ajudar?</p>
    <div class="quick-prompts">
      <button type="button" class="quick-btn" data-prompt="Que apps tens disponíveis?">📱 Apps disponíveis</button>
      <button type="button" class="quick-btn" data-prompt="Porque é que 15% de 200 é 30?">🧮 Explicar percentagem</button>
      <button type="button" class="quick-btn" data-prompt="Qual é a melhor jogada no jogo do galo?">❌⭕ Estratégia Galo</button>
    </div>
  `;
  chatArea.appendChild(welcome);
  bindQuickPrompts();
});

function bindQuickPrompts() {
  document.querySelectorAll(".quick-btn").forEach((btn) => {
    btn.addEventListener("click", () => sendMessage(btn.dataset.prompt));
  });
}

bindQuickPrompts();
loadTone();
checkHealth();
messageInput.focus();
