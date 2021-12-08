\echo 'Delete and recreate jobly db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE jobly;
CREATE DATABASE jobly;
\connect jobly

\i jobly-schema.sql
\i jobly-seed.sql

\echo 'Delete and recreate jobly_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE jobly_test;
CREATE DATABASE jobly_test;
\connect jobly_test

\i jobly-schema.sql

SELECT handle, name,description, num_employees AS "numEmployees", logo_url AS "logoUrl"
FROM companies
"" 
ORDER BY name;

-- created_admin
-- flyboy
-- eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNyZWF0ZWRfYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE2Mzg4OTIxNTR9.a5BSN7_hjkEQd7EYEKHD5w-hu1OHtECh5LnPUopBC1s

-- INSERT INTO jobs (title, salary, equity, company_handle)
-- VALUES ('Dog Freer', 80000, 0.08, 'baker-santos');

-- INSERT INTO jobs (title, salary, equity, company_handle)
-- VALUES ( 'j1', 1000, 0.0, 'c1'),
-- ( 'j2', 2000, 0.5, 'c2'),
-- ( 'j3', 3000, 0.8, 'c3');