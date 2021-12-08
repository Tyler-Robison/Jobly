"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "new title",
        salary: 80000,
        equity: 0.08,
        company_handle: "c1"
    };

    test("401 for non-admin users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("201 for admins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                title: "new title",
                salary: 80000,
                equity: '0.08',
                companyHandle: "c1"
            },
        });
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: 'newTitle'
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const badData = {
            title: 1234,
            salary: 'abc',
            equity: 0.08,
            company_handle: "c1"
        };

        const resp = await request(app)
            .post("/jobs")
            .send(badData)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.statusCode).toEqual(200)
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        companyHandle: 'c1',
                        title: "j1",
                        salary: 1000,
                        equity: '0.0',
                    },
                    {
                        companyHandle: 'c2',
                        title: "j2",
                        salary: 2000,
                        equity: '0.5',
                    },
                    {
                        companyHandle: 'c3',
                        title: "j3",
                        salary: 3000,
                        equity: '0.8',
                    },
                ],
        });
    });

    test("works with salary filtering", async function () {
        const resp = await request(app).get("/jobs?minSalary=2000");
        expect(resp.statusCode).toEqual(200)
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        companyHandle: 'c2',
                        title: "j2",
                        salary: 2000,
                        equity: '0.5',
                    },
                    {
                        companyHandle: 'c3',
                        title: "j3",
                        salary: 3000,
                        equity: '0.8',
                    },
                ],
        });
    });

    test("400 Error if hasEquity !== boolean value", async function () {
        const resp = await request(app).get("/jobs?hasEquity=badValue");
        expect(resp.statusCode).toEqual(400)
    });

    test("works with title/minSalary/hasEquity filtering", async function () {
        const resp = await request(app).get("/jobs?minSalary=2000&hasEquity=true&title=2");
        expect(resp.statusCode).toEqual(200)
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        companyHandle: 'c2',
                        title: "j2",
                        salary: 2000,
                        equity: '0.5',
                    }
                ]
        });
    });

    test("Can filter down to nothing", async function () {
        const resp = await request(app).get("/jobs?title=e");
        expect(resp.statusCode).toEqual(200)
        expect(resp.body).toEqual({ jobs: [] });
    });

});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/1`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                companyHandle: 'c1',
                title: "j1",
                salary: 1000,
                equity: '0.0',
            },
        });
    });

    test("not found for no such company", async function () {
        const resp = await request(app).get(`/jobs/9999`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("200 for admins", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                salary: 8000,
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(200)
        expect(resp.body).toEqual({
            job: {
                companyHandle: 'c1',
                title: "j1",
                salary: 8000,
                equity: '0.0',
            },
        });
    });

    test("401 for non-admin users", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                salary: 8000,
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401)
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                salary: 8000,
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/9999`)
            .send({
                salary: 8000,
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on company_handle change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                company_handle: "c1-new",
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/companies/c1`)
            .send({
                salary: "not-an-int",
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("200 for admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({ deleted: "1" });
    });

    test("401 for non-admin user", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);

    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such company", async function () {
        const resp = await request(app)
            .delete(`/jobs/9999`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});