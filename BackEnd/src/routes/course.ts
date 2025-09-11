import express, { Request } from "express"
import { UserAuth } from "../auth"
import { coursemodel, usermodel } from "../db"

const courseRouter = express.Router()

interface userRequest extends Request{
    userid?:string
}

courseRouter.post("/purchase",UserAuth,async(req:userRequest,res)=>{
   
    const {courseid} = req.body
    

try{
    const user = await usermodel.findOne({
        _id : req.userid
    })
    if(!user){
        res.json({
            message: "User not found"
        })
        return
    }
    
   await usermodel.updateOne({
    _id : user._id,
   },{
   $set: { courses: [...user.courses, courseid] }
     }
   )
   res.json({
    message : "Purchase Successfull"
   })
}
catch(err){
    res.json({
        message : "Purchase Failed. Try Again"
       }) 
}
    
})

courseRouter.get("/AllCourses", async (req,res)=>{

    try {
        const AllCourses = await coursemodel.find({})

        res.json({
            message : AllCourses
        })
    }catch(err){
        res.json({
            message: "Unknown Error Occured"
        })
    }
})