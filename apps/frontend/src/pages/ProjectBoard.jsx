import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { io } from 'socket.io-client';
import { taskApi, projectApi } from '../api';
import { ArrowLeft, MessageSquare, Plus } from 'lucide-react';
import TaskModal from '../components/TaskModal';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export default function ProjectBoard() {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeCol, setActiveCol] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);


  useEffect(() => {
    if (!projectId) return;

    loadBoard();

    const socket = io('http://localhost:4005');

    socket.emit('join_project', projectId);

    socket.on('task_updated', (updatedTask) => {
      setTasks((prev) => {
        const filtered = prev.filter((t) => t.id !== updatedTask.id);
        return [...filtered, updatedTask].sort((a, b) => a.order - b.order);
      });
    });

    socket.on('task_created', (newTask) => {
      setTasks((prev) =>
        [...prev, newTask].sort((a, b) => a.order - b.order)
      );
    });

    return () => {
      socket.emit('leave_project', projectId);
      socket.disconnect();
    };
  }, [projectId]);

  const loadBoard = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectApi.get(`/${projectId}`),
        taskApi.get(`/?projectId=${projectId}`)
      ]);

      setProject(projRes.data.project);
      setTasks(
        (tasksRes.data.tasks || []).sort((a, b) => a.order - b.order)
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e, status) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await taskApi.post('/', {
        title: newTaskTitle,
        projectId,
        status
      });

      setNewTaskTitle('');
      setActiveCol(null);
      loadBoard();
    } catch (e) {
      console.error(e);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;

    if (!destination) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    if (sourceCol === destCol && source.index === destination.index) return;

    const sourceTasks = tasks.filter((t) => t.status === sourceCol);
    const task = sourceTasks[source.index];

    if (!task) return;

    try {
      await taskApi.patch(`/${task.id}/status`, {
        status: destCol,
        order: destination.index * 1000
      });

      // 🔥 KEY FIX
      await loadBoard();

    } catch (e) {
      console.error(e);
    }
  };
  // ADD THIS FUNCTION inside ProjectBoard component

  const handleDeleteTask = async (taskId) => {
    try {
      await taskApi.delete(`/${taskId}`);

      // remove from UI instantly
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

    } catch (e) {
      console.error(e);
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-700';
      case 'HIGH': return 'bg-orange-500/20 text-orange-700';
      case 'LOW': return 'bg-green-500/20 text-green-700';
      case 'MEDIUM': return 'bg-blue-500/20 text-blue-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#F4F5F7]">
      {/* HEADER */}
      <header className="flex h-16 items-center border-b px-6 gap-4 bg-white">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-lg font-bold">{project?.name}</h1>
          <p className="text-xs text-gray-500">Key: {project?.key}</p>
        </div>
      </header>

      {/* BOARD */}
      <main className="flex-1 p-6 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 items-start">

            {COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col);

              return (
                <div key={col} className="bg-white border rounded-xl w-80 flex flex-col">

                  {/* COLUMN HEADER */}
                  <div className="p-4 flex justify-between border-b">
                    <h3 className="text-sm font-semibold">
                      {col.replace('_', ' ')}
                    </h3>
                    <span className="text-xs bg-gray-200 px-2 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>

                  <Droppable droppableId={col}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-3 min-h-[150px] ${snapshot.isDraggingOver ? 'bg-blue-50' : ''
                          }`}
                      >

                        {colTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-white border rounded-lg p-3 mb-3 ${snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'}`}
                              >

                                {/* DRAG AREA */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab"
                                  onClick={() => setSelectedTaskId(task.id)}
                                >
                                  <div className="text-sm font-medium mb-2">
                                    {task.title}
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-xs px-2 rounded bg-blue-100">
                                      {task.priority || 'MEDIUM'}
                                    </span>
                                  </div>
                                </div>

                                {/* DELETE BUTTON */}
                                <div className="flex justify-end mt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTask(task.id);
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>

                              </div>
                            )}
                          </Draggable>
                        ))}

                        {provided.placeholder}

                        {/* ADD TASK */}
                        {activeCol === col ? (
                          <form onSubmit={(e) => handleCreateTask(e, col)}>
                            <input
                              autoFocus
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              className="w-full border px-2 py-1 text-sm"
                              placeholder="Task title"
                            />
                          </form>
                        ) : (
                          <button
                            onClick={() => setActiveCol(col)}
                            className="text-sm text-gray-500 flex items-center gap-1"
                          >
                            <Plus size={14} /> Add Task
                          </button>
                        )}

                      </div>
                    )}
                  </Droppable>

                </div>
              );
            })}
          </div>
        </DragDropContext>
      </main>

      {/* MODAL */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={loadBoard}
        />
      )}
    </div>
  );
}