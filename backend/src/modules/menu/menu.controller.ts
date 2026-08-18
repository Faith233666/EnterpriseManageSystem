import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Permissions } from '../../common/decorators/auth.decorator';
import {
  CreateMenuDto,
  MenuQueryDto,
  UpdateMenuDto,
} from './dto/menu.dto';
import { MenuService } from './menu.service';

@Controller('system/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /** GET /api/system/menu/tree — 菜单管理树 */
  @Get('tree')
  @Permissions('sys:menu:list', 'sys:menu:query')
  findTree(@Query() query: MenuQueryDto) {
    return this.menuService.findTree(query);
  }

  /** GET /api/system/menu/treeselect — 角色授权/父级选择 */
  @Get('treeselect')
  @Permissions(
    'sys:menu:query',
    'sys:role:add',
    'sys:role:edit',
    'sys:menu:add',
    'sys:menu:edit',
  )
  findTreeSelect() {
    return this.menuService.findTreeForSelect();
  }

  /** GET /api/system/menu/:id */
  @Get(':id')
  @Permissions('sys:menu:query')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const menu = await this.menuService.findOne(id);
    return {
      ...menu,
      id: Number(menu.id),
      parentId: Number(menu.parentId),
    };
  }

  /** POST /api/system/menu */
  @Post()
  @Permissions('sys:menu:add')
  create(@Body() dto: CreateMenuDto) {
    return this.menuService.create(dto);
  }

  /** PUT /api/system/menu/:id */
  @Put(':id')
  @Permissions('sys:menu:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuDto,
  ) {
    return this.menuService.update(id, dto);
  }

  /** DELETE /api/system/menu/:id */
  @Delete(':id')
  @Permissions('sys:menu:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.remove(id);
  }
}
