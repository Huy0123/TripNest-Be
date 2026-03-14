import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  EntityManager
} from 'typeorm';
import { TourSession } from './entities/tour-session.entity';
import { Tour } from '../tours/entities/tour.entity';
import { DepartureStatus } from '@/enums/departure-status.enum';

@EventSubscriber()
export class TourSessionSubscriber implements EntitySubscriberInterface<TourSession> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return TourSession;
  }

  async afterInsert(event: InsertEvent<TourSession>) {
    await this.updateTourPriceAndDiscount(event.entity, event.manager);
  }

  async afterUpdate(event: UpdateEvent<TourSession>) {
    await this.updateTourPriceAndDiscount(event.entity as TourSession, event.manager);
  }

  async afterRemove(event: RemoveEvent<TourSession>) {
    if (event.entity) {
      await this.updateTourPriceAndDiscount(event.entity, event.manager, true);
    }
  }

  private async updateTourPriceAndDiscount(session: TourSession, manager: EntityManager, isRemoved = false) {
    if (!session) return;

    let tourId: string | undefined = session.tour?.id;

    // Nếu không có tourId (có thể do chưa load relation), hãy tìm kiếm
    if (!tourId) {
      const foundSession = await manager.findOne(TourSession, {
        where: { id: session.id },
        relations: ['tour'],
        withDeleted: true, // Quan trọng khi đã bị xóa
      });
      tourId = foundSession?.tour?.id;
    }

    if (!tourId) return;
    const upcomings = await manager
      .createQueryBuilder(TourSession, 'session')
      .leftJoin('session.tour', 'tour')
      .where('tour.id = :tourId', { tourId })
      .andWhere('session.status = :status', { status: DepartureStatus.OPEN })
      .andWhere('session.startDate >= :now', { now: new Date() })
      .getMany();

    const tour = await manager.findOne(Tour, { where: { id: tourId } });
    if (!tour) return;

    if (upcomings.length === 0) {
      return;
    }

    let minPrice = upcomings[0].adultPrice;
    let maxDiscount = upcomings[0].discount;

    for (const s of upcomings) {
      if (s.adultPrice < minPrice) minPrice = s.adultPrice;
      if (s.discount > maxDiscount) maxDiscount = s.discount;
    }

    tour.price = minPrice;
    tour.discount = maxDiscount;
    
    await manager.save(Tour, tour);
  }
}
