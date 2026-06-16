export const APPS = [
  {
    id: "calculator",
    name: "Calculadora",
    hubName: "Calculator",
    route: "./SubApps/Calculadora/index.html",
    emoji: "🧮",
    tasks: ["cálculos", "percentagens", "matemática", "potências", "logaritmos", "arredondamentos"],
  },
  {
    id: "notebook",
    name: "Bloco de Notas",
    hubName: "Notebook",
    route: "./SubApps/Bloco_de_Notas/blocodenotas.html",
    emoji: "📝",
    tasks: ["notas", "texto", "escrever", "guardar", "anotações"],
  },
  {
    id: "clock",
    name: "Relógio e Timer",
    hubName: "Clock and Timer",
    route: "./SubApps/Relogio_E_Timer/index.html",
    emoji: "⏰",
    tasks: ["hora", "relógio", "cronómetro", "tempo", "fusos horários"],
  },
  {
    id: "tictactoe",
    name: "Jogo do Galo",
    hubName: "Tic-Tac-Toe",
    route: "./SubApps/Tic-Tac-Toe/index.html",
    emoji: "❌⭕",
    tasks: ["jogo", "galo", "estratégia", "tic-tac-toe", "diversão"],
  },
  {
    id: "browser",
    name: "Browser",
    hubName: "Browser",
    route: "./SubApps/Browser/index.html",
    emoji: "🌐",
    tasks: ["internet", "browser", "download", "chrome", "navegador"],
  },
  {
    id: "snake",
    name: "Snake Game",
    hubName: "Snake Game",
    route: "./SubApps/Snake_Game/index.html",
    emoji: "🐍",
    tasks: ["jogo", "cobra", "arcade", "pontos"],
  },
  {
    id: "ai-buddy",
    name: "AI Buddy",
    hubName: "AI Bud",
    route: "./SubApps/AI_Bud/index.html",
    emoji: "🤖",
    tasks: ["assistente", "ajuda", "perguntas", "ia"],
  },
];

export const MCP_TOOL_DECLARATIONS = [
  {
    name: "list_available_apps",
    description: "Lista todas as apps disponíveis no MeuPhone com as suas funções principais.",
    parametersJsonSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "suggest_app_for_task",
    description: "Sugere a melhor app do MeuPhone para uma tarefa descrita pelo utilizador.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "Descrição da tarefa ou objetivo do utilizador.",
        },
      },
      required: ["task"],
    },
  },
  {
    name: "search_knowledge_base",
    description: "Pesquisa na base de conhecimento (RAG) sobre apps, calculadora, jogo do galo e funcionalidades do sistema.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Consulta de pesquisa em linguagem natural.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "prepare_note",
    description:
      "Prepara uma nota para o Bloco de Notas com título e texto. NÃO apaga notas existentes — o utilizador deve confirmar antes de aplicar.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Título da nota." },
        body: { type: "string", description: "Corpo/conteúdo da nota." },
      },
      required: ["title", "body"],
    },
  },
];

function scoreAppForTask(app, taskTokens) {
  let score = 0;
  const haystack = `${app.name} ${app.tasks.join(" ")}`.toLowerCase();
  for (const token of taskTokens) {
    if (haystack.includes(token)) score += 2;
    if (app.tasks.some((t) => t.includes(token))) score += 3;
  }
  return score;
}

export function executeMcpTool(name, args, { searchKnowledgeBase }) {
  switch (name) {
    case "list_available_apps":
      return {
        data: {
          apps: APPS.map((app) => ({
            name: app.name,
            emoji: app.emoji,
            capabilities: app.tasks,
          })),
        },
      };

    case "suggest_app_for_task": {
      const task = String(args.task || "");
      const tokens = task
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 2);

      const ranked = APPS.map((app) => ({
        app,
        score: scoreAppForTask(app, tokens),
      }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

      const best = ranked[0]?.app || APPS.find((a) => a.id === "ai-buddy");
      return {
        data: {
          suggestedApp: best.name,
          reason: `Para "${task}", recomendo a app ${best.name} (${best.emoji}).`,
          alternatives: ranked.slice(1, 3).map((item) => item.app.name),
        },
      };
    }

    case "search_knowledge_base": {
      const query = String(args.query || "");
      return { data: searchKnowledgeBase(query) };
    }

    case "prepare_note": {
      const title = String(args.title || "").trim();
      const body = String(args.body || "").trim();
      return {
        data: {
          status: "pending_confirmation",
          message: "Nota preparada. O utilizador deve confirmar antes de aplicar ao Bloco de Notas.",
          title,
          body,
        },
        clientAction: {
          action: "prepare_note",
          payload: {
            title,
            body,
            requiresConfirmation: true,
          },
        },
      };
    }

    default:
      return { data: { error: `Ferramenta desconhecida: ${name}` } };
  }
}
