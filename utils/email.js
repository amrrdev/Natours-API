import nodemiler from "nodemailer";

export default async (options) => {
    // create a transporter
    const transporter = nodemiler.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // email options
    const mailOptions = {
        from: "John Snow <JohnSnow@gmail.com>",
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transporter.sendMail(mailOptions);
};
