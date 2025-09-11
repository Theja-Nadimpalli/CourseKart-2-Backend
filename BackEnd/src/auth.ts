import express, { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

interface adminRequest extends Request{
    adminid?:string
}
interface userRequest extends Request{
    userid?:string
}

export function  UserAuth(req:userRequest,res:Response,next:NextFunction){

    const token = req.headers.authorization
    if(!token){
        res.json({
            message: "missing authorization header"
        })
        return
    }

    try{

    const mytoken = jwt.verify(token,process.env.USER_JWT_SECRET as string)

    req.userid = (mytoken as jwt.JwtPayload)._id

    next();

    }catch(err){
         
        res.json({
            message : "Verification Failed"
        })
    }
}



export function  AdminAuth(req:adminRequest,res:Response,next:NextFunction){

    const token = req.headers.authorization
    if(!token){
        res.json({
            message: "missing authorization header"
        })
        return
    }

    try{

    const mytoken = jwt.verify(token,process.env.ADMIN_JWT_SECRET as string)

    req.adminid = (mytoken as jwt.JwtPayload)._id

    next();

    }catch(err){
         
        res.json({
            message : "Verification Failed"
        })
    }
}