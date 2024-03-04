import { Router } from 'express';

import applicationRoutes from './application';

const routes = Router();

routes.use('/applications', applicationRoutes);

export default routes;
