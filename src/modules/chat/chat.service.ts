import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatSession, ChatSessionStatus } from './entities/chat-session.entity';
import { Repository } from 'typeorm';
import { ChatMessage, ChatSender } from './entities/chat-message.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createSession(userId: string): Promise<ChatSession> {
    // Check if there is an open session for the user
    const openSession = await this.chatSessionRepository.findOne({
      where: {
        user: { id: userId },
        status: ChatSessionStatus.OPEN,
      },
      relations: ['user'],
    });

    if (openSession) {
      return openSession;
    }

    // Create new session
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newSession = this.chatSessionRepository.create({
      user,
      status: ChatSessionStatus.OPEN,
    });

    return await this.chatSessionRepository.save(newSession);
  }

  async saveMessage(sessionId: string, content: string, sender: string): Promise<ChatMessage> {
      // Typically sender would be a userId or 'BOT'/'ADMIN'. 
      // For simplicity assuming sender is 'USER' if it matches session user, else 'ADMIN'.
      // But the payload might just send "USER" or "ADMIN" string enum.
      
      const session = await this.chatSessionRepository.findOne({where: {id: sessionId}});
      if (!session) {
          throw new NotFoundException('Session not found');
      }

      const message = this.chatMessageRepository.create({
          content,
          sender: sender as ChatSender, // Validate this properly in real app
          session,
      });

      return await this.chatMessageRepository.save(message);
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
      return await this.chatMessageRepository.find({
          where: { session: { id: sessionId } },
          order: { createdAt: 'ASC' },
      });
  }

  async getUserSessions(userId: string): Promise<ChatSession[]> {
      return await this.chatSessionRepository.find({
          where: { user: { id: userId } },
          order: { updatedAt: 'DESC' },
      });
  }
}
