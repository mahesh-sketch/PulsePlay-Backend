import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //Take all the value from Frontend
  const { username, email, fullName, password } = req.body;

  //Best way to check where there is empty field or not if empty then throw error
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required");
  }

  //email Validation
  const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  //password Validation
  const passRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  console.log(password);
  if (!passRegex.test(password.trim())) {
    console.log(passRegex.test(password.trim()));
    console.log("Validation Failed");
    throw new ApiError(
      400,
      "Password must be Minimum eight and maximum 10 characters, at least one uppercase letter, one lowercase letter, one number and one special character"
    );
  }

  //Check user is existed or not by querying to Database
  const existerUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existerUser) {
    throw new ApiError(409, "User With Email or Username already Exists");
  }

  //Take the avatar and coverimage file path from req and check
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is Required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath, "User Avatar");
  const coverImage = await uploadOnCloudinary(
    coverImageLocalPath,
    "User CoverImage"
  );

  if (!avatar) {
    throw new ApiError(400, "Avatar File is Required");
  }
  //Create of user account to store the data in to database
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong while Registering the user");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {});

const userController = {
  registerUser,
  loginUser,
};
export default userController;
