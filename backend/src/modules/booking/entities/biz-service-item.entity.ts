import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('biz_service_item')
export class BizServiceItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 64 })
  name!: string;

  @Column({ type: 'int', default: 60 })
  duration!: number;

  @Column({ type: 'tinyint', default: 1 })
  status!: number;

  @Column({ type: 'int', default: 0 })
  sort!: number;
}
