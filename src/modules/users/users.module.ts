import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { BullModule } from '@nestjs/bullmq';
import { NAME_REGISTER } from '@/enums/name-register.enum';
import { CacheModule } from '../cache/cache.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CacheModule,
    BullModule.registerQueue(
      {
        name: NAME_REGISTER.MAIL_NOTIFICATION,
      },
      {
        name: NAME_REGISTER.PAYMENT,
      },
      {
        name: NAME_REGISTER.OTP,
      },
    ),
    ProfilesModule,
    UploadModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
