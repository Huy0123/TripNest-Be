import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Public } from '@/decorators/public.decorator';
import { Role } from '@/decorators/role.decorator';
import { UserRole } from '@/enums/user-role.enum';
import { Message } from '@/decorators/message.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Role(UserRole.USER)
  @Message('Tạo đánh giá thành công')
  async create(@Body() createReviewDto: CreateReviewDto, @Req() req: any) {
    createReviewDto.userId = req.user?.id;
    return await this.reviewsService.create(createReviewDto);
  }

  @Get()
  @Public()
  @Message('Lấy danh sách đánh giá thành công')
  findAll(@Query('tourId') tourId: string) {
    return this.reviewsService.findAll(tourId);
  }

  @Get(':id')
  @Public()
  @Message('Lấy thông tin đánh giá thành công')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @Role(UserRole.USER)
  @Message('Cập nhật đánh giá thành công')
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Req() req: any,
  ) {
    return this.reviewsService.update(id, updateReviewDto, req.user?.id);
  }

  @Delete(':id')
  @Role(UserRole.ADMIN, UserRole.USER)
  @Message('Xóa đánh giá thành công')
  remove(@Param('id') id: string, @Req() req: any) {
    const isAdmin = req.user?.role === UserRole.ADMIN;
    return this.reviewsService.remove(id, req.user?.id, isAdmin);
  }
}
