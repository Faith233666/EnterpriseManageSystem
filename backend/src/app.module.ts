import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { MenuModule } from './modules/menu/menu.module';
import { SysMenu } from './modules/menu/entities/sys-menu.entity';
import { RoleModule } from './modules/role/role.module';
import { SysRole } from './modules/role/entities/sys-role.entity';
import { SysUser } from './modules/user/entities/sys-user.entity';
import { UserModule } from './modules/user/user.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MemberModule } from './modules/member/member.module';
import { BizMember } from './modules/member/entities/biz-member.entity';
import { BookingModule } from './modules/booking/booking.module';
import { BizAppointment } from './modules/booking/entities/biz-appointment.entity';
import { BizServiceItem } from './modules/booking/entities/biz-service-item.entity';
import { BizStaff } from './modules/booking/entities/biz-staff.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', 'root'),
        database: config.get<string>('DB_DATABASE', 'enterprise_manage'),
        entities: [
          SysUser,
          SysRole,
          SysMenu,
          BizMember,
          BizAppointment,
          BizServiceItem,
          BizStaff,
        ],
        // 生产环境请关闭 synchronize，改用迁移
        synchronize: false,
        timezone: '+08:00',
        charset: 'utf8mb4',
        extra: {
          charset: 'utf8mb4_unicode_ci',
        },
      }),
    }),
    AuthModule,
    UserModule,
    RoleModule,
    MenuModule,
    DashboardModule,
    MemberModule,
    BookingModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
