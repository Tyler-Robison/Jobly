"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/job.js");
const { createToken } = require("../helpers/tokens");


async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  await db.query("DELETE FROM jobs");
  await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");
  await db.query("DELETE FROM technologies");
  await db.query("DELETE FROM technologies_users");
  await db.query("DELETE FROM technologies_jobs");

  await Company.create(
    {
      handle: "c1",
      name: "C1",
      numEmployees: 1,
      description: "Desc1",
      logoUrl: "http://c1.img",
    });
  await Company.create(
    {
      handle: "c2",
      name: "C2",
      numEmployees: 2,
      description: "Desc2",
      logoUrl: "http://c2.img",
    });
  await Company.create(
    {
      handle: "c3",
      name: "C3",
      numEmployees: 3,
      description: "Desc3",
      logoUrl: "http://c3.img",
    });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: true,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });

  await Job.create({
    company_handle: 'c1',
    title: "j1",
    salary: 1000,
    equity: '0.0',
  });
  await Job.create({
    company_handle: 'c2',
    title: "j2",
    salary: 2000,
    equity: '0.5',
  });
  await Job.create({
    company_handle: 'c3',
    title: "j3",
    salary: 3000,
    equity: '0.8',
  });

  await db.query(`
  INSERT INTO technologies (tech_name, description)
  VALUES ('t1', 'd1'),
  ('t2', 'd2'),
  ('t3', 'd3')`);

  await db.query(`
  INSERT INTO technologies_jobs (tech_name, job_id)
  VALUES ('t1', 1),
  ('t2', 1),
  ('t3', 2)`);

  await db.query(`
  INSERT INTO technologies_users (tech_name, username)
  VALUES ('t1', 'u1'),
  ('t2', 'u1'),
  ('t1', 'u2')`);
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


const u1Token = createToken({ username: "u1", isAdmin: false });
const u2Token = createToken({ username: "u2", isAdmin: true });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token
};
