import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
// import { WsJwtGuard } from '@/guards/ws-jwt.guard'; // Assume we have or will need a WS guard, but for now strict to plan. Plan didn't mention WS Guard but ideally we should.
// For now I will proceed without Auth Guard on Gateway or assume generic connection handling.
// The user asked for "function chat using websocket", usually implies auth.
// But I'll stick to basic features first.

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*', // Configure as needed
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    // Extract user token and validate if needed
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.join(roomId);
    console.log(`Client ${client.id} joined room ${roomId}`);
    return { event: 'joinedRoom', data: roomId };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; content: string; sender: string }, // sender should ideally come from auth
  ) {
    const savedMessage = await this.chatService.saveMessage(
      payload.roomId,
      payload.content,
      payload.sender,
    );
    this.server.to(payload.roomId).emit('newMessage', savedMessage);
    return savedMessage;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; isTyping: boolean },
  ) {
    client.to(payload.roomId).emit('typing', payload);
  }
}
