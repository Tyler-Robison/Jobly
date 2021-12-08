"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

// token has to be provided as a header, not as part of body
// token can't be passed in as string or it will come out wrapped in double quotations -> "'token'" and not be usable
function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    // console.log('authHeader', authHeader)
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      // console.log('**********************')
      // console.log('token', token)
      // console.log('**********************')
      // debugger;
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

// ensures login
function ensureLoggedIn(req, res, next) {
  try {
    // deny access if not logged in
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

// ensures that user is admin
function ensureAdmin(req, res, next) {
  try {
    // deny access if not logged in
    // console.log('testtesttes')
    // console.log('res test', res.locals.user)
    if (!res.locals.user) throw new UnauthorizedError();
    // deny access if not admin or not the correct user
    if (!res.locals.user.isAdmin) throw new UnauthorizedError();

    return next();
  } catch (err) {
    return next(err)
  }
}

// ensures that user is admin OR user editing their own account
function ensureCorrectUser(req, res, next) {
  try {
    // console.log('1', res.locals.user)
    // console.log('2', res.locals.user.isAdmin)
    // console.log('3', res.locals.user.username)
    // console.log('4', req.params.username)

    // deny access if not logged in
    if (!res.locals.user) throw new UnauthorizedError();
    // deny access if not admin and not the correct user
    if (!res.locals.user.isAdmin && res.locals.user.username !== req.params.username) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err)
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUser
};
