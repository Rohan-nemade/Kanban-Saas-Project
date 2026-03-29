import React, { useEffect, useState } from 'react';
import { taskApi } from '../api';
import { X, MessageSquare, Send } from 'lucide-react';

export default function TaskModal({ taskId, onClose, onUpdated }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (!taskId) return;
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true); // 🔥 IMPORTANT FIX

      const res = await taskApi.get(`/${taskId}`);

      const t = res.data?.task;

      if (!t) {
        onClose();
        return;
      }

      setTask({
        ...t,
        comments: Array.isArray(t.comments) ? t.comments : []   // 🔥 FIX
      });

      setTitle(t.title || '');
      setDescription(t.description || '');
      setPriority(t.priority || 'MEDIUM');

    } catch (e) {
      console.error(e);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await taskApi.patch(`/${taskId}`, { title, description, priority });
      onUpdated();
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await taskApi.post(`/${taskId}/comments`, { content: newComment });
      setNewComment('');
      fetchTask();
    } catch (e) {
      console.error(e);
    }
  };

  // 🔥 CRITICAL SAFE GUARD
  if (loading || !task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-card w-full max-w-2xl rounded-xl p-8 shadow-xl text-center">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-border">

        {/* HEADER */}
        <div className="flex justify-between items-center p-5 border-b border-border">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1 w-full mr-4"
          />

          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 p-6 grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">

            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full border px-3 py-2 text-sm"
              />
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <MessageSquare size={16} /> Comments
              </h3>

              <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 border px-3 py-2 text-sm"
                />
                <button className="px-3 py-2 bg-black text-white rounded">
                  <Send size={14} />
                </button>
              </form>

              <div className="space-y-3">
                {(task.comments || []).map((c) => (
                  <div key={c.id} className="text-sm border p-2 rounded">
                    {c.content}
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-4">
            <div>
              <label className="text-xs">Status</label>
              <div className="text-sm font-medium">
                {task.status ? task.status.replace('_', ' ') : ''}
              </div>
            </div>

            <div>
              <label className="text-xs">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border px-2 py-1"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleUpdate} className="bg-black text-white px-3 py-1 rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}