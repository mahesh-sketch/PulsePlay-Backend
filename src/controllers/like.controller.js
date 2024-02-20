import { mongoose, isValidObjectId } from "mongoose";
import Like from "../models/likes.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User not found");
    }
    if (!videoId) {
      throw new ApiError(400, "Video Id not Provided");
    }
    if (!mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Please Provide Valid VideoId");
    }

    const existingLike = await Like.findOne({
      video: videoId,
      likedBy: req.user?._id,
    });

    if (existingLike) {
      const deletionResult = await Like.deleteOne({
        video: videoId,
        likedBy: req.user?._id,
      });

      if (deletionResult.deletedCount > 0) {
        return res
          .status(200)
          .json(new ApiResponse(200, [], "Video Dislike Successfully"));
      }
    }

    const likeDoc = await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });

    if (!likeDoc) {
      throw new ApiError(401, "Problems in Like the video");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, likeDoc, "Video Like Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User not found");
    }
    if (!commentId) {
      throw new ApiError(400, "Comment Id not Provided");
    }
    if (!mongoose.isValidObjectId(commentId)) {
      throw new ApiError(400, "Please Provide Valid CommentID");
    }

    const existingLike = await Like.findOne({
      comment: commentId,
      likedBy: req.user?._id,
    });

    if (existingLike) {
      const deletionResult = await Like.deleteOne({
        comment: commentId,
        likedBy: req.user?._id,
      });

      if (deletionResult.deletedCount > 0) {
        return res
          .status(200)
          .json(new ApiResponse(200, [], "Comment Dislike Successfully"));
      }
    }

    const likeDoc = await Like.create({
      video: commentId,
      likedBy: req.user?._id,
    });

    if (!likeDoc) {
      throw new ApiError(401, "Problems in Like the Comment");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, likeDoc, "Comment Like Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User not found");
    }
    if (!tweetId) {
      throw new ApiError(400, "Tweet Id not Provided");
    }
    if (!mongoose.isValidObjectId(tweetId)) {
      throw new ApiError(400, "Please Provide Valid TweetId");
    }

    const existingLike = await Like.findOne({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    if (existingLike) {
      const deletionResult = await Like.deleteOne({
        tweet: tweetId,
        likedBy: req.user?._id,
      });

      if (deletionResult.deletedCount > 0) {
        return res
          .status(200)
          .json(new ApiResponse(200, [], "Tweet Dislike Successfully"));
      }
    }

    const likeDoc = await Like.create({
      video: tweetId,
      likedBy: req.user?._id,
    });

    if (!likeDoc) {
      throw new ApiError(401, "Problems in Like the Tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, likeDoc, "Tweet Like Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(400, "User not Found");
    }

    const allVideoLike = await Like.find({
      video: { $exists: true },
      likedBy: req.user?._id,
    }).populate("video");

    if (!allVideoLike || allVideoLike.length === 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(200, allVideoLike || [], "No Video like available")
        );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, allVideoLike, " Video like Fetch successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const getLikedByVideoId = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User not found");
    }
    if (!videoId) {
      throw new ApiError(400, "Video Id not Provided");
    }
    if (!mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Please Provide Valid VideoId");
    }

    let pipeline = [];

    pipeline.push({
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    });

    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "likedBy",
          foreignField: "_id",
          as: "ownerDetails",
        },
      },
      {
        $unwind: {
          path: "$ownerDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          owner: {
            _id: "$ownerDetails._id",
            fullName: "$ownerDetails.fullName",
            avatar: "$ownerDetails.avatar",
          },
        },
      },
      {
        $group: {
          _id: "$video",
          totalLikes: { $sum: 1 },
          owners: { $addToSet: "$owner" },
        },
      },
      {
        $project: {
          _id: 1,
          totalLikes: 1,
          owners: 1,
        },
      }
    );

    const likedDetails = await Like.aggregate(pipeline);
    if (!likedDetails) {
      throw new ApiError(500, "Error while Fetching Likes");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, likedDetails, " Video like fetched Successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const likeController = {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
  getLikedByVideoId,
};

export default likeController;
