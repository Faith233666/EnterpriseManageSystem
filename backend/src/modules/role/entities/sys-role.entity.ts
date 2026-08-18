import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SysMenu } from '../../menu/entities/sys-menu.entity';
import { SysUser } from '../../user/entities/sys-user.entity';

@Entity('sys_role')
export class SysRole {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'role_name', type: 'varchar', length: 64 })
  roleName!: string;

  @Column({ name: 'role_key', type: 'varchar', length: 64, unique: true })
  roleKey!: string;

  @Column({ type: 'int', default: 0 })
  sort!: number;

  @Column({ type: 'tinyint', default: 1 })
  status!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt!: Date | null;

  @ManyToMany(() => SysUser, (user) => user.roles)
  users!: SysUser[];

  @ManyToMany(() => SysMenu, (menu) => menu.roles)
  @JoinTable({
    name: 'sys_role_menu',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'menu_id', referencedColumnName: 'id' },
  })
  menus!: SysMenu[];
}
