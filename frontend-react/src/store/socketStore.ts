import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '../services/socket';

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: () => {
    // Ya conectado: evita re-registrar listeners o abrir una segunda conexión.
    if (get().socket?.connected) return;

    const socket = getSocket();
    socket.off('connect');
    socket.off('disconnect');
    socket.on('connect', () => set({ isConnected: true }));
    socket.on('disconnect', () => set({ isConnected: false }));

    socket.connect();
    set({ socket });
  },

  disconnect: () => {
    disconnectSocket();
    set({ socket: null, isConnected: false });
  },
}));
