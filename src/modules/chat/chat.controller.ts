import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('init')
  async createSession(@Body('userId') userId: string) {
    return await this.chatService.createSession(userId);
  }

  @Get('user/:userId')
  async getUserSessions(@Param('userId') userId: string) {
    return await this.chatService.getUserSessions(userId);
  }

  @Get('session/:sessionId')
  async getMessages(@Param('sessionId') sessionId: string) {
    return await this.chatService.getMessages(sessionId);
  }
}
