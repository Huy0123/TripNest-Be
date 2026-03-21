import { User } from '@/modules/users/entities/user.entity';
import { BaseEntity } from '@/common/base.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { ChatSessionStatus } from '@/enums/chat.enum';

@Entity('chat_sessions')
export class ChatSession extends BaseEntity {
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
