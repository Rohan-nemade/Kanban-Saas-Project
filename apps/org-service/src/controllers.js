import { db } from '@jiraclone/database';
import { z } from '@jiraclone/shared';

const createOrgSchema = z.object({
  name: z.string().min(2)
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).optional()
});

export const createOrganization = async (req, res) => {
  try {
    const { name } = createOrgSchema.parse(req.body);
    const userId = req.user.userId;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [orgResult] = await conn.execute(
        `INSERT INTO organizations (name, owner_id)
         VALUES (?, ?)`,
        [name, userId]
      );

      const orgId = orgResult.insertId;

      await conn.execute(
        `INSERT INTO organization_members (user_id, organization_id, role)
         VALUES (?, ?, ?)`,
        [userId, orgId, 'ADMIN']
      );

      await conn.commit();

      res.status(201).json({
        organization: { id: orgId, name }
      });

    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
};

export const getOrganizations = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await db.execute(
      `SELECT o.*
       FROM organizations o
       JOIN organization_members m ON o.id = m.organization_id
       WHERE m.user_id = ?`,
      [userId]
    );

    res.status(200).json({ organizations: rows });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrganizationMembers = async (req, res) => {
  try {
    const orgId = req.params.id;
    const userId = req.user.userId;

    const [membership] = await db.execute(
      `SELECT id FROM organization_members
       WHERE user_id = ? AND organization_id = ?`,
      [userId, orgId]
    );

    if (membership.length === 0) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }

    const [rows] = await db.execute(
      `SELECT om.*, u.id as userId, u.name, u.email
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.organization_id = ?`,
      [orgId]
    );

    res.status(200).json({ members: rows });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addMember = async (req, res) => {
  try {
    const orgId = req.params.id;
    const userId = req.user.userId;
    const { email, role } = addMemberSchema.parse(req.body);

    const [membership] = await db.execute(
      `SELECT role FROM organization_members
       WHERE user_id = ? AND organization_id = ?`,
      [userId, orgId]
    );

    if (membership.length === 0 || !['ADMIN', 'MANAGER'].includes(membership[0].role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const [targetUser] = await db.execute(
      `SELECT id, name, email FROM users WHERE email = ?`,
      [email]
    );

    if (targetUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tUser = targetUser[0];

    try {
      const [result] = await db.execute(
        `INSERT INTO organization_members (user_id, organization_id, role)
         VALUES (?, ?, ?)`,
        [tUser.id, orgId, role || 'MEMBER']
      );

      res.status(201).json({
        member: {
          id: result.insertId,
          user: tUser,
          role: role || 'MEMBER'
        }
      });

    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'User already a member' });
      }
      throw err;
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const deleteOrganization = async (req, res) => {
  try {
    const orgId = req.params.id;
    const userId = req.user.userId;

    const [org] = await db.execute(
      `SELECT owner_id FROM organizations WHERE id = ?`,
      [orgId]
    );

    if (org.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (org[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only owner can delete organization' });
    }

    await db.execute(
      `DELETE FROM organizations WHERE id = ?`,
      [orgId]
    );

    res.status(200).json({ message: 'Organization deleted successfully ✅' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};