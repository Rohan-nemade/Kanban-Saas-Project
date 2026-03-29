import { Router } from 'express';
import { requireAuth } from '@jiraclone/shared';
import {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment
} from './controllers.js';

const router = Router();

router.use(requireAuth);

router.post('/', createTask);
router.get('/', getTasksByProject);
router.get('/:id', getTaskById);
router.patch('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.post('/:id/comments', addComment);
router.delete('/:id', deleteTask);

export default router;