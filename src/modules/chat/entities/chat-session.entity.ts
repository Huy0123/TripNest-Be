import { User } from '@/modules/users/entities/user.entity';
import { AbstractEntity } from '@/common/abstract.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { ChatMessage } from './chat-message.entity';

export enum ChatSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

@Entity('chat_sessions')
export class ChatSession extends AbstractEntity {
  @Column({
    type: 'enum',
    enum: ChatSessionStatus,
    default: ChatSessionStatus.OPEN,
  })
  status: ChatSessionStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User;

  @OneToMany(() => ChatMessage, (message) => message.session, { cascade: true })
  messages: ChatMessage[];
}
