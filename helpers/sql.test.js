process.env.NODE_ENV = "test";
const { sqlForPartialUpdate } = require("./sql");
const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const { BadRequestError } = require("../expressError");


// { username, password, firstName, lastName, email, isAdmin })

describe("Test sqlForPartialUpdate", function () {

    beforeEach(async function () {
        await db.query("DELETE FROM companies");
        await db.query("DELETE FROM users");

        let u1 = await User.register({
            username: "test1",
            password: "password",
            firstName: "Test1",
            lastName: "Testy1",
            email: "tyler@yahoo.com",
            isAdmin: false
        });
    });

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
            const data = {

            }

            sqlForPartialUpdate(data, jsToSql)


            // We want test to fail if it reaches this point.
            fail('it should not reach here');
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    // test("not found if no such company", async function () {
    //     try {
    //         await Company.update("nope", updateData);
    //         fail();
    //     } catch (err) {
    //         expect(err instanceof NotFoundError).toBeTruthy();
    //     }
    // });


});

afterAll(async function () {
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM users");
    await db.end();
});




// function sqlForPartialUpdate(dataToUpdate, jsToSql) {
//     const keys = Object.keys(dataToUpdate);
//     if (keys.length === 0) throw new BadRequestError("No data");

//     // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
//     const cols = keys.map((colName, idx) =>
//         `"${jsToSql[colName] || colName}"=$${idx + 1}`,
//     );

//     console.log('cols', cols.join(", "));
//     console.log('vals', Object.values(dataToUpdate));
//     return {
//       setCols: cols.join(", "),
//       values: Object.values(dataToUpdate),
//     };
//   }