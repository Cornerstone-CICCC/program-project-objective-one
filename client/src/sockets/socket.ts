import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../api';

class SocketService {
  public socket: Socket | null = null;

  connect(token: string) {
    if (!this.socket) {
      this.socket = io(BASE_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Global Socket Connected.');
      });

      this.socket.on('disconnect', () => {
        console.log('Global Socket Disconnected');
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket Connection Error:', err.message);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
