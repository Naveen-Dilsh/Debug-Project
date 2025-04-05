const nodemailer = require("nodemailer");
const fs = require("fs");
var handlebars = require("handlebars");

async function sendEmail(to, subject, html, content) {
  // Read the HTML template and image file
  const htmlTemplate = await fs.readFileSync(
    `public/template/${html}`,
    "utf-8"
  );
  var template = handlebars.compile(htmlTemplate);
  var htmlToSend = template(content);

  // const imageAttachment = await fs.readFileSync("path/to/your/image.png");

  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.FROM_EMAIL,
        pass: process.env.FROM_PASS,
      },
    });

    var mailOptions = {
      from: `Wren <${process.env.FROM_EMAIL}>`,
      to,
      subject: subject,
      html: htmlToSend,
    };
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log("Message sent failed: " + error);
          reject(error);
        } else {
          console.log("Message sent: " + info.response);
          resolve(info.response);
        }
      });
    });
  } catch (err) {
    console.log(`Error while sent password via mail: ${err}`);
  }
}

module.exports = sendEmail;
