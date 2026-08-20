import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BizServiceItem } from './biz-service-item.entity';
import { BizStaff } from './biz-staff.entity';

/**
 * 预约状态：1待服务 2已完成 3已取消 4已过期
 */
@Entity('biz_appointment')
export class BizAppointment {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'order_no', type: 'varchar', length: 32, unique: true })
  orderNo!: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 64 })
  customerName!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ name: 'service_id', type: 'bigint', unsigned: true })
  serviceId!: number;

  @Column({ name: 'staff_id', type: 'bigint', unsigned: true })
  staffId!: number;

  @Column({ name: 'appoint_date', type: 'date' })
  appointDate!: string;

  @Column({ name: 'slot_start', type: 'char', length: 5 })
  slotStart!: string;

  @Column({ name: 'slot_end', type: 'char', length: 5 })
  slotEnd!: string;

  @Column({ type: 'tinyint', default: 1 })
  status!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark!: string | null;

  @Column({ name: 'cancel_reason', type: 'varchar', length: 200, nullable: true })
  cancelReason!: string | null;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelledAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => BizServiceItem, { eager: true })
  @JoinColumn({ name: 'service_id' })
  service!: BizServiceItem;

  @ManyToOne(() => BizStaff, { eager: true })
  @JoinColumn({ name: 'staff_id' })
  staff!: BizStaff;
}
