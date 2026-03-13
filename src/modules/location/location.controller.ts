import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationQueryDto } from './dto/location-query.dto';
import { Message } from '@/decorators/message.decorator';
import { Public } from '@/decorators/public.decorator';
import { Role } from '@/decorators/role.decorator';
import { UserRole } from '@/enums/user-role.enum';

@Controller('locations')
@UseInterceptors(ClassSerializerInterceptor)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @Role(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @Message('Location created successfully')
  async create(@Body(ValidationPipe) createLocationDto: CreateLocationDto) {
    return await this.locationService.create(createLocationDto);
  }

  @Get()
  @Public()
  @Message('Locations retrieved successfully')
  async findAll(@Query() query: LocationQueryDto) {
    return await this.locationService.findAll(query);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    const location = await this.locationService.findOne(id);
    return {
      message: 'Location retrieved successfully',
      data: location,
    };
  }

  @Patch(':id')
  @Role(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateLocationDto: UpdateLocationDto,
  ) {
    const location = await this.locationService.update(id, updateLocationDto);
    return {
      message: 'Location updated successfully',
      data: location,
    };
  }

  @Delete(':id')
  @Role(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.locationService.remove(id);
    return {
      message: 'Location deleted successfully',
    };
  }
}
