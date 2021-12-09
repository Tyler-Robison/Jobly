"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

// CREATE TABLE jobs (
//     id SERIAL PRIMARY KEY,
//     title TEXT NOT NULL,
//     salary INTEGER CHECK (salary >= 0),
//     equity NUMERIC CHECK (equity <= 1.0),
//     company_handle VARCHAR(25) NOT NULL
//       REFERENCES companies ON DELETE CASCADE
//   );

class Job {
    /** Create a company (from data), update db, return new company data.
     *
     * data should be { title, salary, equity, company_handle }
     *
     * Returns { title, salary, equity, company_handle }
     *
     * */

    static async create({ title, salary, equity, company_handle }) {

        const result = await db.query(
            `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle AS "companyHandle"`,
            [title, salary, equity, company_handle]);

        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     *
     * Returns [{ title, salary, equity, company_handle }, ...]
     * 
     * This route can be filtered. Filter is always "ON" but doesn't actually filter unless it receives values for min, max or name
     * 
     * Can use all or some of filter terms.
     * */


    static async findAll(title="", minSalary=0, hasEquity=false) {

        // if !hasEquity then don't filter based on equity
        // if hasEquity then want values > 0 to pass filter
        let whereStatement;
        // boolean false changed to 'false' by query string, undo that
        if(hasEquity === 'false') hasEquity = false

        if(hasEquity === false) {
            whereStatement = `WHERE title ILIKE ('%' || $1 || '%') AND salary >= $2`
        }
        else {
            whereStatement = `WHERE title ILIKE ('%' || $1 || '%') AND salary >= $2 AND equity > 0`
        }

        // Don't have to pass in equity, ignore it if false 
        // or hard-code equity > 0 into whereStatement if true
    
        const jobsRes = await db.query(
            `SELECT title,
                salary,
                equity,
                company_handle AS "companyHandle"
        FROM jobs
        ${whereStatement}
         ORDER BY title`, [title, minSalary]);

        return jobsRes.rows;
    }

    /** Given a job title, return data about job.
     *
     * Returns { title, salary, equity, company_handle }
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns {title, salary, equity, company_handle}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        // values is an array of the values from the data obj. 
        // setCols is the columns being updated
        // setCols = ['"first_name"=$1', '"age"=$2']
        const { setCols, values } = sqlForPartialUpdate(data, { companyHandle: "company_handle" });
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No company: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id, title`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}


module.exports = Job;