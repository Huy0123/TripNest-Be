import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('reviews')
export class ReviewsController {
  private logger = new Logger(ReviewsController.name);
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async create(@Body() createReviewDto: CreateReviewDto) {
    try {
      this.logger.log('Creating a new review');
      const review = await this.reviewsService.create(createReviewDto);
      this.logger.log('Review created successfully');
      return {
        message: 'Review created successfully',
        data: review,
      };
    } catch (error) {
      this.logger.error('Error creating review', error.stack);
      throw error;
    }
  }

  @Get()
  findAll(@Query('tourId') tourId: string) {
    return this.reviewsService.findAll(tourId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
