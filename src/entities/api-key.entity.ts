import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity()
export class ApiKey extends BaseEntity {
  @Column({ unique: true })
  key: string;

  @Column()
  name: string;

  @Column('simple-array')
  permissions: string[];

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isRevoked: boolean;

  @ManyToOne(() => User, (user) => user.apiKeys)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;
}
