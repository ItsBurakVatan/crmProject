const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index"); // Express app'ı import edin
const AdayCari = require("../models/AdayCari");

describe("AdayCari API", () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_TEST || "mongodb://localhost:27017/crm_test");
    });

    afterEach(async () => {
        await AdayCari.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it("GET /api/adaycaris/:companyId should return aday caris", async () => {
        const mockUser = { id: "mockUserId", role: "admin" };
        const mockToken = "mock-jwt-token"; // Gerçek bir token simüle edilmeli
        const companyId = "mockCompanyId";

        await AdayCari.create({ chUnvani: "Test Cari", company: companyId, synced: true });

        const res = await request(app)
            .get(`/api/adaycaris/${companyId}?page=1&limit=10`)
            .set("Authorization", `Bearer ${mockToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("data");
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body).toHaveProperty("total");
    });

    it("POST /api/adaycaris should create a new aday cari", async () => {
        const mockToken = "mock-jwt-token";
        const newAdayCari = {
            adayKodu: 123,
            chUnvani: "Test Cari",
            company: "mockCompanyId",
        };

        const res = await request(app)
            .post("/api/adaycaris")
            .set("Authorization", `Bearer ${mockToken}`)
            .send(newAdayCari);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("_id");
        expect(res.body.chUnvani).toBe("Test Cari");
    });
});
