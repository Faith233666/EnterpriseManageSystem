import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SysRole } from '../../role/entities/sys-role.entity';

/**
 * 菜单/权限
 * menuType: 1目录 2菜单 3按钮
 * perms: 按钮权限标识，如 sys:user:add
 */
@Entity('sys_menu')
export class SysMenu {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, default: 0 })
  parentId!: number;

  @Column({ name: 'menu_name', type: 'varchar', length: 64 })
  menuName!: string;

  /** 1目录 2菜单 3按钮 */
  @Column({ name: 'menu_type', type: 'tinyint' })
  menuType!: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  path!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  component!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  redirect!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  perms!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  icon!: string | null;

  @Column({ type: 'int', default: 0 })
  sort!: number;

  @Column({ type: 'tinyint', default: 1 })
  visible!: number;

  @Column({ type: 'tinyint', default: 1 })
  status!: number;

  @Column({ name: 'is_frame', type: 'tinyint', default: 0 })
  isFrame!: number;

  @Column({ name: 'is_cache', type: 'tinyint', default: 0 })
  isCache!: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  @ManyToMany(() => SysRole, (role) => role.menus)
  roles!: SysRole[];
}
