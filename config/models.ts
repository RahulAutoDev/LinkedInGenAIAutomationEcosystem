import { env } from './env.js';

export const ModelConfig = {
    primary: env.GEMINI_MODEL,
    fallback: 'gemini-1.5-pro',
    temperature: {
        topic_planner: 0.9,
        content_generator: 0.7,
        reviewer: 0.1
    }
};
