import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationQueryDto } from './dto/location-query.dto';
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
      if (error.code === '23505') {
        throw new BadRequestException('location already exists');
      }
      throw new BadRequestException(
        'Failed to create location: ' + error.message,
      );
    }
  }

  async update(id: string, updateLocationDto: UpdateLocationDto): Promise<Location> {
    try {
      await this.locationRepository.update(id, updateLocationDto);
      return await this.findOne(id);
    } catch (error) {
      throw new BadRequestException(
        'Failed to update location: ' + error.message,
      );
    }
  }

  async findAll(queryDto: LocationQueryDto): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const { search, page = 1, limit = 10 } = queryDto;
    const query = this.locationRepository
      .createQueryBuilder('location')
      .loadRelationCountAndMap('location.tourCount', 'location.departureTours')
      .orderBy('location.city', 'ASC');

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('location.city ILIKE :search', { search: `%${search}%` }).orWhere(
            'location.country ILIKE :search',
            { search: `%${search}%` },
          );
        }),
      );
    }

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locationRepository.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }  

  async isDepartureLocationId(id: string) {
    const location = await this.locationRepository.findOne({ where: { id } });
    if (location) return location;
    return null;
  }

  async isDestinationLocationIds(ids: string[]) {
    const location = await this.locationRepository.find({ where: { id: In(ids) } });
    if (location) return location;
    return null;
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

}
