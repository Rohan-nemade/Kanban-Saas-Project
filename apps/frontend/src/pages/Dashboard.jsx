import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { orgApi, projectApi } from '../api';
import { LogOut, Plus, Building2, FolderKanban, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const { user, organizations, projects, setOrganizations, setProjects, logout } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New org state
  const [newOrgName, setNewOrgName] = useState('');

  // New proj state
  const [newProjName, setNewProjName] = useState('');
  const [newProjKey, setNewProjKey] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');

  // Add Member state
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('MEMBER');

  // Key Modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [targetProject, setTargetProject] = useState(null);
  const [enteredKey, setEnteredKey] = useState('');
  const [keyError, setKeyError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError('');
      const orgRes = await orgApi.get('/');
      const orgs = orgRes.data.organizations || [];
      setOrganizations(orgs);

      if (orgs.length > 0) {
        if (!selectedOrgId || !orgs.find(o => o.id === selectedOrgId)) {
           setSelectedOrgId(orgs[0].id);
        }
      } else {
         setSelectedOrgId('');
         setProjects([]);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard data', e);
      setError(e?.response?.data?.error || 'Failed to load organizations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOrgId) {
      projectApi.get(`/?orgId=${selectedOrgId}`).then((res) => {
         setProjects(res.data.projects || []);
      }).catch(e => {
         console.error(e);
      });
    }
  }, [selectedOrgId]);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName) return;
    try {
      setError('');
      await orgApi.post('/', { name: newOrgName });
      setNewOrgName('');
      await fetchData();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || 'Could not create organization.');
    }
  };

  const handleDeleteOrg = async (e, orgId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this organization? All projects and tasks inside will be deleted.")) {
       try {
         await orgApi.delete(`/${orgId}`);
         await fetchData();
       } catch (err) {
         setError(err?.response?.data?.error || 'Failed to delete organization');
       }
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail || !selectedOrgId) return;
    try {
      setError('');
      await orgApi.post(`/${selectedOrgId}/members`, { email: newMemberEmail, role: newMemberRole });
      setNewMemberEmail('');
      alert('Member added successfully! They can now access this organization.');
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || 'Could not add member. Make sure they are registered.');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName || !newProjKey || !selectedOrgId) return;
    try {
      setError('');
      await projectApi.post('/', {
        name: newProjName,
        key: newProjKey,
        organizationId: selectedOrgId
      });
      setNewProjName('');
      setNewProjKey('');
      // refresh projects
      const res = await projectApi.get(`/?orgId=${selectedOrgId}`);
      setProjects(res.data.projects);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || 'Could not create project.');
    }
  };

  const handleDeleteProject = async (e, projId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project? All tasks inside will be deleted.")) {
       try {
         await projectApi.delete(`/${projId}`);
         const res = await projectApi.get(`/?orgId=${selectedOrgId}`);
         setProjects(res.data.projects);
       } catch (err) {
         setError(err?.response?.data?.error || 'Failed to delete project');
       }
    }
  };

  const handleOpenProject = (proj) => {
    setTargetProject(proj);
    setEnteredKey('');
    setKeyError('');
    setVerifyModalOpen(true);
  };

  const verifyKeyAndNavigate = async (e) => {
    e.preventDefault();
    if (!enteredKey.trim() || !targetProject) return;
    try {
       setKeyError('');
       await projectApi.post(`/${targetProject.id}/verify`, { key: enteredKey });
       setVerifyModalOpen(false);
       navigate(`/project/${targetProject.id}`);
    } catch(err) {
       setKeyError('Invalid project key');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex bg-[#F4F5F7] min-h-screen flex-col">
      <header className="flex h-16 items-center border-b border-gray-200 bg-white px-6 justify-between shrink-0">
        <div className="flex items-center gap-2 font-semibold text-lg text-gray-800">
          <FolderKanban className="h-6 w-6 text-blue-600" />
          <span>JiraClone Provider</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm border px-3 py-1 rounded bg-gray-50">Welcome, <b>{user?.name || user?.email}</b></span>
          <button onClick={handleLogout} className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl auto-rows-max mx-auto w-full">
        {error &&
        <div className="md:col-span-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        }
        
        {/* Orgs Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-blue-600" />
              Organizations
            </h3>
            <ul className="space-y-2">
              {organizations.map((org) =>
              <li
                key={org.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedOrgId === org.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}
                onClick={() => setSelectedOrgId(org.id)}>
                
                  <span className="font-medium text-sm text-gray-800">{org.name}</span>
                  <button onClick={(e) => handleDeleteOrg(e, org.id)} className="text-gray-400 hover:text-red-600" title="Delete Organization">
                     <Trash2 className="h-4 w-4"/>
                  </button>
                </li>
              )}
              {organizations.length === 0 && <span className="text-sm text-gray-500">No organizations found.</span>}
            </ul>

            <div className="mt-6 pt-4 border-t">
              <form onSubmit={handleCreateOrg} className="flex gap-2">
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="New Org Name"
                  className="flex-1 rounded-md border text-sm px-3 py-2 outline-none focus:border-blue-500" />
                
                <button type="submit" className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors">
                  <Plus className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Projects Area */}
        <div className="md:col-span-3 space-y-6">
          {selectedOrgId ?
          <div className="bg-white border rounded-xl p-6 shadow-sm min-h-[400px]">
              <h3 className="font-semibold text-xl flex items-center gap-2 mb-6">
                <FolderKanban className="h-6 w-6 text-blue-600" />
                Projects
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {projects.map((proj) =>
                  <div
                    key={proj.id}
                    onClick={() => handleOpenProject(proj)}
                    className="p-5 rounded-xl border bg-[#F8F9FA] hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex justify-between items-start">
                    
                    <div>
                      <div className="font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">{proj.name}</div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span> SaaS App
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => handleDeleteProject(e, proj.id)} 
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Delete Project">
                       <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
              )}
                {projects.length === 0 && <span className="text-sm text-gray-500 col-span-full">No projects found in this organization. Create one below.</span>}
              </div>

              <div className="border border-dashed border-gray-300 rounded-xl p-5 bg-gray-50/50 mt-auto">
                <h4 className="font-medium mb-3 text-gray-700">Create New Project</h4>
                <form onSubmit={handleCreateProject} className="flex gap-3 items-end max-w-2xl">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Project Name</label>
                    <input
                      type="text"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      placeholder="e.g. Website Overhaul"
                      className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Access Password (Project Key)</label>
                    <input
                      type="password"
                      value={newProjKey}
                      onChange={(e) => setNewProjKey(e.target.value)}
                      placeholder="Secret Key"
                      className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm h-[38px]">
                    Create Project
                  </button>
                </form>
              </div>

              {/* Add Member Section */}
              <div className="border border-dashed border-gray-300 rounded-xl p-5 bg-gray-50/50 mt-4">
                <h4 className="font-medium mb-3 text-gray-700">Add Team Member</h4>
                <form onSubmit={handleAddMember} className="flex gap-3 items-end max-w-2xl">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">User Email</label>
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div className="w-40">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Role</label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-blue-500 outline-none">
                      <option value="MEMBER">Member</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <button type="submit" className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition-colors font-medium text-sm h-[38px]">
                    Invite
                  </button>
                </form>
              </div>
            </div> :

          <div className="bg-white border rounded-xl p-10 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
              <Building2 className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="font-semibold text-xl text-gray-800">Select or Create an Organization</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">You need an active organization workspace to view or create projects.</p>
            </div>
          }
        </div>
      </main>

      {/* VERIFY KEY MODAL */}
      {verifyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-white rounded-xl shadow-xl p-6 w-[400px]">
              <h3 className="text-xl font-bold mb-2">Access Project</h3>
              <p className="text-sm text-gray-600 mb-4">
                 You are trying to open <b>{targetProject?.name}</b>. Please enter the project access key (password) to continue.
              </p>
              
              <form onSubmit={verifyKeyAndNavigate}>
                 {keyError && <div className="text-red-500 text-xs mb-2">{keyError}</div>}
                 <input 
                   type="password" 
                   value={enteredKey} 
                   onChange={(e) => setEnteredKey(e.target.value)}
                   autoFocus
                   placeholder="Enter project key" 
                   className="w-full border px-3 py-2 rounded mb-4 outline-none focus:border-blue-500"
                 />
                 <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setVerifyModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Open Project</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}