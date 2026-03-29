import { db } from '@jiraclone/database';
import { z } from '@jiraclone/shared';

const addCommentSchema = z.object({
  content: z.string().min(1)
});

// ================= CREATE TASK =================
export const createTask = async (req, res) => {
  try {
    const { title, projectId, status } = req.body;
    const userId = req.user.userId;

    // 🔥 CHECK ACCESS
    const [access] = await db.execute(
      `SELECT p.id
       FROM projects p
       JOIN organization_members om 
       ON p.organization_id = om.organization_id
       WHERE p.id = ? AND om.user_id = ?`,
      [projectId, userId]
    );

    if (!access.length) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const [result] = await db.execute(
      `INSERT INTO tasks 
       (title, project_id, created_by, status, priority, \`order\`)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, projectId, userId, status || "TODO", "MEDIUM", 1000]
    );

    res.status(201).json({
      task: {
        id: result.insertId,
        title,
        project_id: projectId,
        status: status || "TODO"
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= GET TASKS =================
export const getTasksByProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectId = req.query.projectId;

    const [rows] = await db.execute(
      `SELECT t.*
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE om.user_id = ? AND t.project_id = ?
       ORDER BY \`order\` ASC`,
      [userId, projectId]
    );

    res.status(200).json({ tasks: rows });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= UPDATE TASK =================
export const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.userId;
    const { description, priority } = req.body;

    // 🔥 CHECK ACCESS
    const [access] = await db.execute(
      `SELECT t.id
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE t.id = ? AND om.user_id = ?`,
      [taskId, userId]
    );

    if (!access.length) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await db.execute(
      `UPDATE tasks
       SET description = ?, priority = ?
       WHERE id = ?`,
      [description || "", priority || "MEDIUM", taskId]
    );

    const [rows] = await db.execute(
      `SELECT * FROM tasks WHERE id = ?`,
      [taskId]
    );

    res.status(200).json({ task: rows[0] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= UPDATE STATUS =================
export const updateTaskStatus = async (req, res) => {
  try {
    const { status, order } = req.body;
    const taskId = req.params.id;
    const userId = req.user.userId;

    const [access] = await db.execute(
      `SELECT t.id
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE t.id = ? AND om.user_id = ?`,
      [taskId, userId]
    );

    if (!access.length) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await db.execute(
      `UPDATE tasks 
       SET status = ?, \`order\` = ?
       WHERE id = ?`,
      [status, order, taskId]
    );

    res.status(200).json({ success: true });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= DELETE TASK =================
export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.userId;

    const [access] = await db.execute(
      `SELECT t.id
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE t.id = ? AND om.user_id = ?`,
      [taskId, userId]
    );

    if (!access.length) {
      return res.status(403).json({ error: "Not authorized to delete this task" });
    }

    await db.execute(`DELETE FROM tasks WHERE id = ?`, [taskId]);

    res.status(200).json({ message: 'Task deleted successfully ✅' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= GET SINGLE TASK =================
export const getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.userId;

    // Check access
    const [access] = await db.execute(
      `SELECT t.*
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE t.id = ? AND om.user_id = ?`,
      [taskId, userId]
    );

    if (!access.length) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const task = access[0];

    // Fetch comments
    const [comments] = await db.execute(
      `SELECT id, message as content, sender_id as authorId, createdAt 
       FROM task_messages 
       WHERE task_id = ? 
       ORDER BY createdAt ASC`,
      [taskId]
    );

    task.comments = comments;
    res.status(200).json({ task });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= ADD COMMENT =================
export const addComment = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.userId;
    const { content } = addCommentSchema.parse(req.body);

    // Check access
    const [access] = await db.execute(
      `SELECT t.id
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE t.id = ? AND om.user_id = ?`,
      [taskId, userId]
    );

    if (!access.length) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const [result] = await db.execute(
      `INSERT INTO task_messages (task_id, sender_id, message)
       VALUES (?, ?, ?)`,
      [taskId, userId, content]
    );

    res.status(201).json({
      comment: {
        id: result.insertId,
        content
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};