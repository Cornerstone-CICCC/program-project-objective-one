import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import messageService from '../services/message.service';
import { Trade } from '../models/trade.model';

export const setupSockets = (io: Server) => {
  // Socket auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided.'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  // Handle connections
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user.id;
    console.log(`User conneted to sockets: ${userId}`);

    // Join a chat room (Trade ID)
    socket.on('join_trade', async (trade_id: string) => {
      try {
        // Security check
        const trade = await Trade.findById(trade_id);
        if (!trade)
          return socket.emit('error', {
            message: 'Trade not found.',
          });

        const isParticipant =
          trade.initiator_id.toString() === userId || trade.receiver_id.toString() === userId;

        if (isParticipant) {
          socket.join(trade_id);
          console.log(`User ${userId} joined room: ${trade_id}`);
        } else {
          socket.emit('error', {
            message: 'Not authorized to join this chat.',
          });
        }
      } catch (err) {
        console.error('Room join error:', err);
      }
    });

    // Handle incoming messages
    socket.on('send_message', async (data: { trade_id: string; content: string }) => {
      try {
        // Save it to MongoDB
        const savedMessage = await messageService.createMessage(userId, {
          trade_id: new mongoose.Types.ObjectId(data.trade_id) as any,
          content: data.content,
        });

        // Broadcast the fully populated message to everyone in the room (including the sender)
        io.to(data.trade_id).emit('receive_message', savedMessage);
      } catch (err: any) {
        socket.emit('error', {
          message: err.message,
        });
      }
    });

    // Handle editing messages
    socket.on(
      'edit_message',
      async (data: { message_id: string; trade_id: string; content: string }) => {
        try {
          // Update to DB
          const updatedMessage = await messageService.updateMessage(
            data.message_id,
            userId,
            data.content,
          );

          // Tell everyone in the room that a message changed, and send the new version
          io.to(data.trade_id).emit('message_updated', updatedMessage);
        } catch (err: any) {
          socket.emit('error', {
            message: err.message,
          });
        }
      },
    );

    // Handle deleting messages
    socket.on('delete_message', async (data: { message_id: string; trade_id: string }) => {
      try {
        // Delete from DB
        await messageService.deleteMessage(data.message_id, userId);

        // Tell everyone in the room which message ID needs to be removed from their screens
        io.to(data.trade_id).emit('message_deleted', {
          message_id: data.message_id,
        });
      } catch (err: any) {
        socket.emit('error', {
          message: err.message,
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });
};
