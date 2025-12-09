import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @Column()
  type: string;

  @Column('float')
  value: number;

  @Column('float')
  limit: number;

  @Column()
  message: string;

  @Column({ default: 'MEDIUM' })
  severity: string;

  @Column({ default: false })
  resolved: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
