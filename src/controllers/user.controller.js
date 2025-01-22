import {asynchandler} from '../utils/asynchandler.js';
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const registerUser = asynchandler (async (req,res) => {
    const {fullname,email,username,password} = req.body;
    console.log("email",email);

    

    if([fullname,email,username,password].some((field)=>
    field?.trim() === "")
    ){
        throw new ApiError(404,"all field are necessary");
        
    }
    
    const existedUser = await User.findOne({
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

    const newUser = await User.create({
        fullname,
        email,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(newUser._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500,"something went wrong")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )

})

const generateAndRefreshAccessToken = async (userid) => {
    try {
        const newUser = await User.findById(userid)
        if (!newUser) {
            throw new ApiError(404, "User not found");
        }
        const accessToken = newUser.generateAccessToken()
        const refreshToken = newUser.generateRefreshToken()

        newUser.refreshToken = refreshToken;
        await newUser.save({ validateBeforeSave: false });

        return {accessToken,refreshToken}

    } catch (error) {
        console.error(error);
        throw new ApiError(404,"Something went wrong while generating refresh and access token")
        
    }
}

const loginUser = asynchandler(async (req,res) =>{
    const {username,email,password} = req.body;

    if(!username || !email){
        throw new ApiError(404, "user does not exist");
    }

    const newUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    const isPasswordValid = await newUser.isPasswordCorrect(password); 

    if(!isPasswordValid){
        throw new ApiError(404, "password is wrong");
    }

    const {accessToken,refreshToken} = await generateAndRefreshAccessToken(newUser._id)
    console.log("Generated Access Token:", accessToken); 
    console.log("Generated Refresh Token:", refreshToken);

    const loggedInUser = await User.findById(newUser._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)  
    .cookie("refreshToken", refreshToken, options) 
    .json({ newUser: loggedInUser, accessToken, refreshToken, message: "user logged in successfully" });
 



})

const logoutUser = asynchandler(async(req,res)=>{
    await User.findByIdAndUpdate (
        req.newUser._id,
        {
            $set:{
                refreshToken: undefined

                }
            

        },
        {
            new:true
        }
    );
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .status(200)
    .json({
        statusCode: 200,
        message: "User logged out successfully",
        success: true,
    });
    

})

const refreshAccessToken = asynchandler(async (req,res) =>{
    try{
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if(!incomingRefreshToken){
            throw new ApiError(400,"invalid token")
        }

        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

        const newUser = await User.findById(decodedToken?._id)
        
        if(!newUser){
            throw new ApiError(400,"invalid refresh token")

        }

        if(incomingRefreshToken!== newUser?.refreshToken){
            throw new ApiError(404,"invalid access token")
        }

        const options = {
            httpOnly:true,
            secure:true
        }

        const{accessToken,newRefreshToken} = await generateAndRefreshAccessToken(newUser._id)

        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "access token refreshed"
            )
        )
    }catch(error){
        throw new ApiError(401,error?.message||"invalid token")
    }

})


export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}


