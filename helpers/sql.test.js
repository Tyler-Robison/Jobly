const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("Test sqlForPartialUpdate", function () {

    test("success on valid user data", function () {

        const jsToSql = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
        }
        const data = {
            firstName: 'new_first',
            password: 'new_pass'
        }

        const output = sqlForPartialUpdate(data, jsToSql)
        const expectedOutput = {
            setCols: '"first_name"=$1, "password"=$2',
            values: ['new_first', 'new_pass']
        }

        // console.log('output', output)
        expect(output).toEqual(expectedOutput)
    });

    test("success on valid company data", function () {

        const jsToSql = {
            numEmployees: "num_employees",
            logoUrl: "logo_url",
        }
        const data = {
            numEmployees: "10101010",
            logoUrl: "new_logo_url",
        }

        const output = sqlForPartialUpdate(data, jsToSql)
        // console.log('output', output)
        const expectedOutput = {
            setCols: '"num_employees"=$1, "logo_url"=$2',
            values: ['10101010', 'new_logo_url']
        }

        // console.log('output', output)
        expect(output).toEqual(expectedOutput)
    });

    test("failure on blank data", function () {
        try {
            const jsToSql = {
                firstName: "first_name",
                lastName: "last_name",
                isAdmin: "is_admin",
            }
            const data = { }

            sqlForPartialUpdate(data, jsToSql)


            // We want test to fail if it reaches this point.
            fail('it should not reach here');
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

});