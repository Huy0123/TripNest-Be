import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { Booking } from '@/modules/bookings/entities/booking.entity';

const MAX_RETRIES = 3;
const CODE_PREFIX = 'TN-';

export async function generateBookingCode(
  repo: Repository<Booking>,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code =
      CODE_PREFIX + randomBytes(4).toString('hex').toUpperCase();

    const existing = await repo.findOne({
      where: { bookingCode: code },
      withDeleted: true,
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error(
    'Không thể tạo mã đặt chỗ, vui lòng thử lại',
  );
}
