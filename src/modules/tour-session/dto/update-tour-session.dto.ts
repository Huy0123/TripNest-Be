import { PartialType } from '@nestjs/mapped-types';
import { CreateTourSessionDto } from './create-tour-session.dto';

export class UpdateTourSessionDto extends PartialType(CreateTourSessionDto) {}
