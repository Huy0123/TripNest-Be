import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { Tour } from '../tours/entities/tour.entity';
import { User } from '../users/entities/user.entity';
import { BookingStatus } from '@/enums/booking-status.enum';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}
z
  /** Tổng quan: doanh thu, booking, tour, user kèm trend so với tháng trước */
  async getOverview() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalRevenueRaw,
      totalBookings,
      totalTours,
      totalUsers,
      bookingsByStatus,
      revenueThisMonthRaw,
      revenueLastMonthRaw,
      bookingsThisMonth,
      bookingsLastMonth,
      toursThisMonth,
      toursLastMonth,
      usersThisMonth,
      usersLastMonth
    ] = await Promise.all([
      this.dataSource
        .createQueryBuilder()
        .select('SUM(p.amount)', 'total')
        .from(Payment, 'p')
        .where('p.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne(),

      this.bookingRepository.count(),

      this.tourRepository.count(),

      this.userRepository.count(),

      this.bookingRepository
        .createQueryBuilder('b')
        .select('b.status', 'status')
        .addSelect('COUNT(b.id)', 'count')
        .groupBy('b.status')
        .getRawMany(),

      // Trend data
      this.dataSource
        .createQueryBuilder()
        .select('SUM(p.amount)', 'total')
        .from(Payment, 'p')
        .where('p.status = :status', { status: PaymentStatus.COMPLETED })
        .andWhere('p."createdAt" >= :start', { start: currentMonthStart })
        .getRawOne(),
        
      this.dataSource
        .createQueryBuilder()
        .select('SUM(p.amount)', 'total')
        .from(Payment, 'p')
        .where('p.status = :status', { status: PaymentStatus.COMPLETED })
        .andWhere('p."createdAt" >= :start AND p."createdAt" < :end', { start: lastMonthStart, end: currentMonthStart })
        .getRawOne(),
        
      this.bookingRepository.createQueryBuilder('b').where('b."createdAt" >= :start', { start: currentMonthStart }).getCount(),
      this.bookingRepository.createQueryBuilder('b').where('b."createdAt" >= :start AND b."createdAt" < :end', { start: lastMonthStart, end: currentMonthStart }).getCount(),
      
      this.tourRepository.createQueryBuilder('t').where('t."createdAt" >= :start', { start: currentMonthStart }).getCount(),
      this.tourRepository.createQueryBuilder('t').where('t."createdAt" >= :start AND t."createdAt" < :end', { start: lastMonthStart, end: currentMonthStart }).getCount(),
      
      this.userRepository.createQueryBuilder('u').where('u."createdAt" >= :start', { start: currentMonthStart }).getCount(),
      this.userRepository.createQueryBuilder('u').where('u."createdAt" >= :start AND u."createdAt" < :end', { start: lastMonthStart, end: currentMonthStart }).getCount(),
    ]);

    const calculatePercentage = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number(((current - previous) / previous * 100).toFixed(1));
    };

    const revCurrent = Number(revenueThisMonthRaw?.total ?? 0);
    const revPrev = Number(revenueLastMonthRaw?.total ?? 0);

    return {
      totalRevenue: Number(totalRevenueRaw?.total ?? 0),
      revenueChange: calculatePercentage(revCurrent, revPrev),
      
      totalBookings,
      bookingsChange: calculatePercentage(bookingsThisMonth, bookingsLastMonth),
      
      totalTours,
      toursChange: toursThisMonth - toursLastMonth, // Return raw difference for tours
      
      totalUsers,
      usersChange: calculatePercentage(usersThisMonth, usersLastMonth),
      
      bookingsByStatus: bookingsByStatus.reduce(
        (acc, row) => ({ ...acc, [row.status]: Number(row.count) }),
        {} as Record<string, number>,
      ),
    };
  }

  /** Doanh thu theo tháng trong 1 năm (mặc định năm hiện tại) */
  async getRevenueByMonth(year?: number) {
    const targetYear = year ?? new Date().getFullYear();

    const rows: { month: string; revenue: string }[] =
      await this.dataSource
        .createQueryBuilder()
        .select("TO_CHAR(p.\"createdAt\", 'YYYY-MM')", 'month')
        .addSelect('SUM(p.amount)', 'revenue')
        .from(Payment, 'p')
        .where('p.status = :status', { status: PaymentStatus.COMPLETED })
        .andWhere("EXTRACT(YEAR FROM p.\"createdAt\") = :year", { year: targetYear })
        .groupBy("TO_CHAR(p.\"createdAt\", 'YYYY-MM')")
        .orderBy('month', 'ASC')
        .getRawMany();

    // Đảm bảo đủ 12 tháng (kể cả tháng 0 doanh thu)
    const map = new Map(rows.map((r) => [r.month, Number(r.revenue)]));
    let totalYearRevenue = 0;
    let peakRevenue = -1;
    let peakMonth = '';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthStr = `${targetYear}-${String(i + 1).padStart(2, '0')}`;
      const rev = map.get(monthStr) ?? 0;
      
      totalYearRevenue += rev;
      if (rev > peakRevenue && rev > 0) {
        peakRevenue = rev;
        peakMonth = monthNames[i] || '';
      }
      
      return { month: monthStr, revenue: rev };
    });

    const averageRevenue = Number((totalYearRevenue / 12).toFixed(2));

    return {
      averageRevenue,
      peakPeriod: peakMonth || 'N/A',
      data: monthlyData,
    };
  }

  /** Doanh thu theo ngày trong 1 tháng (mặc định tháng hiện tại) */
  async getRevenueByDay(year?: number, month?: number) {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth() + 1;

    const rows: { day: string; revenue: string }[] =
      await this.dataSource
        .createQueryBuilder()
        .select("TO_CHAR(p.\"createdAt\", 'YYYY-MM-DD')", 'day')
        .addSelect('SUM(p.amount)', 'revenue')
        .from(Payment, 'p')
        .where('p.status = :status', { status: PaymentStatus.COMPLETED })
        .andWhere("EXTRACT(YEAR FROM p.\"createdAt\") = :year", { year: targetYear })
        .andWhere("EXTRACT(MONTH FROM p.\"createdAt\") = :month", { month: targetMonth })
        .groupBy("TO_CHAR(p.\"createdAt\", 'YYYY-MM-DD')")
        .orderBy('day', 'ASC')
        .getRawMany();

    const map = new Map(rows.map((r) => [r.day, Number(r.revenue)]));
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    
    let totalMonthRevenue = 0;
    let peakRevenue = -1;
    let peakDay = '';

    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const dayStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      const rev = map.get(dayStr) ?? 0;
      
      totalMonthRevenue += rev;
      if (rev > peakRevenue && rev > 0) {
        peakRevenue = rev;
        peakDay = dayStr;
      }
      
      return { day: dayStr, revenue: rev };
    });

    const averageRevenue = Number((totalMonthRevenue / daysInMonth).toFixed(2));

    return {
      averageRevenue,
      peakPeriod: peakDay || 'N/A',
      data: dailyData,
    };
  }

  /** Top N tour có doanh thu/lượt booking cao nhất */
  async getTopTours(limit = 10) {
    const stats = await this.dataSource
      .createQueryBuilder()
      .select('t.id', 'tourId')
      .addSelect('COUNT(b.id)', 'bookingCount')
      .addSelect('SUM(b."totalAmount")', 'revenue')
      .from(Booking, 'b')
      .innerJoin('b.session', 'session')
      .innerJoin('session.tour', 't')
      .where('b.status = :status', { status: BookingStatus.PAID })
      .groupBy('t.id')
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany();

    if (!stats.length) return [];

    const tourIds = stats.map((s) => s.tourId);
    const tours = await this.tourRepository.find({
      where: { id: In(tourIds) },
      relations: ['destinations'],
    });

    const tourMap = new Map(tours.map((t) => [t.id, t]));

    return stats.map((r) => {
      const tour = tourMap.get(r.tourId);
      return {
        tourId: r.tourId,
        tourName: tour?.name || '',
        destination: tour?.destinations?.map((d) => d.city).join(', ') || 'N/A',
        bookingCount: Number(r.bookingCount),
        revenue: Number(r.revenue),
      };
    });
  }

  /** Thống kê booking theo trạng thái trong khoảng thời gian */
  async getBookingStats(startDate?: string, endDate?: string) {
    const qb = this.bookingRepository
      .createQueryBuilder('b')
      .select('b.status', 'status')
      .addSelect('COUNT(b.id)', 'count')
      .addSelect('SUM(b."totalAmount")', 'totalAmount');

    if (startDate) {
      qb.andWhere('b."createdAt" >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('b."createdAt" <= :endDate', { endDate });
    }

    const rows = await qb.groupBy('b.status').getRawMany();

    return rows.map((r) => ({
      status: r.status,
      count: Number(r.count),
      totalAmount: Number(r.totalAmount ?? 0),
    }));
  }

  /** Thống kê người dùng mới theo tháng */
  async getNewUsersByMonth(year?: number) {
    const targetYear = year ?? new Date().getFullYear();

    const rows: { month: string; count: string }[] =
      await this.dataSource
        .createQueryBuilder()
        .select("TO_CHAR(u.\"createdAt\", 'YYYY-MM')", 'month')
        .addSelect('COUNT(u.id)', 'count')
        .from(User, 'u')
        .where("EXTRACT(YEAR FROM u.\"createdAt\") = :year", { year: targetYear })
        .groupBy("TO_CHAR(u.\"createdAt\", 'YYYY-MM')")
        .orderBy('month', 'ASC')
        .getRawMany();

    const map = new Map(rows.map((r) => [r.month, Number(r.count)]));
    return Array.from({ length: 12 }, (_, i) => {
      const month = `${targetYear}-${String(i + 1).padStart(2, '0')}`;
      return { month, newUsers: map.get(month) ?? 0 };
    });
  }
}
