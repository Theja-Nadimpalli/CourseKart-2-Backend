import express, { Request } from "express"
import { adminmodel, coursemodel, otpmodel, usermodel } from "../db"
import z from "zod"
import bcrypt from "bcrypt"
import nodemailer from "nodemailer"
import jwt from "jsonwebtoken"
import { AdminAuth, UserAuth } from "../auth"



interface adminRequest extends Request{
    adminid?:string
}


export const adminRouter = express.Router();


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
 const coursebody =z.object({
        title : z.string().max(20),
        description : z.string().max(100),
        price : z.number(),
        imageURL : z.string()
    })

adminRouter.post("/signup", async (req,res)=>{

    const ParsedData = reqbody.safeParse(req.body)
   
    if (ParsedData.success){
        const data = ParsedData.data
       

          try {
             const hashedPassword = await bcrypt.hash(data.password,5)
               await adminmodel.create({

                 email : data.email,
                 password : hashedPassword,
                 username : data.username,
                 verified : false,
                })

            res.json({
                 message: "Signup successful. Please verify your email."
                     })
               }
          catch(err){
            res.json({message : "signup failed or admin already exists",
                      error: err
            })
          }}
     else {
        res.json({
            message : "Validation error"
        })
     }
})

adminRouter.post("/verify-email", async(req,res)=>{



    const {email} = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    let admin = null
    try {
     admin = await otpmodel.findOne({
        email : email
     })
     if(admin){
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

adminRouter.post("/verify-status", async (req,res)=>{

    const {email,otp} = req.body
    try{

    const otpentry = await otpmodel.findOne({
        email:email,
        otp:otp
    })
    if (!otpentry || otpentry.expireAt < Date.now()) {
    res.json({ message: "Invalid or expired OTP" }) }
    else {
       const user =  await adminmodel.updateOne({
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

adminRouter.post("/signin",async (req,res)=>{
    const email = req.body.email
    const password = req.body.password
    try{
        const admin = await adminmodel.findOne({
            email: email
        })
        if(!admin){
            res.json({
                message:"user not found"
            })
        }
        else {

            if(!admin.verified){
                res.json({
                    message : "please verify your mail"
                })
            }
            else{
               const passmatch = await bcrypt.compare(password, admin.password)

             if(passmatch){
                 const token = jwt.sign({
                     _id : admin._id.toString()},process.env.ADMIN_JWT_SECRET as string)

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
            message :"admin not found",
            })
        }
})

adminRouter.post("/course",AdminAuth,async (req:adminRequest,res)=>{

   const parsedata = coursebody.safeParse(req.body)
   if(!parsedata.success){
    res.json({
        message:"Validation Error",
        error : parsedata.error
    })
    return}
    const data = parsedata.data
        try{
            const course = await coursemodel.create({
                title : data.title,
                description : data.description,
                price : data.price,
                imageURL : data.imageURL,
                creatorid : req.adminid
            })
            res.json({
                message :"Successfully Created",
                courseid :course._id
            })
        }
        catch(err){
            res.json({
                message :"course is not created"
            })
        }


})

adminRouter.put("/course",AdminAuth,async (req:adminRequest,res)=>{
    try{
    const course = await coursemodel.updateOne({
     _id : req.headers.courseid,
     creatorid : req.adminid
    },
    {
        $set : req.body
    })
    res.json({
    message : "successfully updated",
    course : course
    })
   }
   catch(err){
    res.json({
        message : "Not updated"
        })
   }
})

adminRouter.get("/course/bulk",AdminAuth,async(req:adminRequest,res)=>{
try{
    const mycourses = await coursemodel.find({
        creatorid : req.adminid
    })
    res.json({
        courses : mycourses
    })
}
catch(err){
    res.json({
        message : "error"
    })
}
})