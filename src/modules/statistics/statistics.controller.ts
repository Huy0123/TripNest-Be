import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { Role } from '@/decorators/role.decorator';
import { UserRole } from '@/enums/user-role.enum';
import { Message } from '@/decorators/message.decorator';

@Controller('statistics')
@Role(UserRole.ADMIN)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * GET /statistics/overview
   * Tổng quan: tổng doanh thu, tổng booking, tổng tour, tổng user, booking theo status
   */
  @Get('overview')
  @Message('Overview statistics retrieved successfully')
  getOverview() {
    return this.statisticsService.getOverview();
  }

  /**
   * GET /statistics/revenue/monthly?year=2025
   * Doanh thu theo từng tháng trong năm
   */
  @Get('revenue/monthly')
  @Message('Monthly revenue retrieved successfully')
  getRevenueByMonth(
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe)
    year: number,
  ) {
    return this.statisticsService.getRevenueByMonth(year);
  }

  /**
   * GET /statistics/revenue/daily?year=2025&month=3
   * Doanh thu theo từng ngày trong tháng
   */
  @Get('revenue/daily')
  @Message('Daily revenue retrieved successfully')
  getRevenueByDay(
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe)
    year: number,
    @Query('month', new DefaultValuePipe(new Date().getMonth() + 1), ParseIntPipe)
    month: number,
  ) {
    return this.statisticsService.getRevenueByDay(year, month);
  }

  /**
   * GET /statistics/tours/top?limit=10
   * Top tour có doanh thu cao nhất
   */
  @Get('tours/top')
  @Message('Top tours retrieved successfully')
  getTopTours(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.statisticsService.getTopTours(limit);
  }

  /**
   * GET /statistics/bookings?startDate=2025-01-01&endDate=2025-12-31
   * Thống kê booking theo trạng thái trong khoảng thời gian
   */
  @Get('bookings')
  @Message('Booking statistics retrieved successfully')
  getBookingStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getBookingStats(startDate, endDate);
  }

  /**
   * GET /statistics/users/monthly?year=2025
   * Người dùng mới theo tháng
   */
  @Get('users/monthly')
  @Message('Monthly new users retrieved successfully')
  getNewUsersByMonth(
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe)
    year: number,
  ) {
    return this.statisticsService.getNewUsersByMonth(year);
  }
}
