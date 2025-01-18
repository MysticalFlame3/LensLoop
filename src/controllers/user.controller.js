import {asynchandler} from '../utils/asynchandler.js';
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const registerUser = asynchandler (async (req,res) => {
    const {fullname,email,username,password} = req.body;
    console.log("email",email);

    if([fullname,email,username,password].some((field)=>
    field?.trim() === "")
    ){
        throw new ApiError(404,"all field are necessary");
        
    }

    const existedUser = User.findOne({
        $or:[{username},{email}]
    });

    if(existedUser){
        throw new ApiError(409,'username or email already exist');
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(404,"avatar is necessary");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(404,"avatar is necessary");

    }

    const User = await User.create({
        fullname,
        email,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        password,
        username:username.toLowerCase()

    })

    const createdUser = await User.findById(User._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500,"something went wrong")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )


})

export {registerUser}
