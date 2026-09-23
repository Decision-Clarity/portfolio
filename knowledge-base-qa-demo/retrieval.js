// Lexical (keyword) retrieval only — deliberately no embeddings or vector
// search. See the capability note on the page and the README for why.

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being", "to",
  "of", "in", "on", "for", "and", "or", "do", "does", "did", "how", "what",
  "when", "where", "why", "which", "who", "whom", "this", "that", "these",
  "those", "i", "you", "he", "she", "it", "we", "they", "my", "your", "his",
  "her", "its", "our", "their", "can", "could", "should", "would", "will",
  "shall", "with", "about", "if", "not", "have", "has", "had", "from", "as",
  "at", "by", "up", "out", "so", "me", "him", "them", "us", "there",
]);

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (word) => word.length > 1 && !STOPWORDS.has(word)
  );
}

// Flattens the doc/section corpus into scorable chunks, one per section.
export function buildChunks(corpus) {
  return corpus.flatMap((doc) =>
    doc.sections.map((section) => ({
      docId: doc.docId,
      docTitle: doc.docTitle,
      sectionTitle: section.sectionTitle,
      text: section.text,
      tokens: tokenize(`${doc.docTitle} ${section.sectionTitle} ${section.text}`),
    }))
  );
}

// Term-frequency keyword overlap: how many times do the query's words show
// up in this chunk. No stemming, no synonyms, no semantic similarity.
function scoreChunk(queryTokens, chunk) {
  let score = 0;
  for (const queryToken of queryTokens) {
    for (const chunkToken of chunk.tokens) {
      if (chunkToken === queryToken) score += 1;
    }
  }
  return score;
}

// Returns the topK chunks with the highest keyword overlap, excluding any
// chunk that shares zero keywords with the question. An empty result means
// the question has no lexical overlap with the corpus at all.
export function selectTopChunks(question, chunks, topK = 4) {
  const queryTokens = tokenize(question);
  if (queryTokens.length === 0) return [];

  return chunks
    .map((chunk) => ({ chunk, score: scoreChunk(queryTokens, chunk) }))
    .filter((scored) => scored.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((scored) => scored.chunk);
}
