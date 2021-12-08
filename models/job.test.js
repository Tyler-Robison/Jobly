"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
const Job =  require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "Dog Catcher",
    salary: 1000,
    equity: 0.5,
    company_handle: 'c1'
  };

  test("works with good data", async function () {
    const job = await Job.create(newJob);
    expect(job).toEqual(  {
        title: "Dog Catcher",
        salary: 1000,
        equity: '0.5',
        companyHandle: 'c1'
      });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'Dog Catcher'`);
    expect(result.rows).toEqual([
      {
        title: "Dog Catcher",
        salary: 1000,
        equity: '0.5',
        company_handle: 'c1'
      },
    ]);
  });

  test("fails with bad data", async function () {
    try {
        const newJob = {
            title: 555,
            salary: 'cat',
            equity: 'dog',
            company_handle: 4565
          };
      await Job.create(newJob);
     
      fail();
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    const jobs = await Job.findAll();
    expect(jobs).toEqual(
         [
      {
        title: "j1",
        salary: 1000,
        equity: '0.0',
        companyHandle: 'c1'
      },
      {
        title: "j2",
        salary: 2000,
        equity: '0.5',
        companyHandle: 'c2'
      },
      {
        title: "j3",
        salary: 3000,
        equity: '0.8',
        companyHandle: 'c3'
      },
    ]);
  });

  test("works: with filter (title)", async function () {
    let jobs = await Job.findAll(2);
    expect(jobs).toEqual([
        {
            title: "j2",
            salary: 2000,
            equity: '0.5',
            companyHandle: 'c2'
          }
    ]);
  });

  test("works: with filter (minSalary)", async function () {
    let jobs = await Job.findAll('', 2000);
    expect(jobs).toEqual([
        {
            title: "j2",
            salary: 2000,
            equity: '0.5',
            companyHandle: 'c2'
          },
          {
            title: "j3",
            salary: 3000,
            equity: '0.8',
            companyHandle: 'c3'
          }
    ]);
  });

  test("works: with filter (hasEquity)", async function () {
    let jobs = await Job.findAll('', 0, true);
    expect(jobs).toEqual([
        {
            title: "j2",
            salary: 2000,
            equity: '0.5',
            companyHandle: 'c2'
          },
          {
            title: "j3",
            salary: 3000,
            equity: '0.8',
            companyHandle: 'c3'
          }
    ]);
  });

  test("works: with filter (title, minSalary, hasEquity)", async function () {
    let jobs = await Job.findAll('j', 2000, false);
    expect(jobs).toEqual([
        {
            title: "j2",
            salary: 2000,
            equity: '0.5',
            companyHandle: 'c2'
          },
          {
            title: "j3",
            salary: 3000,
            equity: '0.8',
            companyHandle: 'c3'
          }
    ]);
  });

  test("works: finds nothing with filter (title, minSalary, hasEquity)", async function () {
    let jobs = await Job.findAll('j', 4000, false);
    expect(jobs).toEqual([]);
  });
});





// /************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
        id: 1,
        title: "j1",
        salary: 1000,
        equity: '0.0',
        companyHandle: 'c1'
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(4);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const updateData = {
    title: "jnew",
    salary: 5000,
    equity: '0.2',
  };

  test("update works with good data", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
        companyHandle: 'c1',
        title: "jnew",
        salary: 5000,
        equity: '0.2',
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE company_handle = 'c1'`);
    expect(result.rows).toEqual([{
        id: 1,
        title: "jnew",
        salary: 5000,
        equity: '0.2',
        company_handle: 'c1'
    }]);
  });

  test("update works with null fields", async function () {
    const updateNullData = {
        title: "jnew",
        salary: null,
        equity: null,
      };

    let job = await Job.update(1, updateNullData);
    expect(job).toEqual({
        companyHandle: 'c1',
        title: "jnew",
        salary: null,
        equity: null,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE company_handle = 'c1'`);
    expect(result.rows).toEqual([{
        id: 1,
        title: "jnew",
        salary: null,
        equity: null,
        company_handle: 'c1'
    }]);
  });


  test("not found if no such company", async function () {
    try {
      await Job.update(897987, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("removes if job found", async function () {
    await Job.remove(1);
    const res = await db.query(
      "SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found error if no such job", async function () {
    try {
      await Job.remove(9999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});