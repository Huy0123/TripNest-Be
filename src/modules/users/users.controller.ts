import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Req,
  Query,
  Header,
} from '@nestjs/common';
import { Message } from '@/decorators/message.decorator';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { Role } from '@/decorators/role.decorator';
import { UserRole } from '@/enums/user-role.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Role(UserRole.ADMIN)
  @Message('Lấy danh sách người dùng thành công')
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Post()
  @Role(UserRole.ADMIN)
  @Message('Tạo người dùng thành công')
  create(@Body() createUserAdminDto: CreateUserAdminDto) {
    return this.usersService.createByAdmin(createUserAdminDto);
  }

  @Get('me')
  @Role(UserRole.ADMIN, UserRole.USER)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Message('Lấy thông tin tài khoản thành công')
  getMe(@Req() req: Request) {
    const userId = (req.user as any)?.id;
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  @Role(UserRole.ADMIN, UserRole.USER)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Message('Cập nhật thông tin tài khoản thành công')
  updateMe(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    const userId = (req.user as any)?.id;
    return this.usersService.update(userId, updateUserDto);
  }

  @Patch('me/avatar')
  @Role(UserRole.ADMIN, UserRole.USER)
  @UseInterceptors(FileInterceptor('file'))
  @Message('Cập nhật ảnh đại diện thành công')
  uploadMyAvatar(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = (req.user as any)?.id;
    return this.usersService.uploadAvatar(userId, file);
  }

  @Get(':id')
  @Role(UserRole.ADMIN)
  @Message('Lấy thông tin người dùng thành công')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Role(UserRole.ADMIN)
  @Message('Cập nhật người dùng thành công')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Role(UserRole.ADMIN)
  @Message('Xóa người dùng thành công')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
