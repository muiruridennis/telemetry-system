import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Telemetry } from '../../telemetry/entities/telemetry.entity';

@Entity()
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
  
  @Column({ nullable: true })
    refreshToken: string;
}
