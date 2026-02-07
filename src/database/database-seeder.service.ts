import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Location } from '@/modules/location/entities/location.entity';
import { User } from '@/modules/users/entities/user.entity';
import { UserProfile } from '@/modules/user_profiles/entities/user_profile.entity';
import { Tour } from '@/modules/tours/entities/tour.entity';
import { TourDetail } from '@/modules/tour-details/entities/tour-detail.entity';
import { TourImage } from '@/modules/tour-images/entities/tour-image.entity';
import { TourSession } from '@/modules/tour-session/entities/tour-session.entity';
import { Booking } from '@/modules/bookings/entities/booking.entity';
import { Review } from '@/modules/reviews/entities/review.entity';
import { ChatSession } from '@/modules/chat/entities/chat-session.entity';
import { ChatMessage } from '@/modules/chat/entities/chat-message.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DatabaseSeederService {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(
    @InjectRepository(Location)
    private locationRepo: Repository<Location>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepo: Repository<UserProfile>,
    @InjectRepository(Tour)
    private tourRepo: Repository<Tour>,
    @InjectRepository(TourDetail)
    private tourDetailRepo: Repository<TourDetail>,
    @InjectRepository(TourImage)
    private tourImageRepo: Repository<TourImage>,
    @InjectRepository(TourSession)
    private tourSessionRepo: Repository<TourSession>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(ChatSession)
    private chatSessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private chatMessageRepo: Repository<ChatMessage>,
    private dataSource: DataSource,
  ) {}

  async seed(clearFirst = false): Promise<void> {
    this.logger.log('🌱 Starting database seeding...');

    if (clearFirst) {
      await this.clear();
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Read seed data
      const seedDataPath = path.join(
        __dirname,
        '..',
        'database',
        'seeds',
        'seed-data.json',
      );
      const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf-8'));

      // Seed in order
      const locationIdMap = await this.seedLocations(
        seedData.locations,
        queryRunner,
      );
      const userIdMap = await this.seedUsers(seedData.users, queryRunner);
      await this.seedUserProfiles(seedData.users, userIdMap, queryRunner);
      const tourIdMap = await this.seedTours(
        seedData.tours,
        locationIdMap,
        queryRunner,
      );
      await this.seedTourDetails(seedData.tours, tourIdMap, queryRunner);
      await this.seedTourImages(seedData.tours, tourIdMap, queryRunner);
      const sessionIdMap = await this.seedTourSessions(
        seedData.tourSessions,
        tourIdMap,
        queryRunner,
      );
      await this.seedBookings(
        seedData.bookings,
        userIdMap,
        sessionIdMap,
        queryRunner,
      );
      await this.seedReviews(
        seedData.reviews,
        userIdMap,
        tourIdMap,
        queryRunner,
      );
      await this.seedChatSessions(
        seedData.chatSessions,
        userIdMap,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      this.logger.log('✅ Database seeding completed successfully!');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('❌ Error seeding database:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async clear(): Promise<void> {
    this.logger.log('🧹 Clearing existing data...');

    // Delete in reverse order to respect foreign keys
    await this.chatMessageRepo.createQueryBuilder().delete().execute();
    await this.chatSessionRepo.createQueryBuilder().delete().execute();
    await this.reviewRepo.createQueryBuilder().delete().execute();
    await this.bookingRepo.createQueryBuilder().delete().execute();
    await this.tourSessionRepo.createQueryBuilder().delete().execute();
    await this.tourImageRepo.createQueryBuilder().delete().execute();
    await this.tourDetailRepo.createQueryBuilder().delete().execute();
    await this.tourRepo.createQueryBuilder().delete().execute();
    await this.userProfileRepo.createQueryBuilder().delete().execute();
    await this.userRepo.createQueryBuilder().delete().execute();
    await this.locationRepo.createQueryBuilder().delete().execute();

    this.logger.log('✅ Database cleared');
  }

  private async seedLocations(
    locations: any[],
    queryRunner: any,
  ): Promise<Map<string, string>> {
    this.logger.log(`📍 Seeding ${locations.length} locations...`);
    const idMap = new Map<string, string>();

    for (const loc of locations) {
      const location = queryRunner.manager.create(Location, {
        city: loc.city,
        country: loc.country,
      });
      const saved = await queryRunner.manager.save(location);
      idMap.set(loc.id, saved.id);
    }

    this.logger.log(`✅ Seeded ${locations.length} locations`);
    return idMap;
  }

  private async seedUsers(
    users: any[],
    queryRunner: any,
  ): Promise<Map<string, string>> {
    this.logger.log(`👤 Seeding ${users.length} users...`);
    const idMap = new Map<string, string>();

    for (const userData of users) {
      const hashedPassword = userData.password
        ? await bcrypt.hash(userData.password, 10)
        : await bcrypt.hash('password123', 10); // Default password

      const user = queryRunner.manager.create(User, {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: hashedPassword,
        role: userData.role,
        isActive: userData.isActive,
        providers: userData.providers,
        googleId: userData.googleId,
      });
      const saved = await queryRunner.manager.save(user);
      idMap.set(userData.id, saved.id);
    }

    this.logger.log(`✅ Seeded ${users.length} users`);
    return idMap;
  }

  private async seedUserProfiles(
    users: any[],
    userIdMap: Map<string, string>,
    queryRunner: any,
  ): Promise<void> {
    this.logger.log(`👥 Seeding user profiles...`);
    let count = 0;

    for (const userData of users) {
      if (userData.profile) {
        const profile = queryRunner.manager.create(UserProfile, {
          userId: userIdMap.get(userData.id),
          fullName: userData.profile.fullName,
          phone: userData.profile.phone,
          address: userData.profile.address,
          avatarUrl: userData.profile.avatarUrl,
          birthDate: userData.profile.birthDate
            ? new Date(userData.profile.birthDate)
            : null,
        });
        await queryRunner.manager.save(profile);
        count++;
      }
    }

    this.logger.log(`✅ Seeded ${count} user profiles`);
  }

  private async seedTours(
    tours: any[],
    locationIdMap: Map<string, string>,
    queryRunner: any,
  ): Promise<Map<string, string>> {
    this.logger.log(`🗺️  Seeding ${tours.length} tours...`);
    const idMap = new Map<string, string>();

    for (const tourData of tours) {
      const tour = queryRunner.manager.create(Tour, {
        name: tourData.name,
        duration: tourData.duration,
        guideService: tourData.guideService,
        type: tourData.type,
        image: tourData.image,
        price: tourData.price,
        discount: tourData.discount,
        rating: tourData.rating,
        reviewCount: tourData.reviewCount,
        location: { id: locationIdMap.get(tourData.locationId) },
      });
      const saved = await queryRunner.manager.save(tour);
      idMap.set(tourData.id, saved.id);
    }

    this.logger.log(`✅ Seeded ${tours.length} tours`);
    return idMap;
  }

  private async seedTourDetails(
    tours: any[],
    tourIdMap: Map<string, string>,
    queryRunner: any,
  ): Promise<void> {
    this.logger.log(`📝 Seeding tour details...`);

    for (const tourData of tours) {
      if (tourData.detail) {
        const detail = queryRunner.manager.create(TourDetail, {
          tourId: tourIdMap.get(tourData.id),
          description: tourData.detail.description,
          itinerary: tourData.detail.itinerary,
          inclusions: tourData.detail.inclusions,
        });
        await queryRunner.manager.save(detail);
      }
    }

    this.logger.log(`✅ Seeded ${tours.length} tour details`);
  }

  private async seedTourImages(
    tours: any[],
    tourIdMap: Map<string, string>,
    queryRunner: any,
  ): Promise<void> {
    this.logger.log(`🖼️  Seeding tour images...`);
    let count = 0;

    for (const tourData of tours) {
      if (tourData.images && tourData.images.length > 0) {
        for (const imageData of tourData.images) {
          const image = queryRunner.manager.create(TourImage, {
            imageUrl: imageData.url,
            tour: { id: tourIdMap.get(tourData.id) },
          });
          await queryRunner.manager.save(image);
          count++;
        }
      }
    }

    this.logger.log(`✅ Seeded ${count} tour images`);
  }

  private async seedTourSessions(
    sessions: any[],
    tourIdMap: Map<string, string>,
    queryRunner: any,
  ): Promise<Map<string, string>> {
    this.logger.log(`📅 Seeding ${sessions.length} tour sessions...`);
    const idMap = new Map<string, string>();

    for (const sessionData of sessions) {
      const session = queryRunner.manager.create(TourSession, {
        tour: { id: tourIdMap.get(sessionData.tourId) },
        startDate: new Date(sessionData.startDate),
        capacity: sessionData.capacity,
        bookedCount: sessionData.bookedCount,
        price: sessionData.price,
        status: sessionData.status,
      });
      const saved = await queryRunner.manager.save(session);
      idMap.set(sessionData.id, saved.id);
    }

    this.logger.log(`✅ Seeded ${sessions.length} tour sessions`);
    return idMap;
  }

  private async seedBookings(
    bookings: any[],
    userIdMap: Map<string, string>,
    sessionIdMap: Map<string, string>,
    queryRunner: any,
  ): Promise<void> {
    this.logger.log(`🎫 Seeding ${bookings.length} bookings...`);

    for (const bookingData of bookings) {
      const booking = queryRunner.manager.create(Booking, {
        user: { id: userIdMap.get(bookingData.userId) },
        session: { id: sessionIdMap.get(bookingData.sessionId) },
        adults: bookingData.adults,
        children: bookingData.children,
        infants: bookingData.infants,
        adultPrice: bookingData.adultPrice,
        childrenPrice: bookingData.childrenPrice,
        infantPrice: bookingData.infantPrice,
        totalAmount: bookingData.totalAmount,
        status: bookingData.status,
      });
      await queryRunner.manager.save(booking);
    }

    this.logger.log(`✅ Seeded ${bookings.length} bookings`);
  }

  private async seedReviews(
    reviews: any[],
    userIdMap: Map<string, string>,
    tourIdMap: Map<string, string>,
    queryRunner: any,
  ): Promise<void> {
    this.logger.log(`⭐ Seeding ${reviews.length} reviews...`);

    for (const reviewData of reviews) {
      const review = queryRunner.manager.create(Review, {
        tour: { id: tourIdMap.get(reviewData.tourId) },
        user: { id: userIdMap.get(reviewData.userId) },
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      await queryRunner.manager.save(review);
    }

    this.logger.log(`✅ Seeded ${reviews.length} reviews`);
  }

  private async seedChatSessions(
    chatSessions: any[],
    userIdMap: Map<string, string>,
    queryRunner: any,
  ): Promise<void> {
    this.logger.log(`💬 Seeding ${chatSessions.length} chat sessions...`);
    let messageCount = 0;

    for (const sessionData of chatSessions) {
      const session = queryRunner.manager.create(ChatSession, {
        status: sessionData.status,
        user: sessionData.userId
          ? { id: userIdMap.get(sessionData.userId) }
          : null,
      });
      const savedSession = await queryRunner.manager.save(session);

      // Seed messages for this session
      if (sessionData.messages && sessionData.messages.length > 0) {
        for (const msgData of sessionData.messages) {
          // Determine sender type based on senderId
          let sender = 'BOT';
          if (msgData.senderId.startsWith('user-')) {
            sender = 'USER';
          } else if (msgData.senderId.startsWith('admin-')) {
            sender = 'ADMIN';
          }

          const message = queryRunner.manager.create(ChatMessage, {
            content: msgData.content,
            sender: sender,
            session: savedSession,
          });
          await queryRunner.manager.save(message);
          messageCount++;
        }
      }
    }

    this.logger.log(
      `✅ Seeded ${chatSessions.length} chat sessions and ${messageCount} messages`,
    );
  }
}
