import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, text: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your-email@gmail.com",  // Replace with your email
      pass: "your-email-password",   // Replace with app password
    },
  });

  await transporter.sendMail({
    from: "Your App <your-email@gmail.com>",
    to,
    subject,
    text,
  });
};
