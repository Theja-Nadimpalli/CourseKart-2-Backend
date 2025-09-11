import express, { Request } from "express"
import { coursemodel, otpmodel, usermodel } from "../db"
import z from "zod"
import bcrypt from "bcrypt"
import nodemailer from "nodemailer"
import jwt from "jsonwebtoken"
import { UserAuth } from "../auth"



interface userRequest extends Request{
    userid?:string
}

export const userRouter = express.Router();


  const reqbody =z.object({
        email : z.string().min(3).email(),
        password : z.string().min(5).max(20).regex(/[A-Z]/).regex(/[0-9]/).regex(/[!@#$%^&*?]/),
        username : z.string().min(3).max(10)

    })

   const transporter = nodemailer.createTransport({
    service:"gmail",
    auth : {
        user : "thejajc123@gmail.com",
        pass : "cfku gqxz lngd fjlv"
    }
   })


userRouter.post("/signup", async (req,res)=>{

    const ParsedData = reqbody.safeParse(req.body)
   
    if (ParsedData.success){
        const data = ParsedData.data
       

          try {
             const hashedPassword = await bcrypt.hash(data.password,5)
               await usermodel.create({

                 email : data.email,
                 password : hashedPassword,
                 username : data.username,
                 verified : false,
                 courses:[] 
                })

            res.json({
                 message: "Signup successful. Please verify your email."
                     })
               }
          catch(err){
            res.json({message : "signup failed or user already exists"})
          }}
     else {
        res.json({
            message : "Validation error"
        })
     }
})

userRouter.post("/verify-email", async(req,res)=>{



    const {email} = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    let user = null
    try {
     user = await otpmodel.findOne({
        email : email
     })
     if(user){
        await otpmodel.updateOne({
            email : email
        },{$set : {otp : otp}})
     } 
     else{
        await otpmodel.create({
                    email : email,
                    otp : otp,
                    expireAt : Date.now() + 5 * 60 * 1000
                })
            }
     await transporter.sendMail({
        from :"thejajc123@gmail.com",
        to : email,
        subject : "verify your email",
        text : `your otp for verification is ${otp}`
        })

        res.json({
            message : "check your mail for otp"
        })
    }catch(err){
        res.json({
            message : "Unknown error occured. Try again"
        })
    }
})

userRouter.post("/verify-status", async (req,res)=>{

    const {email,otp} = req.body
    try{

    const otpentry = await otpmodel.findOne({
        email:email,
        otp:otp
    })
    if (!otpentry || otpentry.expireAt < Date.now()) {
    res.json({ message: "Invalid or expired OTP" }) }
    else {
       const user =  await usermodel.updateOne({
        email:email
       },{$set:{
        verified : true
       }})
    }
    await otpmodel.deleteOne({
        email:email
    })
    res.json({
        message:"verified successfully"
    })
    }catch(err){
        res.json({
            message : "unknown error occured"
        })
    }
})

userRouter.post("/signin",async (req,res)=>{
    const email = req.body.email
    const password = req.body.password
    try{
        const user = await usermodel.findOne({
            email: email
        })
        if(!user){
            res.json({
                message:"user not found"
            })
        }
        else {

            if(!user.verified){
                res.json({
                    message : "please verify your mail"
                })
            }
            else{
               const passmatch = await bcrypt.compare(password, user.password)

             if(passmatch){
                 const token = jwt.sign({
                     _id : user._id.toString()},process.env.USER_JWT_SECRET as string)

                res.json({
                   message :"you are Signed In",
                   your_token : token
                })
                  }
                  else{
                    res.json({
                   message :"check your credentials",
                   })
        }
        
    }}}
    catch(err){
        res.json({
            message :"user not found",
            })
        }
})

userRouter.get("/mycourses",UserAuth,async (req:userRequest,res)=>{

    try{

    const user = await usermodel.findOne({
        _id : req.userid
    })
    if(user){
       const courseIds=user.courses

       const mycourses = await coursemodel.find({
        _id : {$in : courseIds}
       })

       res.json({
        message : mycourses
       })
    }
    else{
        res.json({
            message : "user not found"
        })
    }
}catch(err){
        res.json({
            message : "unknown error occured"
        })
}
})