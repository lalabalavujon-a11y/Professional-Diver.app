/**
 * Custom In-Memory Vector Store Implementation
 * 
 * This is a custom implementation of an in-memory vector store for LangChain v1.
 * It stores document embeddings in memory and performs similarity search using cosine similarity.
 * 
 * @author Custom Implementation
 * @version 1.0.0
 */

import { VectorStore } from '@langchain/core/vectorstores';
import { Document, DocumentInterface } from '@langchain/core/documents';
import { EmbeddingsInterface } from '@langchain/core/embeddings';

/**
 * Calculates cosine similarity between two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Cosine similarity score between -1 and 1
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Custom in-memory vector store implementation
 * Stores document embeddings in memory and performs similarity search
 */
export class MemoryVectorStore extends VectorStore {
  private vectors: number[][] = [];
  private documents: DocumentInterface[] = [];

  constructor(embeddings: EmbeddingsInterface, dbConfig?: Record<string, any>) {
    super(embeddings, dbConfig || {});
  }

  /**
   * Returns the type identifier for this vector store
   */
  _vectorstoreType(): string {
    return 'memory';
  }

  /**
   * Adds vectors and documents to the store
   * @param vectors Array of embedding vectors
   * @param documents Array of documents corresponding to the vectors
   * @returns Promise resolving to void (no IDs needed for in-memory store)
   */
  async addVectors(
    vectors: number[][],
    documents: DocumentInterface[],
    options?: Record<string, any>
  ): Promise<string[] | void> {
    if (vectors.length !== documents.length) {
      throw new Error('Vectors and documents arrays must have the same length');
    }

    for (let i = 0; i < vectors.length; i++) {
      this.vectors.push(vectors[i]);
      this.documents.push(documents[i]);
    }
  }

  /**
   * Adds documents to the store by embedding them first
   * @param documents Array of documents to embed and add
   * @returns Promise resolving to void
   */
  async addDocuments(
    documents: DocumentInterface[],
    options?: Record<string, any>
  ): Promise<string[] | void> {
    const texts = documents.map((doc) => doc.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);
    return this.addVectors(vectors, documents, options);
  }

  /**
   * Performs similarity search using a vector query
   * @param query Vector representing the search query
   * @param k Number of similar results to return
   * @param filter Optional filter (not implemented in this simple version)
   * @returns Promise resolving to array of [document, score] tuples
   */
  async similaritySearchVectorWithScore(
    query: number[],
    k: number,
    filter?: this["FilterType"]
  ): Promise<[DocumentInterface, number][]> {
    if (this.vectors.length === 0) {
      return [];
    }

    // Calculate similarity scores for all documents
    const scores: Array<{ doc: DocumentInterface; score: number }> = [];
    
    for (let i = 0; i < this.vectors.length; i++) {
      // Apply filter if provided
      if (filter && this.documents[i].metadata) {
        let matches = true;
        // Handle filter as object (Record<string, any>) or string
        if (typeof filter === 'object' && filter !== null) {
          for (const [key, value] of Object.entries(filter)) {
            if (this.documents[i].metadata?.[key] !== value) {
              matches = false;
              break;
            }
          }
        } else if (typeof filter === 'string') {
          // Simple string filter - check if metadata contains the string
          const metadataStr = JSON.stringify(this.documents[i].metadata || {});
          if (!metadataStr.includes(filter)) {
            matches = false;
          }
        }
        if (!matches) continue;
      }

      const similarity = cosineSimilarity(query, this.vectors[i]);
      scores.push({ doc: this.documents[i], score: similarity });
    }

    // Sort by similarity score (descending) and take top k
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, k).map((item) => [item.doc, item.score] as [DocumentInterface, number]);
  }

  /**
   * Creates a MemoryVectorStore instance from an array of documents
   * @param docs Array of documents to embed and store
   * @param embeddings Embeddings instance to use
   * @param dbConfig Optional database configuration
   * @returns Promise resolving to a new MemoryVectorStore instance
   */
  static async fromDocuments(
    docs: DocumentInterface[],
    embeddings: EmbeddingsInterface,
    dbConfig?: Record<string, any>
  ): Promise<MemoryVectorStore> {
    const store = new MemoryVectorStore(embeddings, dbConfig);
    await store.addDocuments(docs);
    return store;
  }
}

