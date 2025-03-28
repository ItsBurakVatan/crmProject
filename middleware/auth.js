import jwt from "jsonwebtoken";

// Token doğrulama middleware'i
const verifyToken = (req, res, next) => {
    // Token'ı cookie'den veya Authorization header'ından al
    const token = req.cookies.access_token || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ 
            message: "Token bulunamadı, lütfen giriş yapın!" 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ 
                message: "Geçersiz veya süresi dolmuş token!", 
                error: err.message // Hata detayını geliştirici için ekledim
            });
        }
        req.user = decoded; // decoded içinde { id, role } var
        next();
    });
};

// Rol bazlı yetkilendirme middleware'i
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        verifyToken(req, res, () => {
            if (!req.user || !allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ 
                    message: `Bu işlem için yetkiniz yok! İzin verilen roller: ${allowedRoles.join(", ")}`,
                    userRole: req.user?.role || "Tanımlanmamış" // Kullanıcının mevcut rolünü gösterir
                });
            }
            next();
        });
    };
};

// Export
export { verifyToken, authorize };
