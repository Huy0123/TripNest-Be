# TripNest Backend

Backend API cho nền tảng đặt tour du lịch TripNest, xây dựng bằng [NestJS](https://nestjs.com/).

---

## Tính năng

| Module | Mô tả |
|---|---|
| **Auth** | Đăng ký, đăng nhập, Google OAuth, xác thực OTP qua email, JWT access + refresh token |
| **Users** | Quản lý hồ sơ, upload avatar lên Cloudinary |
| **Tours** | CRUD Tour, filter/search, phân trang, upload ảnh, cache Redis |
| **Tour Sessions** | Quản lý lịch khởi hành, số chỗ, giá vé, trạng thái |
| **Bookings** | Đặt tour, kiểm tra capacity (pessimistic lock), hủy booking, tự hủy sau 15 phút nếu chưa thanh toán |
| **Payments** | Tích hợp VNPay: tạo URL thanh toán, xác minh Return URL & IPN |
| **Promotions** | Mã giảm giá (fixed / percentage), giới hạn số lần dùng, ngày hiệu lực |
| **Reviews** | Đánh giá Tour — chỉ user đã thanh toán thành công mới được review |
| **Mail** | Gửi email qua Gmail SMTP: xác thực OTP, đặt tour thành công, nhắc ngày đi |
| **Notifications** | WebSocket real-time cập nhật số chỗ còn lại của TourSession |
| **Upload** | Upload ảnh lên Cloudinary |
| **Cache** | Redis caching + cache versioning |

---

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL + TypeORM
- **Cache & Queue**: Redis + BullMQ
- **Real-time**: Socket.io (WebSockets)
- **Email**: Nodemailer (Gmail SMTP) + Handlebars templates
- **Payment**: VNPay
- **Storage**: Cloudinary
- **Scheduling**: `@nestjs/schedule` (cron jobs)
- **Containerization**: Docker & Docker Compose

---

## Cài đặt

```bash
git clone https://github.com/Huy0123/TripNest-Be.git
cd TripNest-Be
npm install
```

---

## Cấu hình `.env`

Tạo file `.env` ở thư mục gốc:

```env
PORT=
HOST=
PORT_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=

REDIS_HOST=
REDIS_PORT=

JWT_SECRET=
JWT_REFRESH=
JWT_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=

MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASSWORD=

APP_NAME=
SUPPORT_EMAIL=
SUPPORT_PHONE=
COMPANY_ADDRESS=
OTP_EXPIRE_TIME=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GOOGLE_CLIENT_ID=

VNP_TMNCODE=
VNP_HASHSECRET=
VNP_URL=
VNP_RETURN_URL=

FRONTEND_URL=
```

---

## Chạy ứng dụng

**1. Khởi động PostgreSQL & Redis qua Docker:**
```bash
docker-compose up -d
```

**2. Development:**
```bash
npm run start:dev
```

**3. Production:**
```bash
npm run build
npm run start:prod
```

