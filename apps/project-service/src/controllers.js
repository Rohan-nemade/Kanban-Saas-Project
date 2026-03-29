import { db } from '@jiraclone/database';
import { z } from '@jiraclone/shared';

const createProjectSchema = z.object({
  name: z.string().min(2),
  key: z.string().min(2),
  organizationId: z.number().int()
});

const verifyKeySchema = z.object({
  key: z.string().min(1)
});

// ================= CREATE PROJECT =================
export const createProject = async (req, res) => {
  try {
    const { name, key, organizationId } = createProjectSchema.parse(req.body);
    const userId = req.user.userId;

    // Check if the user is a manager or admin of the organization
    const [membership] = await db.execute(
      `SELECT role FROM organization_members
       WHERE user_id = ? AND organization_id = ?`,
      [userId, organizationId]
    );

    if (!membership.length || !['ADMIN', 'MANAGER'].includes(membership[0].role)) {
       return res.status(403).json({ error: 'Not authorized to create projects here' });
    }

    const [result] = await db.execute(
      `INSERT INTO projects (name, \`key\`, organization_id)
       VALUES (?, ?, ?)`,
      [name, key, organizationId]
    );

    res.status(201).json({
      project: {
        id: result.insertId,
        name,
        key,
        organizationId
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("CREATE PROJECT ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

// ================= GET PROJECTS =================
export const getProjects = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orgId = req.query.orgId;

    if (!orgId) {
       return res.status(400).json({ error: 'orgId is required' });
    }

    // Check membership
    const [membership] = await db.execute(
      `SELECT id FROM organization_members
       WHERE user_id = ? AND organization_id = ?`,
      [userId, orgId]
    );

    if (!membership.length) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }

    const [rows] = await db.execute(
      `SELECT id, name, organization_id, createdAt, updatedAt 
       FROM projects
       WHERE organization_id = ?
       ORDER BY createdAt DESC`,
      [orgId]
    );

    res.status(200).json({ projects: rows });

  } catch (error) {
    console.error("GET PROJECTS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================= GET SINGLE PROJECT =================
export const getProjectById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.id;

    const [rows] = await db.execute(
      `SELECT p.id, p.name, p.organization_id, p.createdAt, p.updatedAt 
       FROM projects p
       JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE p.id = ? AND om.user_id = ?`,
      [projectId, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Project not found or not authorized' });
    }

    res.status(200).json({ project: rows[0] });

  } catch (error) {
    console.error("GET PROJECT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================= VERIFY PROJECT KEY =================
export const verifyProjectKey = async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.id;
    const { key } = verifyKeySchema.parse(req.body);

    const [rows] = await db.execute(
      `SELECT p.id, p.\`key\`
       FROM projects p
       JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE p.id = ? AND om.user_id = ?`,
      [projectId, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Project not found or not authorized' });
    }

    if (rows[0].key !== key) {
       return res.status(401).json({ error: 'Invalid project key' });
    }

    res.status(200).json({ success: true });

  } catch (error) {
     if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error("VERIFY PROJECT ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

// ================= DELETE PROJECT =================
export const deleteProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectId = req.params.id;

    // Check if the user is a manager or admin of the organization
    const [membership] = await db.execute(
      `SELECT om.role 
       FROM organization_members om
       JOIN projects p ON p.organization_id = om.organization_id
       WHERE p.id = ? AND om.user_id = ?`,
      [projectId, userId]
    );

    if (!membership.length || !['ADMIN', 'MANAGER'].includes(membership[0].role)) {
       return res.status(403).json({ error: 'Only admins and managers can delete projects' });
    }

    await db.execute(
      `DELETE FROM projects WHERE id = ?`,
      [projectId]
    );

    res.status(200).json({ message: 'Project deleted successfully ✅' });

  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};