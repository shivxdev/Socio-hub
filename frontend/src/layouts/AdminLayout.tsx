/**
 * Persistent Admin Layout Shell
 * Integrates Sidebar, Topbar, Create Task Modal, and Route Outlet.
 */
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/admin/Sidebar';
import { Topbar } from '../components/admin/Topbar';
import { CreateTaskModal } from '../components/admin/CreateTaskModal';
import { adminApi } from '../services/adminApi';
import { CreateTaskRequest } from '../types/shared';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleCreateTask = async (data: CreateTaskRequest) => {
    const res = await adminApi.createTask(data);
    setNotification(`Task #${res.data.id} "${res.data.title}" successfully created with status "pending".`);
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="admin-shell">
      {/* Persistent Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Administrative Workspace */}
      <div className="admin-main">
        <Topbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenCreateTask={() => setCreateTaskModalOpen(true)}
        />

        {notification && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: '#ecfdf5',
              borderBottom: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{notification}</span>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        <main className="admin-content">
          <Outlet context={{ onOpenCreateTask: () => setCreateTaskModalOpen(true) }} />
        </main>
      </div>

      {/* Global Create Task Modal */}
      <CreateTaskModal
        isOpen={createTaskModalOpen}
        onClose={() => setCreateTaskModalOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  );
};
