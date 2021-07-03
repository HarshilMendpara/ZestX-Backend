const client = require("../configs/database");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config();

var nodemailer = require("nodemailer");
const baseurl_for_user_verification =
  "https://whispering-ridge-40670.herokuapp.com/user/verifyuser/";

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "verify.zestx@gmail.com",
    pass: process.env.VERIFY_PASSWORD,
  },
});

exports.changePassword = async (req, res) => {
  const userId = req.userId;
  const { oldPassword, newPassword } = req.body;

  try {
    const data = await client.query('SELECT * FROM users where user_id = $1', [userId]);

    bcrypt.compare(oldPassword, data.rows[0].password, function (err, result) {
      if (result)
        bcrypt.hash(newPassword, 10, async function (err, hash) {
          await client.query(
            'UPDATE users SET password=$1 where user_id=$2', [hash, userId]
          );

          return res.status(200).json({
            message: "password updated successfully!",
          });
        });

      return res.status(400).json({
        message: "Incorrect password!",
      });

    });
  } catch (err1) {
    return res.status(500).json({
      error: `${err1}`,
    });
  }
}

exports.getDetails = async (req, res) => {

  const userId = req.userId;
  try {
    const data = await client.query(
      'SELECT * FROM users where user_id = $1', [userId]
    );
    const userData = data.rows[0];

    return res.status(200).json({
      data: userData,
    });
  } catch (err) {
    return res.status(500).json({
      error: `${err}`,
    });
  }
};

exports.updateDetails = async (req, res) => {
  const boolvalue = false;
  const userEmail = req.email;
  const userId = req.userId;
  const { user_name, email, password, mobile } = req.body;
  try {
    const data = await client.query('SELECT * FROM users where user_id = $1', [userId]);

    if (userEmail == email) {
      bcrypt.compare(password, data.rows[0].password, async function (err, result) {
        if (!result)
          return res.status(400).json({
            message: "Incorrect password!",
          });

        await client.query(
          'UPDATE users SET user_name=$1, mobile=$2 where user_id=$3', [user_name, mobile, userId]
        );

        return res.status(200).json({
          message: "details updated successfully!",
        });

      });
    } else {
      bcrypt.compare(password, data.rows[0].password, async function (err, result) {
        if (!result)
          return res.status(400).json({
            message: "Incorrect password!",
          });

        await client.query(
          'UPDATE users SET user_name=$1, email=$2, mobile=$3, is_verified=$4 where user_id=$5', [user_name, email, mobile, boolvalue, userId]
        );
        const token = jwt.sign(
          {
            email: email,
            userId: userId,
          },
          "" + process.env.SECRET_KEY
        );
        var link = baseurl_for_user_verification + token;

        var mailOptions = {
          from: "verify.zestx@gmail.com",
          to: `${email}`,
          subject: "Confirmation mail",
          html: `click <a href=${link}>here</a> to confirm your mail`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          console.log("Email sent: " + info.response);
        });
        return res.status(222).json({
          message: "details updated successfully!",
          token: `${token}`,
        });


      });
    }
  } catch (err1) {
    return res.status(500).json({
      error: `${err1}`,
    });
  }
};

exports.verifyUser = async (req, res) => {
  const userToken = req.userToken;

  var userId = jwt.decode(userToken).userId;
  var boolvalue = true;

  try {
    await client.query(
      'UPDATE users SET is_verified=$1 where user_id=$2', [boolvalue, userId]
    );
    var options = {
      root: path.join(__dirname),
    };

    var fileName = "user_verified.html";
    return res.status(200).sendFile(fileName, options);

  } catch (err) {
    return res.status(500).json({
      error: `${err2}`,
    });
  }
};

