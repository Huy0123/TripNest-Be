import { PartialType } from '@nestjs/mapped-types';
import { CreateTourDetailDto } from './create-tour-detail.dto';

export class UpdateTourDetailDto extends PartialType(CreateTourDetailDto) {}
