import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
console.log('Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
console.log('User:', process.env.SMTP_USER);
console.log('Pass Length:', smtpPass.length);
console.log('Pass Start:', smtpPass.substring(0, 4) + '...');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log('Testing SMTP connection...');
transporter.verify(function (error, success) {
  if (error) {
    console.log('Connection error:', error);
  } else {
    console.log('Server is ready to take our messages');
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // send to self
      subject: 'SMTP Connection Test',
      text: 'This is a test email to verify SMTP configuration.'
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log('Send error:', err);
      } else {
        console.log('Email sent successfully:', info.response);
      }
      process.exit();
    });
  }
});
