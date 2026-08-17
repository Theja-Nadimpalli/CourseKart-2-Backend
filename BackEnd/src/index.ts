import dotenv from "dotenv"
dotenv.config()
import express from "express"
import mongoose from "mongoose"
import { usermodel,otpmodel,adminmodel,coursemodel} from "./db"
import { userRouter } from "./routes/user"
import { adminRouter } from "./routes/admin"


mongoose.connect(process.env.MONGODB_URL as string)

const app = express()

app.use(express.json())

app.use("/user",userRouter)

app.use("/admin",adminRouter)


app.listen(3000)