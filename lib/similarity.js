import { pipeline, env } from '@huggingface/transformers';
import { cos_sim } from '@huggingface/transformers';

class Similarity {
    static task = 'feature-extraction';
    //static model = 'all-MiniLM-L6-v2';
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

async function calcEmbeddings(inputSents) {
    const embsSents = {};

    for (const [key, val] of Object.entries(inputSents)) {
        if (key === 'sent_orig') {
            const embedding = await generateEmbedding(val);
            embsSents.orig = embedding;
            //console.log(`${val}: ${embedding.slice(0,3)}…`);
        }
        else if (key === 'sent_resp') {
            const sents = val;
            const emb_resp = [];
    
            for (const sent of sents) {
                const embedding = await generateEmbedding(sent);
                emb_resp.push(embedding);
                //console.log(`${sent}: ${embedding.slice(0,3)}…`);
            }
    
            embsSents.resp = emb_resp;
        }
    }

    return embsSents;
}

function calcSims(embsSents) {
    const orig = embsSents.orig;
    //console.log(`orig: ${orig.slice(0,3)}…`);

    for (const resp of embsSents.resp) {
        const p = cos_sim(orig, resp);
        console.log(p);
        //console.log(`resp: ${orig.slice(0,3)}…`);
    }
}

function calculateSimilarity(vec1, vec2) {
    const sim = cos_sim(vec1, vec2);
    return sim;
}
// const inputSents = {
//     sent_orig: 'What are the pathogens of foo and bar?',
//     sent_resp: [
//         'Bar and foo are caused by which pathogens?',
//         'What is the capital of Canada?',
//         'What causes foo and bar?',
//         'Name the foo and bar pathogens?'
//     ]
// }

// const embsSents = await calcEmbeddings(inputSents);
// calcSims(embsSents);

export { generateEmbedding, calculateSimilarity }