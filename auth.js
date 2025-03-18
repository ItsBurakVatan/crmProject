import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json({ message: "Token bulunamadı, lütfen giriş yapın!" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Geçersiz veya süresi dolmuş token!" });
        req.user = decoded; // { id, role }
        next();
    });
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        verifyToken(req, res, () => {
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ 
                    message: `Bu işlem için yetkiniz yok! İzin verilen roller: ${allowedRoles.join(", ")}` 
                });
            }
            next();
        });
    };
};

export { verifyToken, authorize };