const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");
const Manager = require("../models/managerModel");
const { expiryDate } = require("../helpers/expiryDate");

const verifyJwt = (req, res, next) => {
  try {
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(/[ =]+/);

      //checking cookies has the accessToken
      if (!cookies.includes("accessToken"))
        throw createError.NotFound("No accesstoken in header");

      //finding the index and accessing the authToken
      const index = cookies.indexOf("accessToken");
      const token = cookies[index + 1];

      //verfiying authToken with jwt
      jwt.verify(token, process.env.JWT_AUTH_SECRET, async (err, user) => {
        try {
          if (err) throw createError.Unauthorized(err);

          //putting that user to request header to access in the protected route
          req.user = user;

          const usr = await Admin.findById(req.user._id);
          if (usr) {
            // block or unblock checking
            if (usr.status !== "active")
              throw createError.Forbidden("Your Account is Blocked");

            // checking admin expired date
            if (usr?.expiryDate) {
              const exp = await expiryDate(req.user._id);
              // console.log(exp, 'expiryDate');
              if (exp === "expired")
                throw createError.Forbidden(
                  "Your Account is Expired , Please Contact Admin"
                );
            }

            //go to next
            next();
          } else {
            const usr = await Manager.findById(req.user._id).populate(
              "adminID"
            );

            if (usr?.status !== "active")
              throw createError.Forbidden("Your Account is Blocked");

            // checking admin expired date
            if (usr?.expiryDate) {
              const exp = await expiryDate(req.user._id);

              if (exp === "expired")
                throw createError.Forbidden(
                  "Your Account is Expired , Please Contact Admin"
                );
            } else if (usr?.adminID) {
              if (usr?.adminID?.status !== "active")
                throw createError.Forbidden("Your Admin Account is Blocked");
              const exp = await expiryDate(usr.adminID);
              if (exp === "expired")
                throw createError.Forbidden("Your Account is Expired ");
            }

            next();
          }
        } catch (error) {
          res
            .status(error.status || 500)
            .json({
              success: false,
              message: error.message || "Something went wrong",
            });
        }
      });
    } else if (req.headers.authorization) {
      //jwt authorization for app
      const authorizationHeader = req.headers["authorization"];
      // console.log(authorizationHeader, 'qweryuiorew');
      if (!authorizationHeader)
        throw createError.NotFound("No accesstoken in header");

      // Split the header to separate the "Bearer" prefix and the token
      const parts = authorizationHeader.split(" ");
      // console.log(parts, 'part');

      if (parts.length === 2 && parts[0] === "Bearer") {
        const token = parts[1];
        // console.log('JWT Token:', token);

        jwt.verify(token, process.env.JWT_AUTH_SECRET, async (err, user) => {
          try {
            if (err) throw createError.Unauthorized(err);

            //putting that user to request header to access in the protected route
            req.user = user;
            // console.log(req.user, 'helooooooooooo');

            const usr = await Admin.findById(req.user._id);
            if (usr) {
              // console.log(usr, 'helooooooooooo');
              // block or unblock checking
              if (usr.status !== "active")
                throw createError.Forbidden("Your Account is Blocked");

              // checking admin expired date
              if (usr?.expiryDate) {
                const exp = await expiryDate(req.user._id);
                // console.log(exp, 'expiryDate');
                if (exp === "expired")
                  throw createError.Forbidden(
                    "Your Account is Expired , Please Contact Admin"
                  );
              }

              //go to next
              next();
            } else {
              const usr = await Manager.findById(req.user._id).populate(
                "adminID"
              );

              // block or unblock checking
              if (usr?.status !== "active")
                throw createError.Forbidden("Your Account is Blocked");

              // checking admin expired date
              if (usr?.expiryDate) {
                const exp = await expiryDate(req.user._id);

                if (exp === "expired")
                  throw createError.Forbidden(
                    "Your Account is Expired , Please Contact Admin"
                  );
              } else if (usr?.adminID) {
                if (usr?.adminID?.status !== "active")
                  throw createError.Forbidden("Your Admin Account is Blocked");
                const exp = await expiryDate(usr.adminID);
                if (exp === "expired")
                  throw createError.Forbidden("Your Account is Expired ");
              }

              //go to next
              next();
            }
          } catch (error) {
            res
              .status(error.status || 500)
              .json({
                success: false,
                message: error.message || "Something went wrong",
              });
          }
        });
      } else {
        console.log("Invalid Authorization header");
        throw createError.NotFound("Invalid Authorization header");
      }
    } else {
      //throwing error if there is no cookies in header
      throw createError.NotFound("No cookies in header");
    }
  } catch (error) {
    res
      .status(error.status || 500)
      .json({
        success: false,
        message: error.message || "Something went wrong",
      });
  }
};

module.exports = { verifyJwt };
