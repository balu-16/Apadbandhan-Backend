import handler from '../src/vercel';

// Vercel treats files under /api as serverless entrypoints.
// We reuse the Nest+Express handler defined in src/vercel.
export default handler;

