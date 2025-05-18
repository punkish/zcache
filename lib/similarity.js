import { pipeline, cos_sim, env } from '@huggingface/transformers';

class Similarity {
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
    const comparator = await Similarity.getInstance();
    const response = await comparator(text, {
        pooling: "mean",
        normalize: true,
    });
    
    const embedding = Array.from(response.data);
    return embedding;
}

function calculateSimilarity(vec1, vec2) {
    const sim = cos_sim(vec1, vec2);
    return sim;
}

export { generateEmbedding, calculateSimilarity }