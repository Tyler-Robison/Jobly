const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM jobs");
  await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");
  await db.query("DELETE FROM technologies");
  await db.query("DELETE FROM technologies_users");
  await db.query("DELETE FROM technologies_jobs");

  await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

  await db.query(`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
    [
      await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
    ]);

  await db.query(`
  INSERT INTO jobs(title, salary, equity, company_handle)
  VALUES ( 'j1', 1000, 0.0, 'c1'),
  ( 'j2', 2000, 0.5, 'c2'),
  ( 'j3', 3000, 0.8, 'c3')`);

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


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
};