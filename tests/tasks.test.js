const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../index");
const Task = require("../models/Task");

describe("Tasks API", () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_TEST || "mongodb://localhost:27017/crm_test");
    });

    afterEach(async () => {
        await Task.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it("GET /api/tasks should return tasks", async () => {
        const mockUser = { id: "mockUserId", role: "admin" };
        const mockToken = "mock-jwt-token";

        await Task.create({
            taskNo: 1,
            description: "Test Task",
            createdBy: new mongoose.Types.ObjectId("mockUserId"),
        });

        const res = await request(app)
            .get("/api/tasks?page=1&limit=10")
            .set("Authorization", `Bearer ${mockToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("data");
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("POST /api/tasks should create a new task", async () => {
        const mockToken = "mock-jwt-token";
        const newTask = {
            description: "New Task",
            adayCari: "mockAdayCariId",
            taskDate: "2025-04-04T10:00:00Z",
            taskEndDate: "2025-04-05T10:00:00Z",
            receiptType: "mockReceiptTypeId",
            priority: "mockPriorityId",
            taskType: "mockTaskTypeId",
        };

        const res = await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${mockToken}`)
            .send(newTask);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("_id");
        expect(res.body.description).toBe("New Task");
    });
});
