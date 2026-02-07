import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(createLocationDto: CreateLocationDto): Promise<Location> {
    try {
      const location = this.locationRepository.create(createLocationDto);
      return await this.locationRepository.save(location);
    } catch (error) {
      throw new BadRequestException(
        'Failed to create location: ' + error.message,
      );
    }
  }

  async findAll(): Promise<Location[]> {
    return await this.locationRepository.find();
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locationRepository.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  async update(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<Location> {
    const location = await this.findOne(id);
    Object.assign(location, updateLocationDto);

    try {
      return await this.locationRepository.save(location);
    } catch (error) {
      throw new BadRequestException(
        'Failed to update location: ' + error.message,
      );
    }
  }

  async remove(id: string): Promise<void> {
    const location = await this.findOne(id);
    try {
      await this.locationRepository.remove(location);
    } catch (error) {
      throw new BadRequestException(
        'Failed to delete location: ' + error.message,
      );
    }
  }

  async findByCountry(country: string): Promise<Location[]> {
    return await this.locationRepository.find({
      where: { country },
      order: { city: 'ASC' },
    });
  }

  async search(keyword: string): Promise<Location[]> {
    return await this.locationRepository
      .createQueryBuilder('location')
      .where(
        'location.city ILIKE :keyword OR location.country ILIKE :keyword OR location.province ILIKE :keyword',
        {
          keyword: `%${keyword}%`,
        },
      )
      .andWhere('location.isActive = :isActive', { isActive: true })
      .orderBy('location.city', 'ASC')
      .getMany();
  }
}
