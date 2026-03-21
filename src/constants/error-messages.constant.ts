export const ErrorMessages = {
  NOT_FOUND: {
    USER: 'Không tìm thấy người dùng',
    TOUR: 'Không tìm thấy tour',
    SESSION: 'Không tìm thấy phiên tour',
    BOOKING: 'Không tìm thấy đơn đặt chỗ',
    PAYMENT: 'Không tìm thấy thanh toán',
    PROMOTION: 'Không tìm thấy mã khuyến mãi',
    REVIEW: 'Không tìm thấy đánh giá',
    LOCATION: 'Không tìm thấy địa điểm',
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
    GOOGLE_ACCOUNT:
      'Email này được đăng ký qua Google. Vui lòng đăng nhập bằng Google',
    ACCOUNT_INACTIVE:
      'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email',
    OTP_INVALID: 'Mã OTP không đúng hoặc đã hết hạn',
    OTP_TOO_MANY_ATTEMPTS: (after: number) =>
      `Quá nhiều lần thử sai. Vui lòng thử lại sau ${after} giây`,
    OTP_WAIT: (remaining: number) =>
      `Vui lòng đợi ${remaining} giây trước khi yêu cầu OTP mới`,
    PASSWORD_MISMATCH: 'Mật khẩu xác nhận không khớp',
    GOOGLE_FAILED: 'Đăng nhập Google thất bại',
    TOKEN_REFRESH_FAILED: 'Không thể làm mới phiên đăng nhập',
    USER_ALREADY_EXISTS: 'Tài khoản với email này đã tồn tại',
    ACCOUNT_ALREADY_ACTIVE: 'Tài khoản đã được kích hoạt',
    GOOGLE_ONLY_ACCOUNT:
      'Tài khoản này được đăng ký qua Google. Vui lòng đăng nhập bằng Google',
  },
  BOOKING: {
    SESSION_FULL: 'Phiên tour đã hết chỗ',
    CANCEL_ONLY_PENDING: 'Chỉ có thể hủy đơn đang chờ thanh toán',
    RATE_LIMIT: 'Vui lòng đợi trước khi đặt lại',
    CODE_GENERATION_FAILED:
      'Không thể tạo mã đặt chỗ, vui lòng thử lại',
    NOT_FOUND: 'Không tìm thấy đơn đặt chỗ',
  },
  PROMO: {
    INVALID: 'Mã khuyến mãi không hợp lệ',
    INACTIVE: 'Mã khuyến mãi chưa được kích hoạt',
    EXPIRED: 'Mã khuyến mãi đã hết hạn hoặc chưa có hiệu lực',
    LIMIT_REACHED: 'Mã khuyến mãi đã đạt giới hạn sử dụng',
    MIN_ORDER: 'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng khuyến mãi',
    ALREADY_EXISTS: 'Mã khuyến mãi đã tồn tại',
  },
  TOUR: {
    CREATE_FAILED: 'Tạo tour thất bại',
    UPDATE_FAILED: 'Cập nhật tour thất bại',
    DELETE_FAILED: 'Xóa tour thất bại',
    UPLOAD_FAILED: 'Tải ảnh tour thất bại',
  },
  REVIEW: {
    ALREADY_REVIEWED: 'Bạn đã đánh giá tour này rồi',
    NO_PAID_BOOKING:
      'Bạn chỉ có thể đánh giá tour đã đặt và thanh toán thành công',
    NOT_OWNER: 'Bạn không có quyền thao tác với đánh giá này',
  },
  PAYMENT: {
    URL_FAILED: 'Không thể tạo đường dẫn thanh toán',
    INVALID_SIGNATURE: 'Chữ ký thanh toán không hợp lệ',
    SYSTEM_ERROR: 'Lỗi hệ thống khi xử lý thanh toán',
  },
  UPLOAD: {
    NO_FILE: 'Không có tệp nào được tải lên',
    FAILED: 'Tải tệp lên thất bại',
    AVATAR_FAILED: 'Tải ảnh đại diện thất bại',
  },
  USER: {
    NOT_FOUND: 'Không tìm thấy người dùng',
    ALREADY_EXISTS: 'Tài khoản với email này đã tồn tại',
  },
} as const;
