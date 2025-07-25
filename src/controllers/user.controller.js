import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    //validation - not empty
    // check if user already exists
    // check for images, check for avatar
    //upload them to cloudinary, avatar
    // create user object - create entry in db
    //remove password and refresh token field from response
    // check for user creation 
    // return res


    const {fullname, email, username, password}  = req.body
    console.log("email:", email);

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }
    // check if user already exists
    const existedUser = await User.findOne({ 
        $or: [
            {username},
            {email}
        ]
    })
    if(existedUser) {
        throw new ApiError(400, "User with email or username already exists")
    }


   // Defensive checks for file uploads
   const avatarLocalPath = req.files?.avatar?.[0]?.path;
//    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
}

   if (!req.files || !req.files.avatar || !Array.isArray(req.files.avatar) || !req.files.avatar[0]) {
       throw new ApiError(400, "Avatar file is required and must be uploaded with field name 'avatar'.");
   }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath) 

    if(!avatar) {
        throw new ApiError(400, "Error uploading avatar");
    }

    const user = await User.create({
        fullname,
       avatar: avatar?.url,
       coverImage: coverImage?.url || "",
       email,
       password,
       username: username.toLowerCase(),
    })

   const createdUser = await User.findById(user._id).select("-password -refreshToken"); 

   if(!createdUser) {
    throw new ApiError(500, "Sommething went wrong, user not created");
   }

   return res.status(201).json(
         new ApiResponse(200, createdUser, "User registered successfully")
   )


})

export { registerUser }