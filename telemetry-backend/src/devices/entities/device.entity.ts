import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Telemetry } from '../../telemetry/entities/telemetry.entity';

@Entity()
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  deviceId: string;

  @Column()
  type: string;

  @Column()
  location: string;

  @Column()
  secretKey: string;

  @Column()
  isActive: boolean;
  @CreateDateColumn()
  lastSeen: Date;

  @OneToMany(() => Telemetry, (telemetry) => telemetry.device)
  telemetry: Telemetry[];

  @CreateDateColumn()
  createdAt: Date;
}
