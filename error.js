class ApiError extends Error {
  constructor(statusCode, message, details = []) {
      super(message);
      this.statusCode = statusCode;
      this.details = details;
      this.isOperational = true;
  }

  static badRequest(message = "Geçersiz istek!", details = []) {
      return new ApiError(400, message, details);
  }

  static unauthorized(message = "Yetkisiz erişim! Lütfen giriş yapın.") {
      return new ApiError(401, message);
  }

  static forbidden(message = "Bu işlem için yetkiniz yok!") {
      return new ApiError(403, message);
  }

  static notFound(message = "Kaynak bulunamadı!") {
      return new ApiError(404, message);
  }

  static internal(message = "Bir hata oluştu, lütfen daha sonra tekrar deneyin.") {
      return new ApiError(500, message);
  }
}

const errorHandler = (err, req, res, next) => {
  if (err.isOperational) {
      return res.status(err.statusCode).json({
          message: err.message,
          details: err.details,
      });
  }

  console.error("Bilinmeyen Hata:", err);
  res.status(500).json({
      message: "Bir hata oluştu, lütfen daha sonra tekrar deneyin.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

export { ApiError, errorHandler };
