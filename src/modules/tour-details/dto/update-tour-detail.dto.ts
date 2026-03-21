import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTourDetailDto } from './create-tour-detail.dto';

export class UpdateTourDetailDto extends PartialType(OmitType(CreateTourDetailDto, ['tourId'] as const)) {}

