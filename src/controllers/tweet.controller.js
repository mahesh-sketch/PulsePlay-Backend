import { mongoose, isValidObjectId } from "mongoose";
import Tweet from "../models/tweets.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;

    if (!req.user?._id) {
      throw new ApiError(400, "User not found");
    }

    if (!content) {
      throw new ApiError(400, "Content Required");
    }

    const tweet = await Tweet.create({
      content: content,
      owner: new mongoose.Types.ObjectId(req.user?._id),
    });

    if (!tweet) {
      throw new ApiError(400, "Error in tweet creation");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, tweet, "Tweet Created Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User not found");
    }

    if (!userId) {
      throw new ApiError(400, "Please Provide User Id");
    }

    if (!mongoose.isValidObjectId(userId)) {
      throw new ApiError(400, "Provide Valid User Id");
    }

    const findUserTweet = await Tweet.find({ owner: userId }).select("-_id");

    if (!findUserTweet) {
      throw new ApiError(400, "Error in finding User Tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, findUserTweet, "Tweet Fetched Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;
    const { tweetId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User not found");
    }

    if (!content) {
      throw new ApiError(400, "Content Required");
    }

    if (!tweetId) {
      throw new ApiError(400, "TweetId Required");
    }

    if (!mongoose.isValidObjectId(tweetId)) {
      throw new ApiError(400, "Provide Valid Tweet Id");
    }

    const updateTweets = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: {
          content: content,
        },
      },
      {
        new: true,
      }
    ).select("-_id");

    if (!updateTweets) {
      throw new ApiError(400, "Error in updating Content");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updateTweets, "Tweet Updated Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User not found");
    }

    if (!tweetId) {
      throw new ApiError(400, "TweetId Required");
    }

    if (!mongoose.isValidObjectId(tweetId)) {
      throw new ApiError(400, "Provide Valid Tweet Id");
    }

    const deletedTweet = await Tweet.deleteOne({ _id: tweetId });
    return res
      .status(200)
      .json(new ApiResponse(200, deletedTweet, "Tweet Deleted Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const tweetController = {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
};

export default tweetController;
