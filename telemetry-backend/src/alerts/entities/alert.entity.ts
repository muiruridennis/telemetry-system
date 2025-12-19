import { AlertSeverity, AlertStatus } from './../../../utils/enums/alertStatus.enum';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Telemetry } from '../../telemetry/entities/telemetry.entity';
import { Device } from '../../devices/entities/device.entity'; // Add this import



@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string; 

  @Column()
  deviceId: string; 

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM
  })
  severity: AlertSeverity;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE
  })
  status: AlertStatus;

  @Column({ nullable: true })
  source: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column('jsonb', { nullable: true })
  conditions: Record<string, any>;

  @Column('jsonb', { nullable: true })
  data: Record<string, any>; // ✅ ADD THIS FIELD

  @Column({ name: 'triggered_at' })
  triggeredAt: Date;

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'acknowledged_at', nullable: true })
  acknowledgedAt: Date;

  @Column({ name: 'acknowledged_by', nullable: true })
  acknowledgedBy: string;

  @ManyToOne(() => Telemetry, { nullable: true })
  @JoinColumn({ name: 'telemetry_source' })
  telemetrySource: Telemetry;

  // ✅ OPTIONAL: Add device relation
  @ManyToOne(() => Device, { nullable: true })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'is_silenced', default: false })
  isSilenced: boolean;

  @Column({ name: 'silence_reason', nullable: true })
  silenceReason: string;

  @Column({ name: 'silence_expires_at', nullable: true })
  silenceExpiresAt: Date;
}