import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Device } from '../../devices/entities/device.entity';

@Entity()
@Index(['deviceId', 'createdAt'])
export class Telemetry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @Column('float')
  temperature: number;

  @Column('float', { nullable: true })
  humidity: number;

  @Column('float')
  current: number;

  @Column('float')
  flowRate: number;

  @Column('float', { nullable: true })
  power: number;

  @Column({ default: 'online' })
  status: string;

  @Column("float")
  cumulativePower: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Device, (device) => device.telemetry)
  device: Device;
}
