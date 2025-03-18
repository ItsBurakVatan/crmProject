import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(403).json({ message: "Token bulunamadı, lütfen giriş yapın!" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Geçersiz token!" });
        req.user = decoded; // decoded içinde id ve role var
        next();
    });
};

const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        verifyToken(req, res, () => {
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ message: "Bu işlem için yetkiniz yok!" });
            }
            next();
        });
    };
};

export { verifyToken, verifyRole };
