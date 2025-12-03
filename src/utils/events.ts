import { EventEmitter } from "events";
import { sendEmail } from "../service/sendEmail";
import { templateEmail } from "../service/templateEmail";
const eventEmitter = new EventEmitter();

eventEmitter.on("confirmEmail", (otp:string,email:string)=>{
    sendEmail({
        to:email,
        subject:"Confirm Email",
        text:"Please confirm your email",
        html:templateEmail(otp,"Confirm Email")
    })
})
eventEmitter.on("forgetPassword", (otp:string,email:string)=>{
    sendEmail({
        to:email,
        subject:"Forget Password",
        text:"Please confirm your email",
        html:templateEmail(otp,"Forget Password")
    })
})

export default eventEmitter;