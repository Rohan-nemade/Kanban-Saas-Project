import { Router } from 'express';
import { requireAuth } from '@jiraclone/shared';
import {
  createProject,
  getProjects,
  getProjectById,
  deleteProject,
  verifyProjectKey
} from './controllers.js';

const router = Router();

router.use(requireAuth);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/:id/verify', verifyProjectKey);
router.delete('/:id', deleteProject);

export default router;