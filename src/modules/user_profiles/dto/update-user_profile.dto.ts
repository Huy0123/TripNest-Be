import { PartialType } from '@nestjs/mapped-types';
import { CreateUserProfileDto } from './create-user_profile.dto';

export class UpdateUserProfileDto extends PartialType(CreateUserProfileDto) {}
