import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysMenu } from '../menu/entities/sys-menu.entity';
import { SysRole } from '../role/entities/sys-role.entity';
import { SysUser } from '../user/entities/sys-user.entity';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SysUser, SysRole, SysMenu])],
  controllers: [DashboardController],
})
export class DashboardModule {}
