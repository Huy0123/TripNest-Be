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
  @Message('Users retrieved successfully')
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Post()
  @Role(UserRole.ADMIN)
  create(@Body() createUserAdminDto: CreateUserAdminDto) {
    return this.usersService.createByAdmin(createUserAdminDto);
  }

  @Get('me')
  @Role(UserRole.ADMIN, UserRole.USER)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  getMe(@Req() req: Request) {
    const userId = (req.user as any)?.id;
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  @Role(UserRole.ADMIN, UserRole.USER)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  updateMe(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = (req.user as any)?.id;
    return this.usersService.update(userId, updateUserDto);
  }

  @Get(':id')
  @Role(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Role(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/avatar')
  @Role(UserRole.ADMIN, UserRole.USER)
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(id, file);
  }

  @Delete(':id')
  @Role(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
