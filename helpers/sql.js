const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.


// jsToSql is only needed for variables where the JS name is diff
// from the SQL name. EX: first_name vs. firstName

  /** Generates the SET and WHERE portion of the SQL statement needed for partial update of company or user.
   * 
   * jsToSql = { numEmployees: "num_employees",  logoUrl: "logo_url" }
   * 
   * data = { numEmployees: "10101010", logoUrl: "new_logo_url" }
   *              
   * Given sqlForPartialUpdate(data, jsToSql)
   * 
   * Returns {setCols: '"num_employees"=$1, "logo_url"=$2', values: ['10101010', 'new_logo_url']}
   * 
   * */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // console.log('cols', cols.join(", "));
  // console.log('vals', Object.values(dataToUpdate));
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
