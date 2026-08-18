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
  CreateRoleDto,
  RoleQueryDto,
  UpdateRoleDto,
  UpdateRoleStatusDto,
} from './dto/role.dto';
import { RoleService } from './role.service';

@Controller('system/role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /** GET /api/system/role/list */
  @Get('list')
  @Permissions('sys:role:list', 'sys:role:query')
  findPage(@Query() query: RoleQueryDto) {
    return this.roleService.findPage(query);
  }

  /** GET /api/system/role/options — 下拉选项（用户分配角色用） */
  @Get('options')
  @Permissions('sys:role:query', 'sys:user:add', 'sys:user:edit')
  findOptions() {
    return this.roleService.findOptions();
  }

  /** GET /api/system/role/:id */
  @Get(':id')
  @Permissions('sys:role:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findOne(id);
  }

  /** POST /api/system/role */
  @Post()
  @Permissions('sys:role:add')
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  /** PUT /api/system/role/:id */
  @Put(':id')
  @Permissions('sys:role:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, dto);
  }

  /** DELETE /api/system/role/:id */
  @Delete(':id')
  @Permissions('sys:role:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.remove(id);
  }

  /** PATCH /api/system/role/:id/status */
  @Patch(':id/status')
  @Permissions('sys:role:edit')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleStatusDto,
  ) {
    return this.roleService.updateStatus(id, dto.status);
  }
}
