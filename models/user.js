"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
      `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
      [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
    { username, password, firstName, lastName, email, isAdmin }) {
    const duplicateCheck = await db.query(
      `SELECT username
           FROM users
           WHERE username = $1`,
      [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
      [
        username,
        hashedPassword,
        firstName,
        lastName,
        email,
        isAdmin,
      ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email, is_admin }, ...]
   **/

  static async findAll() {
    const result = await db.query(
      `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           ORDER BY username`,
    );
    const users = result.rows

    for (let i = 0; i < users.length; i++) {
      const username = users[i].username
      const jobsAppliedToRes = await db.query(
        `SELECT job_id FROM applications
          WHERE username=$1`, [username]
      )

      const jobsAppliedTo = jobsAppliedToRes.rows
      const jobApps = [];

      for (let j = 0; j < jobsAppliedTo.length; j++) {
        jobApps.push(jobsAppliedTo[j].job_id)
      }
      users[i].jobs = jobApps
    }

    return users
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, is_admin, jobs }
   *   where jobs is { id, title, company_handle, company_name, state }
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
      `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
      [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
      `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
      [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  /** Creates row in applications (user/jobs join table) with
   * composite primary key consisting of username/job_id

   * 
   * If application already exists, changes status from 'interested' to 'applied'
   * */
  static async apply(username, jobId) {

    // checks current state of the application
    const currentStateRes = await db.query(
      `SELECT current_state
           FROM applications
           WHERE username = $1 AND job_id=$2`,
      [username, jobId]);


    let currentState
    // if user has already applied to thsi job, currentState will
    // be given value of 'interested' or 'applied' based on 
    // current_state of that application
    if (currentStateRes.rows.length > 0) {
      currentState = currentStateRes.rows[0].current_state
    }

    // SET current_state=current_state++ -> why doesn't this work?
    if (currentState === 'interested') {
      const res = await db.query(
        `UPDATE applications
        SET current_state= 'applied'
        WHERE username=$1 AND job_id=$2
        RETURNING username, job_id AS "jobId", current_state AS currentState`, [username, jobId]
      )
      return res.rows[0]
    } else if (currentState === 'applied') {
      console.log('already applied')
      return { application_status: 'already applied' }
      // these 2 states aren't implemented yet, will be in React Jobly I think
    } else if (currentState === 'accepted') {
      console.log('you were accepted')
    } else if (currentState === 'rejected') {
      console.log('you were rejected')
    }

    const applicationState = 'interested'

    const result = await db.query(`
    INSERT INTO applications (username, job_id, current_state)
    VALUES ($1, $2, $3)
    RETURNING username, job_id AS "jobId", current_state AS currentState`, [username, jobId, applicationState])

    const application = result.rows[0];

    return application;
  }


  /** Creates that user meets tech requirements for job
  * 
  * Checks that username and job_id are both valid
  * 
  * Will return 'meets' or tell you how many techs you are missing
  * */

  static async checkRequirements(username, jobId) {

    const userExists = await db.query(`
    SELECT * FROM users
    WHERE username=$1`, [username])

    if (userExists.rows.length === 0) {
      throw new NotFoundError(`No such user: ${username}`);
    }

    const jobIdExists = await db.query(`
    SELECT * FROM jobs
    WHERE id=$1`, [jobId])

    if (jobIdExists.rows.length === 0) {
      throw new NotFoundError(`No such job: ${jobId}`);
    }

    const userTechsRes = await db.query(
      `SELECT tech_name FROM technologies_users
      WHERE username = $1`, [username]
    )
    const userTechs = userTechsRes.rows
    const userTechArr = userTechs.map(ele => ele.tech_name)

    const jobTechsRes = await db.query(
      `SELECT tech_name FROM technologies_jobs
      WHERE job_id = $1`, [jobId]
    )
    const jobTechs = jobTechsRes.rows
    const jobTechArr = jobTechs.map(ele => ele.tech_name)

    // Iterate through list of jobtechs, count++ for each user doesn't have
    console.log('user techs', userTechArr)
    console.log('job techs', jobTechArr)

    let count = 0;
    for (let i = 0; i < jobTechArr.length; i++) {
      if (!userTechArr.includes(jobTechArr[i])) count++;
    }
    if (count > 0) return `Missing ${count} techs`
    return 'Requirements met'
  }


}


module.exports = User;
