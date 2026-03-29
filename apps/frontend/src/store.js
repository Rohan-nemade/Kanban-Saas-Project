import { create } from 'zustand';


































export const useStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  organizations: [],
  currentOrganization: null,
  projects: [],
  currentProject: null,

  setUser: (user, token) => {
    if (token) localStorage.setItem('token', token);else
    localStorage.removeItem('token');
    set({ user, token });
  },
  setOrganizations: (organizations) => set({ organizations }),
  setCurrentOrganization: (currentOrganization) => set({ currentOrganization }),
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      organizations: [],
      currentOrganization: null,
      projects: [],
      currentProject: null
    });
  }
}));