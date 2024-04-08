const Manager = require("../models/managerModel");
const Admin = require("../models/adminModel");
const KitchenStaff = require("../models/kitchenStaffModel");
const Waiter = require("../models/waiterModel");
const bcrypt = require("bcrypt");
const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const { genAccessToken, genRefreshToken } = require("../helpers/jwt");
const createHttpError = require("http-errors");
const { expiryDate } = require("../helpers/expiryDate");
const OTPVerification = require("../models/OTPverifyModel");
const { sendMailResetPass } = require("../helpers/sendMailResetPass");

let refreshTokenArray = [];

/* ---------------------------------- login --------------------------------- */

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // check the email is in the database
    const admin = await Admin.findOne({ email: email });

    if (admin) {
      // block or unblock checking
      if (admin.status !== "active")
        throw createError.Unauthorized("Your Account is Blocked");
      // checking expiry date
      const exp = await expiryDate(admin._id);
      if (exp === "expired")
        throw createError.Unauthorized(
          "Your Account is Expired , Please Contact Admin"
        );

      // comparing the password
      const pswrd = await bcrypt.compare(password, admin.password);
      if (!pswrd) throw createError.Unauthorized("password is incorrect");

      // generating acess-token and refresh-token
      const accessToken = await genAccessToken(admin);
      const refreshToken = await genRefreshToken(admin);

      // set the refresh-token in to an array
      refreshTokenArray.push(refreshToken);

      // set the access-token to the cookies
      res
        .status(200)
        .cookie("accessToken", accessToken, {
          httpOnly: true,
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: "strict",
        })
        .json({ success: true, admin, refreshToken });
    } else {
      const user = await Manager.findOne({ email: email }).populate("adminID");
      if (!user) throw createError.NotFound("No user found");

      // block or unblock checking
      if (!user.status === "active")
        throw createError.Unauthorized("Your Account is Blocked");

      // checking admin expired date
      if (user?.adminID) {
        if (user?.adminID?.status !== "active")
          throw createError.Forbidden("Your Admin Account is Blocked");
        const exp = await expiryDate(user.adminID);
        if (exp === "expired")
          throw createError.Unauthorized(
            "Your Account is Expired , Please Contact Admin"
          );
      }

      // comparing the password
      const pswrd = await bcrypt.compare(password, user.password);
      if (!pswrd) throw createError.Unauthorized("password is incorrect");

      // generating acess-token and refresh-token
      const accessToken = await genAccessToken(user);
      const refreshToken = await genRefreshToken(user);

      // set the refresh-token in to an array
      refreshTokenArray.push(refreshToken);

      // set the access-token to the cookies
      res
        .status(200)
        .cookie("accessToken", accessToken, {
          httpOnly: true,
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: "strict",
        })
        .json({
          success: true,
          user,
          refreshToken,
          accessToken,
        });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//Employee Login

const employeeLogin = async (req, res, next) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    const waiter = await Waiter.findOne({ email: email }).populate("adminID");

    if (waiter) {
      if (!waiter) throw createError.NotFound("No user found");
      if (waiter.status !== "active")
        throw createError.Unauthorized("Your Account is Blocked");

      if (waiter?.adminID) {
        if (waiter?.adminID?.status !== "active")
          throw createError.Forbidden("Your Admin Account is Blocked");
        const exp = await expiryDate(waiter.adminID);
        if (exp === "expired")
          throw createError.Unauthorized(
            "Your Account is Expired , Please Contact Admin"
          );
      }
      const pswrd = await bcrypt.compare(password, waiter.password);
      if (!pswrd) throw createError.Unauthorized("password is incorrect");
      const accessToken = await genAccessToken(waiter);
      const refreshToken = await genRefreshToken(waiter);
      refreshTokenArray.push(refreshToken);
      res
        .status(200)
        .cookie("accessToken", accessToken, {
          httpOnly: true,
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: "strict",
        })
        .json({
          success: true,
          waiter,
          refreshToken,
          accessToken,
        });
    } else {
      const kitchen = await KitchenStaff.findOne({ email: email }).populate(
        "adminID"
      );
      if (!kitchen) throw createError.NotFound("No user found");
      if (kitchen.status !== "active")
        throw createError.Unauthorized("Your Account is Blocked");

      if (kitchen?.adminID) {
        if (kitchen?.adminID?.status !== "active")
          throw createError.Forbidden("Your Admin Account is Blocked");
        const exp = await expiryDate(kitchen.adminID);
        if (exp === "expired")
          throw createError.Unauthorized(
            "Your Account is Expired , Please Contact Admin"
          );
      }
      const pswrd = await bcrypt.compare(password, kitchen.password);
      if (!pswrd) throw createError.Unauthorized("password is incorrect");
      const accessToken = await genAccessToken(kitchen);
      const refreshToken = await genRefreshToken(kitchen);
      refreshTokenArray.push(refreshToken);
      res
        .status(200)
        .cookie("accessToken", accessToken, {
          httpOnly: true,
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: "strict",
        })
        .json({
          success: true,
          kitchen,
          refreshToken,
          accessToken,
        });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refToken } = req.body;

    //if there is no ref token throwing err
    if (!refToken)
      throw createHttpError.InternalServerError("no refresh token found");

    //get the ref token from the array with
    if (!refreshTokenArray.includes(refToken))
      throw createError.InternalServerError("Invalid refresh token");

    //verify the ref token from array
    jwt.verify(
      refToken,
      process.env.JWT_REFRESH_TOKEN_SECRET,
      async (err, data) => {
        try {
          if (err) throw createError.InternalServerError(err);

          //finding the user
          const userId = data._id;
          let user = await Admin.findOne({ _id: userId });
          if (!user) {
            user = await Manager.findOne({ _id: userId });
          }

          if (!user) {
            user = await Waiter.findOne({ _id: userId });
          }

          if (!user) {
            user = await KitchenStaff.findOne({ _id: userId });
          }
          if (user) {
            //black listing the used refresh token
            refreshTokenArray = refreshTokenArray.filter(
              (item) => item != refToken
            );

            //if it matches create a new pair of auth token and refresh token
            const accessToken = await genAccessToken(user);
            const refreshToken = await genRefreshToken(user);

            //saving the new refresh token to array
            refreshTokenArray.push(refreshToken);

            //sending response to the client
            res
              .status(200)
              .cookie("accessToken", accessToken, {
                httpOnly: true,
                path: "/",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                sameSite: "strict",
              })
              .json({
                success: true,
                admin: true,
                message: "new pair of tokens created",
                refreshToken,
              });
          } else {
            throw createError.NotFound("User not found");
          }
        } catch (error) {
          next(error);
        }
      }
    );
  } catch (error) {
    console.log(error, "123456");
    next(error);
  }
};

const logout = (req, res, next) => {
  try {
    //get the ref token from body
    const { refToken } = req.body;
    //if there is no ref token throwing err
    if (!refToken)
      throw createHttpError.InternalServerError("no refresh token found");

    //if it matches
    jwt.verify(refToken, process.env.JWT_REFRESH_TOKEN_SECRET, async (err) => {
      try {
        if (err) throw createError.Unauthorized(err);

        //black listing the used refresh token
        refreshTokenArray = refreshTokenArray.filter(
          (item) => item != refToken
        );

        res
          .clearCookie("accessToken")
          .json({ success: true, message: "Logged out successfully" });
      } catch (error) {
        next(error);
      }
    });
  } catch (error) {
    console.log(error, "123456");
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const link = true;
    const { email } = req.body;
    let user = await Admin.findOne({ email: email });

    if (!user) {
      user = await Manager.findOne({ email: email });
    }

    if (!user) {
      user = await Waiter.findOne({ email: email });
    }

    if (!user) {
      user = await KitchenStaff.findOne({ email: email });
    }

    if (user) {
      // block or unblock checking
      if (user.status !== "active")
        throw createError.Unauthorized("Your Account is Blocked");

      const name = user.name;
      await sendMailResetPass(email, res, link, name);
    } else {
      throw createError.NotFound("No user found");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/* --------------------------- UPDATE NEW PASSWORD -------------------------- */

const updateNewPassword = async (req, res, next) => {
  try {
    const { token, pass } = req.body;
    jwt.verify(token, process.env.JWT_AUTH_SECRET, async (err, user) => {
      try {
        if (err) throw createError.InternalServerError(err);
        const person = await OTPVerification.findOne({ user: user.email });
        if (person) {
          const validUrl = await bcrypt.compare(user.OTP, person.otp);
          console.log(validUrl, "validdd");
          if (validUrl) {
            const password = await bcrypt.hash(pass, 10);

            let userToUpdate = await Admin.findOne({ email: user.email });

            if (!userToUpdate) {
              userToUpdate = await Manager.findOne({ email: user.email });
            }

            if (!userToUpdate) {
              userToUpdate = await Waiter.findOne({ email: user.email });
            }

            if (!userToUpdate) {
              userToUpdate = await KitchenStaff.findOne({ email: user.email });
            }

            if (userToUpdate) {
              await userToUpdate.updateOne(
                { email: user.email },
                { $set: { password: password } }
              );
              await person.updateOne({ otp: "used" });
              res
                .status(200)
                .json({ message: "Password updated Successfully" });
            } else {
              throw createError.NotFound("User not found");
            }
          } else {
            res.status(403).json({ message: "Authentication Failed" });
          }
        } else {
          res.status(403).json({ message: "Authentication Failed" });
        }
      } catch (error) {
        next(error);
      }
    });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

module.exports = {
  login,
  employeeLogin,
  refreshToken,
  logout,
  forgotPassword,
  updateNewPassword,
};
