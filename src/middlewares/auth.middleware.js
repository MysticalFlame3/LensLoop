import {asynchandler} from '../utils/asynchandler.js'
import {User} from '../models/user.model.js'
import {ApiError} from '../utils/ApiError.js'
import jwt from "jsonwebtoken";  


export const verifyJWT = asynchandler(async(req, res,next) => {
    try{
        console.log('JWT middleware triggered'); 
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "").trim();
        console.log("Received Token:", token);  // Log the token
        console.log("Secret:", process.env.ACCESS_TOKEN_SECRET);  // Log the secret
        if(!token){
            throw new ApiError(401,"unauthorized request")
        }
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        console.log(decodedToken);

        const newUser = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if(!newUser){
            throw new ApiError(401,error?.message||401,"invalid access token")
        }

        req.newUser = newUser;
        next()
    }catch(error){
        throw new ApiError(401,"invalid token")

    }
})