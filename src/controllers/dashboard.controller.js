import mongoose from "mongoose";
import Video from "../models/video.model.js";
import Subscription from "../models/subscription.model.js";
import Like from "../models/likes.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(400, "User Not Found");
    }

    //Total Video Views
    const totalVideoViews = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $group: {
          _id: null,
          totalViews: {
            $sum: "$views",
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalViews: 1,
        },
      },
    ]);
    if (!totalVideoViews) {
      throw new ApiError(
        400,
        "Something went wrong while accessing total Views"
      );
    }

    //Total Subscriber
    const totalSubscriber = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $group: {
          _id: null,
          subscribers: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          subscribers: 1,
        },
      },
    ]);

    if (!totalSubscriber) {
      throw new ApiError(
        400,
        "Something went wrong while accessing total Subscriber"
      );
    }

    //Total Videos
    const totalVideos = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $group: {
          _id: null,
          totalVideos: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalVideos: 1,
        },
      },
    ]);

    if (!totalVideos) {
      throw new ApiError(
        400,
        "Something went wrong while accessing total Subscriber"
      );
    }

    //Total Likes
    const totalLikes = await Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $group: {
          _id: null,
          totalLikes: {
            $sum: 1,
          },
          totalTweetLikes: {
            $sum: {
              $cond: {
                if: {
                  $eq: [{ $type: "$tweet" }, "missing"],
                },
                then: 0,
                else: 1,
              },
            },
          },
          totalCommentLikes: {
            $sum: {
              $cond: {
                if: {
                  $eq: [{ $type: "$comment" }, "missing"],
                },
                then: 0,
                else: 1,
              },
            },
          },
          totalVideoLikes: {
            $sum: {
              $cond: {
                if: {
                  $eq: [{ $type: "$video" }, "missing"],
                },
                then: 0,
                else: 1,
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalLikes: 1,
          totalTweetLikes: 1,
          totalCommentLikes: 1,
          totalVideoLikes: 1,
        },
      },
    ]);
    if (!totalLikes) {
      throw new ApiError(
        400,
        "Something went wrong while accessing total Likes"
      );
    }
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalVideos,
          totalVideoViews,
          totalSubscriber,
          totalLikes,
        },
        "DashBoard Data fetched Successfully"
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

const getChannelVideos = asyncHandler(async (req, res) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(400, "User Not Found");
    }

    const allchannelVideo = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
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
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    if (!allchannelVideo) {
      throw new ApiError(400, "Videos Not Found");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, allchannelVideo, "Video Fetched Successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const dashboardController = {
  getChannelStats,
  getChannelVideos,
};
export default dashboardController;
