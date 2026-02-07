export const NAME_QUEUE = {
  SEND_OTP_VERIFY_ACCOUNT: 'send_otp_verify_account',
  HANDLE_CREATE_PAYMENT_URL: 'handle_create_payment_url',
  CREATE_TRANSACTION: 'create_transaction',
  CANCEL_TRANSACTION: 'cancel_transaction',
  SEND_OTP_FORGOT_PASSWORD: 'send_otp_forgot_password',
  SEND_NEW_PASSWORD: 'send_new_password',
  SEND_MAIL_NOTI_PAYMENT_SUCCESS: 'send_mail_noti_payment_success',
  SEND_MAIL_NOTI_PAYMENT_FAILED: 'send_mail_noti_payment_failed',
  SEND_MAIL_NOTI_TRIP_REMINDER: 'send_mail_noti_trip_reminder',
  SEND_MAIL_NOTI_BOOKING_CANCELLED: 'send_mail_noti_booking_cancelled',
} as const;
