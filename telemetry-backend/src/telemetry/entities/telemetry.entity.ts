import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  Check,
} from 'typeorm';
import { Device } from '../../devices/entities/device.entity';

@Entity('telemetry')
@Index(['deviceId', 'timestamp'])  // Fast queries by device + time
@Index(['timestamp'])              // Fast time-based queries
@Index(['deviceId', 'receivedAt']) // Fast for device status checks
@Check(`"temperature" BETWEEN -50 AND 100`)  // Optional: data validation
@Check(`"humidity" BETWEEN 0 AND 100`)       // Optional: data validation
export class Telemetry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @Column('float')
  temperature: number;         
  
  @Column('float')
  current: number;             
  
  @Column('float')
  flowRate: number;             

  @Column('float', { nullable: true })
  humidity?: number;           

  @Column('float', { nullable: true })
  power?: number;              

  @Column('float', { nullable: true })
  cumulativePower?: number;   

  @Column({
    type: 'varchar',
    length: 20,
    default: 'online'
  })
  status: 'online' | 'offline' | 'warning' | 'error' | 'maintenance';

  @Column({ type: 'timestamptz' })
  timestamp: Date;              // When device recorded it

  @CreateDateColumn()
  receivedAt: Date;             // When server received it

  // ============ ADDITIONAL DATA ============
  @Column({ type: 'jsonb', nullable: true })
  tags?: Record<string, string>; // e.g., { "zone": "factory_a", "circuit": "main" }

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // e.g., { "battery": 87, "signal_strength": -65 }

  // ============ COMPUTED/ANALYSIS FIELDS ============
  @Column({ type: 'boolean', default: false })
  isAnomaly?: boolean;

  @Column('float', { nullable: true })
  anomalyScore?: number;

  @Column('float', { nullable: true })
  calculatedPower?: number;     // Calculated from current/voltage if not provided

  // ============ RELATIONSHIPS ============
  @ManyToOne(() => Device, (device) => device.telemetry, {
    onDelete: 'CASCADE', // Delete telemetry when device is deleted
  })
  device: Device;
}