import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import cloudinaryMethod from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import Jwt from "jsonwebtoken";
import fs from "fs";
import mongoose from "mongoose";

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

const registerUser = asyncHandler(async (req, res) => {
  //Take all the value from Frontend
  try {
    const { username, email, fullName, password } = req.body;

    //Best way to check where there is empty field or not if empty then throw error
    if (
      [username, email, fullName, password].some(
        (field) => field?.trim() === ""
      )
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
    const avatar = await cloudinaryMethod.uploadOnCloudinary(
      avatarLocalPath,
      "User Avatar"
    );
    const coverImage = await cloudinaryMethod.uploadOnCloudinary(
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
      avatarImgId: avatar.public_id,
      coverImgId: coverImage.public_id,
    });
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(
        500,
        "Something Went Wrong while Registering the user"
      );
    }
    return res
      .status(200)
      .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $unset: {
        refreshToken: 1,
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
      .json(new ApiResponse(200, {}, "User Logout successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }
    const decodedToken = Jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invaild Refresh Token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invaild Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword, confPassword } = req.body;

    if (newPassword !== confPassword) {
      throw new ApiError(400, "Password not matched");
    }
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invaild old password");
    }
    const passRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passRegex.test(newPassword.trim())) {
      throw new ApiError(
        400,
        "Password must be Minimum eight and maximum 10 characters, at least one uppercase letter, one lowercase letter, one number and one special character"
      );
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Changed Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(400, "User Not Found");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, req.user, "Current user fetched successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  try {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
      throw new ApiError(400, "All fields are required");
    }

    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email format");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          email: email,
        },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { userData: user },
          "Account details updated successfully"
        )
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    if (!req.file || Object.keys(req.file).length === 0) {
      throw new ApiError(401, "please upload the avatar");
    }

    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar Image File is missing");
    }

    const user = await User.findById(req.user?._id);
    if (user.length == 0 || !user) {
      throw new ApiError(404, "User not found");
    }
    const deletedImageResponse = await cloudinaryMethod.deleteOncloudinary(
      user.avatarImgId
    );
    if (!deletedImageResponse) {
      throw new ApiError(500, "Problem while deleting avatar from cloudinary");
    }

    const avatar = await cloudinaryMethod.uploadOnCloudinary(
      avatarLocalPath,
      "User Avatar"
    );
    if (!avatar.url) {
      throw new ApiError(400, "Error while uploading");
    }
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
          avatarImgId: avatar.public_id,
        },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Avatar updated Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file || Object.keys(req.file).length === 0) {
      throw new ApiError(401, "please upload the avatar");
    }

    const coverLocalPath = req.file?.path;
    if (!coverLocalPath) {
      throw new ApiError(400, "Cover Image File is missing");
    }

    const user = await User.findById(req.user?._id);
    if (user.length == 0 || !user) {
      throw new ApiError(404, "User not found");
    }
    const deletedImageResponse = await cloudinaryMethod.deleteOncloudinary(
      user.coverImgId
    );
    if (!deletedImageResponse) {
      throw new ApiError(500, "Problem while deleting avatar from cloudinary");
    }

    const coverimage = await cloudinaryMethod.uploadOnCloudinary(
      coverLocalPath,
      "User CoverImage"
    );
    if (!coverimage.url) {
      throw new ApiError(400, "Error while uploading");
    }
    if (coverLocalPath && fs.existsSync(coverLocalPath)) {
      fs.unlinkSync(coverLocalPath);
    }
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverimage.url,
          coverImgId: coverimage.public_id,
        },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Cover Image updated Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  try {
    const { username } = req.params;

    if (!username?.trim() || !username) {
      throw new ApiError(400, "User is Missing");
    }
    const channel = await User.aggregate([
      {
        $match: {
          username: username?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subscription",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscription",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          channelsSubsribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          subscribersCount: 1,
          channelsSubsribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
        },
      },
    ]);
    console.log(channel);
    if (!channel?.length) {
      throw new ApiError(404, "Channel doesnot exists");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const getWatchHistory = asyncHandler(async (req, res) => {
  // in mongoose when we wrote req.user._id it provide us the mongoDB ID in a string
  // but in aggregate we need to convert orignal objecId into normal string
  // coz in aggregate we can't use mongoose
  try {
    const user = await User.aggregate([
      {
        $match: {
          // like this , now we get the user ID
          _id: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            // this is a nested pipline to find out user data in videos model
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner", // now again use sub-pipline, coz owner have all fields of users so minus some field
              },
            },
            {
              $unwind: "$owner",
            },
            {
              $project: {
                username: "$owner.username",
                avatar: "$owner.avatar",
              },
            },
          ],
        },
      },
    ]);
    if (!user?.length || user.length > 0) {
      throw new ApiError(404, "watch history not found");
    }
    // console.log("User: ", user[0].watchHistory);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user[0].watchHistory,
          "watch history fetched successfully"
        )
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const addtoWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!req.user?._id) {
    throw new ApiError(400, "Invaild User Id");
  }
  if (!videoId) {
    throw new ApiError(404, "Invaild Video Id");
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $addToSet: {
          watchHistory: videoId,
        },
      },
      { new: true }
    ).select("-password -refreshToken -avatarImgId -coverImgId");
    if (!user) {
      throw new ApiError(404, "watch history user's not added");
    }
    console.log(user);
    return res
      .status(200)
      .json(new ApiResponse(200, user, "Video added to watch history"));
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message ||
        "internal server error while tracking user's watch history"
    );
  }
});

const userController = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  addtoWatchHistory,
};
export default userController;
