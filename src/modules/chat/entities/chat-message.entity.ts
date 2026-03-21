import { BaseEntity } from '@/common/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { ChatSession } from './chat-session.entity';
import { ChatSender } from '@/enums/chat.enum';

@Entity('chat_messages')
export class ChatMessage extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: ChatSender })
  sender: ChatSender;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @ManyToOne(() => ChatSession, (session) => session.messages, {
    onDelete: 'CASCADE',
  })
  session: ChatSession;
}
