import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //save the refreshtoken to database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something Went Wrong while generating token"
    );
  }
};

const registerUser = asyncHandler(async (req, _, res) => {
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
  if (!passRegex.test(password.trim())) {
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

const loginUser = asyncHandler(async (req, res) => {
  //take data from user
  const { username, email, password } = req.body;

  //if both are not given by user
  if (!username && !email) {
    throw new ApiError(400, "Username or password Required");
  }

  //found the user from database
  const user = await User.findOne({ $or: [{ username }, { email }] });

  //if user is not found
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  //password verify
  const isPasswordVaild = await user.isPasswordCorrect(password);
  if (!isPasswordVaild) {
    throw new ApiError(401, "Invaild user Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //want all except password and refreshToken
  const loggedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //now send the cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedUser,
          accessToken,
          refreshToken,
        },
        "User logged Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined,
    },
  });

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User Logout successfully"), {
      user: user,
    });
});

const userController = {
  registerUser,
  loginUser,
  logoutUser,
};
export default userController;
