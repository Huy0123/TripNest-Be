import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DatabaseSeederService } from '../database-seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const seeder = app.get(DatabaseSeederService);
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');

  try {
    console.log('\n🌱 Database Seeder CLI\n');
    await seeder.seed(shouldClear);
    console.log('\n🎉 Seeding completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
