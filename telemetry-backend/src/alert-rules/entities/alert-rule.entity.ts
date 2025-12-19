import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AlertSeverity } from '../../../utils/enums/alertStatus.enum';
@Entity('alert_rules')
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

@Column({ unique: true })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('jsonb') // Store conditions as JSON
  conditions: string; // e.g., '[{"metric": "temperature", "operator": "gt", "value": 40}, ...]'

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM
  })
  severity: AlertSeverity;

  @Column({ default: 30 })
  cooldownMinutes: number; // Prevent alert spam

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  deviceType?: string; // Apply to specific device types

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}