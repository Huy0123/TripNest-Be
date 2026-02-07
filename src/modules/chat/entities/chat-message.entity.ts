import { AbstractEntity } from '@/common/abstract.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { ChatSession } from './chat-session.entity';

export enum ChatSender {
  USER = 'USER',
  BOT = 'BOT',
  ADMIN = 'ADMIN',
}

@Entity('chat_messages')
export class ChatMessage extends AbstractEntity {
  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: ChatSender })
  sender: ChatSender;

  @Column({ nullable: true })
  metadata: string;

  @ManyToOne(() => ChatSession, (session) => session.messages, {
    onDelete: 'CASCADE',
  })
  session: ChatSession;
}
