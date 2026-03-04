import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Promotion } from './entities/promotion.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionsRepository: Repository<Promotion>,
  ) {}

  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    const existing = await this.promotionsRepository.findOne({ where: { code: createPromotionDto.code } });
    if (existing) {
      throw new BadRequestException('Promotion code already exists');
    }
    const promotion = this.promotionsRepository.create(createPromotionDto);
    return await this.promotionsRepository.save(promotion);
  }

  async findAll(): Promise<Promotion[]> {
    return await this.promotionsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Promotion> {
    const promotion = await this.promotionsRepository.findOne({ where: { id } });
    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }
    return promotion;
  }

  async findByCode(code: string): Promise<Promotion> {
    const promotion = await this.promotionsRepository.findOne({ where: { code } });
    if (!promotion) {
      throw new NotFoundException(`Promotion with code ${code} not found`);
    }
    return promotion;
  }

  async update(id: string, updatePromotionDto: UpdatePromotionDto): Promise<Promotion> {
    const promotion = await this.findOne(id);
    if (updatePromotionDto.code && updatePromotionDto.code !== promotion.code) {
      const existing = await this.promotionsRepository.findOne({ where: { code: updatePromotionDto.code } });
      if (existing) {
        throw new BadRequestException('Promotion code already exists');
      }
    }
    Object.assign(promotion, updatePromotionDto);
    return await this.promotionsRepository.save(promotion);
  }

  async remove(id: string): Promise<void> {
    const promotion = await this.findOne(id);
    await this.promotionsRepository.softRemove(promotion);
  }
}
