
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

export const sendEmail = (mailOption:Mail.Options)=>{

    const transporter = nodemailer.createTransport({
      service:"gmail",
      port: 465,
      secure: true, 
      auth: {
        user: process.env.SEND_EMAIL,
        pass: process.env.SEND_EMAIL_PASSWORD,
      },
    });
    
    (async () => {
      const info = await transporter.sendMail({
        from: `"Social Media App " <${process.env.SEND_EMAIL}>`,
        ...mailOption
      });
    
      console.log("Message sent:", info.messageId);
    })();
}


export const otpEmail = ()=>{
  return Math.floor(100000 + Math.random() * 999999)
}