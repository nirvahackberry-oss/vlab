import { create } from 'zustand';
import { fetchLabs, fetchSubLabs } from '../services/labService';

export const useLabStore = create((set) => ({
  labs: [],
  subLabs: {},
  isLoading: false,
  error: null,
  addLab: (lab) => set((state) => ({ labs: [...state.labs, lab] })),
  updateLab: (updatedLab) => set((state) => ({
    labs: state.labs.map((l) => l.id === updatedLab.id ? updatedLab : l)
  })),
  deleteLab: (id) => set((state) => ({
    labs: state.labs.filter((l) => l.id !== id)
  })),
  setSubLabs: (labName, labs) => set((state) => ({
    subLabs: { ...state.subLabs, [labName]: labs }
  })),
  rechargeLab: async (labId, newCredits) => {
    try {
      const { updateLabCredits } = await import('../services/labService');
      const response = await updateLabCredits(labId, newCredits);
      if (response.success) {
        set((state) => ({
          labs: state.labs.map((l) => l.id === labId ? { ...l, credits: newCredits } : l)
        }));
      }
    } catch (error) {
      console.error('Recharge error:', error);
    }
  },
  loadLabs: async () => {
    set({ isLoading: true, error: null });
  
    try {
      const [labsResponse, subLabsResponse] = await Promise.all([
        fetchLabs(),
        fetchSubLabs()
      ]);
  
      set({
        labs: Array.isArray(labsResponse?.labs)
          ? labsResponse.labs
          : [],
  
        subLabs: subLabsResponse?.subLabs || {},
  
        isLoading: false,
        error: null
      });
  
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Unable to load labs'
      });
    }
  },  loadSubLabs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchSubLabs();
      set({ subLabs: response.subLabs || {} });
    } catch (error) {
      set({ isLoading: false, error: error.message || 'Unable to load sub-labs' });
    }
  }
}));