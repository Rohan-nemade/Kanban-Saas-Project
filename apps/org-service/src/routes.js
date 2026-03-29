import { Router } from 'express';
import { requireAuth } from '@jiraclone/shared';
import {
  createOrganization,
  getOrganizations,
  getOrganizationMembers,
  addMember,
  deleteOrganization
} from './controllers.js';

const router = Router();

router.use(requireAuth);

router.post('/', createOrganization);
router.get('/', getOrganizations);
router.get('/:id/members', getOrganizationMembers);
router.post('/:id/members', addMember);
router.delete('/:id', deleteOrganization);

export default router;