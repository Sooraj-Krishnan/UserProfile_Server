const mongoose = require("mongoose");
const Admin = require("./adminModel");

const validateEmail = function (email) {
  // var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

const UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    validate: [validateEmail, "Please fill a valid email address"],
    required: [true, "Email is required"],
    unique: true,
  },
  phone: {
    type: Number,
    minlength: [10, "phone number must be 10 digits"],
    required: [true, "Phone number is required"],
  },
  // companyName: String,
  //   adminID: {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: Admin,
  //   },
  password: {
    type: String,
    minlength: [6, "Password must contain 6 letters"],
    required: [true, "Password is required"],
  },
  profileImage: {
    type: String,
  },
  status: {
    type: String,
    default: "active",
  },
  userType: {
    type: String,
    default: "normal",
  },

  createdDate: {
    type: Date,
    default: Date.now(),
  },
});
mongoose.set("strictQuery", false);

const User = mongoose.model("User", UserSchema);
module.exports = User;
