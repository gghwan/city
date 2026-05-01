import { create } from 'zustand';

type NavigationState = {
  isRouteLoading: boolean;
  startRouteLoading: () => void;
  stopRouteLoading: () => void;
};

export const useNavigationStore = create<NavigationState>((set) => ({
  isRouteLoading: false,
  startRouteLoading: () => set({ isRouteLoading: true }),
  stopRouteLoading: () => set({ isRouteLoading: false }),
}));
