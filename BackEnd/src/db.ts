import mongoose from "mongoose"

const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const userschema = new Schema({
    email : {type : String,unique : true ,required :true},
    password : {type : String,required :true},
    username : {type : String,required :true},
    verified : Boolean,
    courses :[{type:ObjectId,ref:"course"}]
})

const otpschema = new Schema({
    email : {type : String, unique : true, required : true},
    otp :{type : String,required :true},
    expireAt : {type : Number,required :true},
})  

const adminschema = new Schema({
    email : {type : String,unique : true,required:true},
    password : {type : String,required:true},
    username : {type : String,required:true},
    verified : Boolean
})

const courseschema = new Schema({
    title : String,
    description : String,
    price : Number,
    imageURL : String,
    creatorid : {type:ObjectId,ref:"admin"}
})


export const usermodel = mongoose.model("user",userschema)
export const adminmodel = mongoose.model("admin",adminschema)
export const coursemodel = mongoose.model("course",courseschema)
export const otpmodel = mongoose.model("otp",otpschema)

