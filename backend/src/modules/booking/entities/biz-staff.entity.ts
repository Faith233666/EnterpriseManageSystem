import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('biz_staff')
export class BizStaff {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 64 })
  name!: string;

  @Column({ name: 'store_name', type: 'varchar', length: 64 })
  storeName!: string;

  @Column({ type: 'tinyint', default: 1 })
  status!: number;

  @Column({ type: 'int', default: 0 })
  sort!: number;
}
