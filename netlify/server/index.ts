// Netlify Server entrypoint: serves all /api/* routes. Static frontend is served from dist/.
import { app } from '../../server/app';

export const config = {
  path: '/api/*',
};

export default app;
