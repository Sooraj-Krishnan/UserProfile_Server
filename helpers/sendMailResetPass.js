/* eslint-disable no-irregular-whitespace */
const nodemailer = require("nodemailer");
const OTPVerification = require("../models/OTPverifyModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Nodemailer configuration
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER,
    pass: process.env.NODEMAILER_PASS,
  },
});

const sendMailResetPass = async (email, res, link, name) => {
  try {
    const OTP = await Math.floor(100000 + Math.random() * 900000).toString();
   

    const hashOtp = await bcrypt.hash(OTP, 10);
    const user = await OTPVerification.findOne({ user: email });
    if (!user) {
      const data = new OTPVerification({
        user: email,
        otp: hashOtp,
        created: Date.now(),
        Expiry: Date.now() + 100000,
      });
      await data.save();
    } else {
      await OTPVerification.updateOne({ user: email }, { otp: hashOtp });
    }

    let info;
    if (link) {
      const token = jwt.sign({ email, OTP }, process.env.JWT_AUTH_SECRET, {
        expiresIn: "5m",
      });
    
      info = await transporter.sendMail({
        from: process.env.NODEMAILER, // sender address
        to: email, // list of receivers
        subject: "ZEEQR Password Reset Link", // Subject line
        text: `Hello User Your link to reset your password is  ${process.env.FRONT_END_RESET_PASSWORD}/${token} `,
        html: `<body style="font-family: Poppins;font-size: 22px; width:900px;">
  
          <header>
              <div style="background-color: black; ">
      
      
                  <nav style="display: flex;">
                      <a href="https://zeeqr.com/">
                          <img alt="zeeqr-logo" src="https://zeeqr2.s3.ap-south-1.amazonaws.com/emailTemplateZeeqr-logo.png" style="margin: 10px; padding-left: 350px;">
                      </a>
      
                  </nav>
              </div>
          </header>
          <div style="padding-left: 100px;padding-right: 100px;">
              <div style="display: flex;justify-content: space-between ;">
                  <div>
                      <h1 style="
      
      
      width: 500px;
      height: 60px;
      font-weight: 600;
      font-size: 26px;
      line-height: 78px;
      
      
      color: #000000;">
                          Password Reset!
                      </h1>
                      <h1 style="
      
      
      width: 194px;
     margin-top:20px;
      
      
      
      font-weight: 500;
      font-size: 22px;
    
      
      color: #000000;
      
      ">
                          Hello  ${name},
                      </h1>
                      <h1 style="
      
      
      width: 500px;
   margin-top:10px;
      font-weight: 300;
      font-size: 16px;
      
      letter-spacing: 0.03em;
      color: #000000;
      
      ">
                          If you've lost your password or wish to reset it,
                          // eslint-disable-next-line no-irregular-whitespace, no-irregular-whitespace, no-irregular-whitespace
                          use the link below to get started.
                      </h1>
                      
                      <div style=" border-radius: 5px;
      margin-top: 50px;
      ">
                        
      <a href=${process.env.FRONT_END_RESET_PASSWORD}/${token}>
                              <button type="submit" style="
      
      
      height: 32px;
      font-weight: 500;
      font-size: 16px;
      line-height: 32px;
      
      color: #FFFFFF;
      
      border: none;
        
      width: 50%;
            height: 40px;
           
            
            background: linear-gradient(270deg, #9C720A 0%, #D7AD44 100%);
            border-radius: 7.13333px;
            ">
                                  Reset your password
                              </button>
                         </a>
                      </div>
      
                  </div>
                  <div>
                      <img style="object-fit: contain; height: 100%;max-width: 100%;"
                          src="https://zeeqr2.s3.ap-south-1.amazonaws.com/emailTemplateForgetLogo.png" />
                  </div>
              </div>
      
              <hr style="height:2px;background: linear-gradient(270deg, #D9AF46 0.13%, #9A7008 100.13%); ">
              </hr>
      
      
              <div style="display:flex;justify-content:space-between;">
                  <div>
                      <p style="width:175px;height:10px;font-size:16px;line-height:46px;color:#000000">Need help?</p>
      
                      <p style="width:500px;height:10px;font-size:16px;line-height:46px;color:#000000">Visit our<span
                              style="color:#0057FF"> help center </span>or call <span style="color:#0057FF">(+971) 50 536
                              3704</span>
                      </p>
                  </div>
                  <div>
                      <p style="width:161px;height:26px;font-size:18px;line-height:46px;color:#000000 ;text-align:center">
                          Follow us
                          on</p>
      
                      <div style="display:flex; gap:10px">
                          <a href="https://www.facebook.com/zeeqrme"><img style="margin-left:5px; width:50px;height:50px" alt="facebookicon"
                                  src="https://zeeqr2.s3.ap-south-1.amazonaws.com/emailTemplateFB.png"></img></a>
                          <a href="https://www.instagram.com/zeeqr.co"> <img style="margin-left:5px; width:50px;height:50px"
                                  alt="instagramicon" src="https://zeeqr2.s3.ap-south-1.amazonaws.com/emailTemplateInsta.png"></img></a>
                          <a href="https://twitter.com/ZEEQR299904"> <img style="margin-left:5px; width:50px;height:50px" alt="twittericon"
                                  src="https://zeeqr2.s3.ap-south-1.amazonaws.com/emailTemplateTwitter.png"></img></a>
                          <a href="https://www.linkedin.com/company/zeeqr"><img style="margin-left:5px; width:50px;height:50px"
                                  alt="linkedinicon" src="https://zeeqr2.s3.ap-south-1.amazonaws.com/emailTemplateLinkedIn.png"></img></a>
                          <a href="https://wa.me/+971505363704?text=Hi%2C"><img style="margin-left:5px; width:50px;height:50px"
                                  alt="whatsappicon" src="https://zeeqr2.s3.ap-south-1.amazonaws.com/emailTemplateWhatsup.png"></img></a>
                      </div>
                  </div>
              </div>
          </div>
      
          <footer style="background:#000000;">
              <div>
                  <p style="text-align:center;color:#FFFFFF;font-size:17px;font-weight:300px;padding-top:10px">powered by</p>
                  <a href="https://zeeqr.com/"> <img style="display:block;margin:auto; height:100px" src="https://zeeqr2.s3.ap-south-1.amazonaws.com/emailTemplatelogofooter.png" alt="footerlogo"></img>  </a>
              </div>
          </footer>
      
      </body>`, // plain text body
      });
    } else {
     
      info = await transporter.sendMail({
        from: process.env.NODEMAILER, // sender address
        to: email, // list of receivers
        subject: "One Time Password for Eventive Events", // Subject line
        text: `Hello User Your six digit OTP for authentication is ${OTP} `, // plain text body
        html: `<p>Hello User Your six digit OTP for authentication is <b>${OTP}</b></p>`, // html body
      });
    }

    if (info.messageId) {
      res.status(200).json({ success: true, message: "Otp send to mail" });
    } else {
      res.status(402).json("something went wrong");
    }
  } catch (error) {
    console.log(error, "send otp error");
    res.status(500).json(error);
  }
};

module.exports = {
  sendMailResetPass,
};
