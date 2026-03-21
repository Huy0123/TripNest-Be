import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { TourSession } from './entities/tour-session.entity';
import { DepartureStatus } from '@/enums/departure-status.enum';
import dayjs from 'dayjs';

@Injectable()
export class TourSessionTask {
  private readonly logger = new Logger(TourSessionTask.name);

  constructor(
    @InjectRepository(TourSession)
    private readonly tourSessionRepository: Repository<TourSession>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleSessionStatusUpdates() {
    this.logger.log('Starting automated tour session status updates...');
    const now = dayjs();

    const twentyFourHoursFromNow = now.add(24, 'hour').toDate();
    await this.tourSessionRepository
      .createQueryBuilder()
      .update(TourSession)
      .set({ status: DepartureStatus.CLOSED })
      .where('status = :status', { status: DepartureStatus.OPEN })
      .andWhere('startDate <= :limit', { limit: twentyFourHoursFromNow })
      .execute();

    const currentSessions = await this.tourSessionRepository.find({
      where: {
        status: DepartureStatus.OPEN, 
        startDate: LessThanOrEqual(now.toDate()),
      },
    });

    if (currentSessions.length > 0) {
      await this.tourSessionRepository.update(
        currentSessions.map(s => s.id),
        { status: DepartureStatus.IN_PROGRESS }
      );
    }
const inProgressSessions = await this.tourSessionRepository.find({
      where: { status: DepartureStatus.IN_PROGRESS },
      relations: ['tour'],
    });

    const completedIds: string[] = [];
    for (const session of inProgressSessions) {
      const durationDays = session.tour?.duration || 1;
      const endDate = dayjs(session.startDate).add(durationDays, 'day');
      
      if (endDate.isBefore(now)) {
        completedIds.push(session.id);
      }
    }

    if (completedIds.length > 0) {
      await this.tourSessionRepository.update(completedIds, {
        status: DepartureStatus.COMPLETED,
      });
    }

    this.logger.log(`Status update task completed. Updated to COMPLETED: ${completedIds.length}`);
  }
}
