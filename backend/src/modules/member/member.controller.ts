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
  BatchRemoveMemberDto,
  CreateMemberDto,
  MemberQueryDto,
  UpdateMemberDto,
} from './dto/member.dto';
import { MemberService } from './member.service';

@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  /** GET /api/member/list */
  @Get('list')
  @Permissions('member:list', 'member:query')
  findPage(@Query() query: MemberQueryDto) {
    return this.memberService.findPage(query);
  }

  /** POST /api/member/batch-remove — 须放在 :id 之前 */
  @Post('batch-remove')
  @Permissions('member:remove')
  batchRemove(@Body() dto: BatchRemoveMemberDto) {
    return this.memberService.batchRemove(dto.ids);
  }

  /** GET /api/member/:id */
  @Get(':id')
  @Permissions('member:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.memberService.findOne(id);
  }

  /** POST /api/member */
  @Post()
  @Permissions('member:add')
  create(@Body() dto: CreateMemberDto) {
    return this.memberService.create(dto);
  }

  /** PUT /api/member/:id */
  @Put(':id')
  @Permissions('member:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.memberService.update(id, dto);
  }

  /** DELETE /api/member/:id */
  @Delete(':id')
  @Permissions('member:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.memberService.remove(id);
  }
}
