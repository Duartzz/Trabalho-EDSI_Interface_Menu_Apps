import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const knowledgePath = join(__dirname, "..", "knowledge", "base.json");

let knowledgeBase = [];

function loadKnowledge() {
  try {
    const raw = readFileSync(knowledgePath, "utf-8");
    knowledgeBase = JSON.parse(raw);
  } catch {
    knowledgeBase = [];
  }
}

loadKnowledge();

function tokenize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9%]+/)
    .filter((token) => token.length > 1);
}

/**
 * RAG simples: recupera os chunks mais relevantes por sobreposição de termos.
 */
export function retrieveContext(query, topK = 4) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  const scored = knowledgeBase.map((doc) => {
    const docText = `${doc.tags.join(" ")} ${doc.content}`.toLowerCase();
    const docTokens = new Set(tokenize(docText));

    let score = 0;
    for (const token of queryTokens) {
      if (docTokens.has(token)) score += 2;
      if (doc.tags.some((tag) => tag.toLowerCase().includes(token))) score += 3;
      if (doc.content.toLowerCase().includes(token)) score += 1;
    }

    return { doc, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.doc);
}

export function formatRagContext(chunks) {
  if (!chunks.length) return "";
  return chunks.map((chunk) => `[${chunk.id}] ${chunk.content}`).join("\n\n");
}

export function searchKnowledgeBase(query, topK = 3) {
  const chunks = retrieveContext(query, topK);
  return {
    query,
    results: chunks.map((chunk) => ({
      id: chunk.id,
      content: chunk.content,
      tags: chunk.tags,
    })),
  };
}

export function getAllKnowledge() {
  return knowledgeBase;
}
