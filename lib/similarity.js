import { pipeline, cos_sim, env } from '@huggingface/transformers';

class Embedding {
    static task = 'feature-extraction';
    static model = 'Supabase/gte-small';
    static instance = null;

    static async getInstance(progress_callback = null) {

        if (this.instance === null) {
            // NOTE: Uncomment this to change the cache directory
            // env.cacheDir = './.cache';
  
            this.instance = pipeline(
                this.task, 
                this.model, 
                { progress_callback, dtype: "fp32" }
            );
        }
  
      return this.instance;
    }
}

async function generateEmbedding(text) {
    const embedding = await Embedding.getInstance();
    const response = await embedding(text, {
        pooling: "mean",
        normalize: true,
    });
    
    return Array.from(response.data);
}

function calculateSimilarity(emb1, emb2, similarityThreshold) {
    const similarity = cos_sim(emb1, emb2);

    if (similarity >= similarityThreshold) {
        return similarity;
    }

    return false;
}

export { generateEmbedding, calculateSimilarity }