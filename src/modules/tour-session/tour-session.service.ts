import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CreateTourSessionDto } from './dto/create-tour-session.dto';
import { UpdateTourSessionDto } from './dto/update-tour-session.dto';
import { TourSession } from './entities/tour-session.entity';
import { Tour } from '../tours/entities/tour.entity';
import { DepartureStatus } from 'src/enums/departure-status.enum';

@Injectable()
export class TourSessionService {
  constructor(
    @InjectRepository(TourSession)
    private readonly tourSessionRepository: Repository<TourSession>,
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,
  ) {}

  async create(
    createTourSessionDto: CreateTourSessionDto,
  ): Promise<TourSession> {
    // Kiểm tra tour có tồn tại không
    const tour = await this.tourRepository.findOne({
      where: { id: createTourSessionDto.tourId },
    });
    if (!tour) {
      throw new NotFoundException(
        `Tour with ID ${createTourSessionDto.tourId} not found`,
      );
    }

    // Kiểm tra ngày bắt đầu không được trong quá khứ
    const startDate = new Date(createTourSessionDto.startDate);
    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    try {
      const tourSession = this.tourSessionRepository.create({
        ...createTourSessionDto,
        tour,
        startDate,
      });
      return await this.tourSessionRepository.save(tourSession);
    } catch (error) {
      throw new BadRequestException(
        'Failed to create tour session: ' + error.message,
      );
    }
  }

  async findAll(): Promise<TourSession[]> {
    return await this.tourSessionRepository.find({
      relations: ['tour'],
      order: { startDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<TourSession> {
    const tourSession = await this.tourSessionRepository.findOne({
      where: { id },
      relations: ['tour', 'bookings'],
    });

    if (!tourSession) {
      throw new NotFoundException(`Tour session with ID ${id} not found`);
    }

    return tourSession;
  }

  async update(
    id: string,
    updateTourSessionDto: UpdateTourSessionDto,
  ): Promise<TourSession> {
    const tourSession = await this.findOne(id);

    if (updateTourSessionDto.tourId) {
      const tour = await this.tourRepository.findOne({
        where: { id: updateTourSessionDto.tourId },
      });
      if (!tour) {
        throw new NotFoundException(
          `Tour with ID ${updateTourSessionDto.tourId} not found`,
        );
      }
      tourSession.tour = tour;
    }

    if (updateTourSessionDto.startDate) {
      const startDate = new Date(updateTourSessionDto.startDate);
      if (startDate < new Date()) {
        throw new BadRequestException('Start date cannot be in the past');
      }
      tourSession.startDate = startDate;
    }

    Object.assign(tourSession, updateTourSessionDto);

    try {
      return await this.tourSessionRepository.save(tourSession);
    } catch (error) {
      throw new BadRequestException(
        'Failed to update tour session: ' + error.message,
      );
    }
  }

  async remove(id: string): Promise<void> {
    const tourSession = await this.findOne(id);

    // Kiểm tra có booking nào không
    if (tourSession.bookedCount > 0) {
      throw new BadRequestException(
        'Cannot delete tour session with existing bookings',
      );
    }

    try {
      await this.tourSessionRepository.remove(tourSession);
    } catch (error) {
      throw new BadRequestException(
        'Failed to delete tour session: ' + error.message,
      );
    }
  }

  // Các method tiện ích
  async findByTour(tourId: string): Promise<TourSession[]> {
    return await this.tourSessionRepository.find({
      where: { tour: { id: tourId } },
      relations: ['tour'],
      order: { startDate: 'ASC' },
    });
  }

  async findAvailable(): Promise<TourSession[]> {
    return await this.tourSessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.tour', 'tour')
      .where('session.status = :status', { status: DepartureStatus.OPEN })
      .andWhere('session.startDate >= :now', { now: new Date() })
      .andWhere('session.bookedCount < session.capacity')
      .orderBy('session.startDate', 'ASC')
      .getMany();
  }

  async findUpcoming(days: number = 30): Promise<TourSession[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await this.tourSessionRepository.find({
      where: {
        startDate: MoreThanOrEqual(new Date()),
        status: DepartureStatus.OPEN,
      },
      relations: ['tour'],
      order: { startDate: 'ASC' },
    });
  }

  async updateBookedCount(sessionId: string, increment: number): Promise<void> {
    const session = await this.findOne(sessionId);
    session.bookedCount += increment;

    // Cập nhật status nếu đầy
    if (session.bookedCount >= session.capacity) {
      session.status = DepartureStatus.SOLDOUT;
    } else if (
      session.status === DepartureStatus.SOLDOUT &&
      session.bookedCount < session.capacity
    ) {
      session.status = DepartureStatus.OPEN;
    }

    await this.tourSessionRepository.save(session);
  }
}
