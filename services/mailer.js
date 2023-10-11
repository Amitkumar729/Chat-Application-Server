const sgMail = require("@sendgrid/mail");

// Just in case if the process env is not acceessable....
// const dotenv = require("dotenv");
// dotenv.config({path: "../.env"});

sgMail.setApiKey(process.env.SG_KEY);

const sendSGMail = async ({
  recipent,
  sender,
  subject,
  html,
  text,
  attachments,
}) => {
  try {
    const form = sender || "demo@gmail.com";

    const msg = {
      to: recipent, // email of the recipent
      from: from, // this will be our verified member
      subject,
      html: html,
      text: text,
      attachments,
    };

    return sgMail.send(msg);
  } catch (error) {
    console.log(error);
  }
};

exports.sendEmail = async (args) => {
  if (process.env.NODE_ENV === "development") {
    return new Promise.resolve();
  } else {
    return this.sendMail(args);
  }
};
