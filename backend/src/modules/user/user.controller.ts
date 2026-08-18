import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Permissions } from '../../common/decorators/auth.decorator';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UserQueryDto,
} from './dto/user.dto';
import { UserService } from './user.service';

@Controller('system/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** GET /api/system/user/list — 分页查询（需用户查询权限） */
  @Get('list')
  @Permissions('sys:user:query')
  findPage(@Query() query: UserQueryDto) {
    return this.userService.findPage(query);
  }

  /** GET /api/system/user/:id */
  @Get(':id')
  @Permissions('sys:user:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  /** POST /api/system/user */
  @Post()
  @Permissions('sys:user:add')
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  /** PUT /api/system/user/:id */
  @Put(':id')
  @Permissions('sys:user:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(id, dto);
  }

  /** DELETE /api/system/user/:id */
  @Delete(':id')
  @Permissions('sys:user:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  /** PATCH /api/system/user/:id/status — 启用/禁用 */
  @Patch(':id/status')
  @Permissions('sys:user:status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.userService.updateStatus(id, dto.status);
  }
}
