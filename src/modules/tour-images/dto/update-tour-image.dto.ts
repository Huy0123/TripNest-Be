import { PartialType } from '@nestjs/mapped-types';
import { CreateTourImageDto } from './create-tour-image.dto';

export class UpdateTourImageDto extends PartialType(CreateTourImageDto) {}
