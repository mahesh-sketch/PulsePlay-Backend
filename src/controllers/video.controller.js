import { mongoose, isValidObjectId } from "mongoose";
import Video from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import cloudinaryMethod from "../utils/cloudinary.js";
import fs from "fs";

const uploadVideo = asyncHandler(async (req, res) => {
  let localVideoPath;
  let localThumbnailPath;

  try {
    const { title, description } = req.body;

    if (
      req.files &&
      Array.isArray(req.files.videoFile) &&
      req.files.videoFile.length > 0
    ) {
      localVideoPath = req.files?.videoFile[0].path;
    }
    if (
      req.files &&
      Array.isArray(req.files.thumbNail) &&
      req.files.thumbNail.length > 0
    ) {
      localThumbnailPath = req.files?.thumbNail[0].path;
    }
    if (!title || !description) {
      throw new ApiError(400, "title and descriptions are required");
    }
    if (!localThumbnailPath || !localVideoPath) {
      throw new ApiError(404, "thumbnail and video are mendatory to upload!");
    }
    const cloudinaryVideoUrl = await cloudinaryMethod.uploadOnCloudinary(
      localVideoPath,
      "Video File"
    );
    const cloudinaryThumbnailUrl = await cloudinaryMethod.uploadOnCloudinary(
      localThumbnailPath,
      "Thumbnail File"
    );
    if (!cloudinaryVideoUrl) {
      throw new ApiError(
        500,
        "Error while uploading the video on cloudinary, please try again"
      );
    }
    if (!cloudinaryThumbnailUrl) {
      throw new ApiError(
        500,
        "Error while uploading the thumbnail on cloudinary, please try again"
      );
    }
    // Convert duration to a number, assuming it can be a string or a number
    const duration =
      typeof cloudinaryVideoUrl.duration === "string"
        ? parseFloat(cloudinaryVideoUrl.duration)
        : cloudinaryVideoUrl.duration;

    const VideoPublicId = cloudinaryVideoUrl?.public_id;
    const ThumbNailPublicId = cloudinaryThumbnailUrl?.public_id;
    // create a new document in video collection
    const newVideo = await Video.create({
      videoFile: cloudinaryVideoUrl.url,
      thumbNail: cloudinaryThumbnailUrl.url,
      VideoPublicId,
      ThumbNailPublicId,
      owner: new mongoose.Types.ObjectId(req.user?._id),
      title: title,
      description,
      duration: duration,
    });

    return res.status(200).json(new ApiResponse(200, newVideo, "success"));
  } catch (error) {
    console.log("error while uploading the video or thumbnail endpoint", error);

    throw new ApiError(
      error.statusCode || 500,
      error?.message || "internal server error upload video"
    );
  } finally {
    console.log("enter in finally");
    if (localVideoPath && fs.existsSync(localVideoPath)) {
      console.log("enter in finally local video variable");
      fs.unlinkSync(localVideoPath);
    }
    if (localThumbnailPath && fs.existsSync(localThumbnailPath)) {
      console.log("enter in finally local thumbanil variable");
      fs.unlinkSync(localThumbnailPath);
    }
  }
});

const getAllVideos = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    if (!sortBy && !sortType && query) {
      throw new ApiError("SortBy, SortType, and Query are all required!!!");
    }

    const pipeline = [
      {
        $match: {
          $or: [
            { title: { $regex: new RegExp(query, "si") } },
            { description: { $regex: new RegExp(query, "si") } },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "videoOwner",
        },
      },
      {
        $unwind: "$videoOwner",
      },
      {
        $project: {
          username: "$videoOwner.username",
          avatar: "$videoOwner.avatar",
        },
      },
      {
        $sort: {
          sortBy: sortType === "asc" ? 1 : -1,
        },
      },
    ];

    const getAllvideoPipeline = await Video.aggregate(pipeline);

    if (!getAllvideoPipeline || getAllvideoPipeline.length === 0) {
      throw new ApiError(400, "No videos found");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, getAllvideoPipeline, "Videos fetched successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Invaild ID please Provide Vaild ID");
    }
    if (!req.user._id) {
      throw new ApiError(400, "User Not Found");
    }
    if (!videoId) {
      throw new ApiError(400, "Video Id Required");
    }

    const videoById = await Video.findById(videoId).select(
      "-VideoPublicId -ThumbNailPublicId -_id"
    );
    if (!videoById) {
      throw new ApiError(400, "Video Not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, videoById, "Video Fetched Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!videoId) {
      throw new ApiError(400, "Video Id Required");
    }

    if (!mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Invaild ID please Provide Vaild ID");
    }

    if (!title || !description) {
      throw new ApiError(400, "Title or Desc Required");
    }
    if (!req.file || Object.keys(req.file).length === 0) {
      throw new ApiError(401, "please upload the thumbnail");
    }
    const thumbnailPath = req.file?.path;

    if (!thumbnailPath) {
      throw new ApiError(401, "thumbnail file is missing");
    }

    const video = await Video.findById(videoId);
    if (!video.owner || !video.owner.equals(req.user._id)) {
      throw new ApiError(404, "User not found");
    }

    const deletedThumbnail = await cloudinaryMethod.deleteOncloudinary(
      video.ThumbNailPublicId
    );

    if (!deletedThumbnail) {
      throw new ApiError(
        400,
        "Error deleting in oldthumbnail file from cloudinary"
      );
    }

    const newThumbnail = await cloudinaryMethod.uploadOnCloudinary(
      thumbnailPath,
      "Thumbnail File"
    );

    if (!newThumbnail || !newThumbnail.url) {
      throw new ApiError(400, "Error while uploading new Thumbnail");
    }

    await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title: title,
          description: description,
          thumbNail: newThumbnail.url,
          ThumbNailPublicId: newThumbnail.public_id,
        },
      },
      { new: true }
    ).select("-ThumbNailPublicId -VideoPublicId ");

    return res.status(200).json(new ApiResponse(200, "Update Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User not Exist");
    }
    if (!videoId) {
      throw new ApiError(400, "Please provide videoId");
    }
    if (!mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Please provide Valid Video ID");
    }

    const video = await Video.findById(videoId);
    const thumbanilpublicId = video.ThumbNailPublicId;
    const videopublicId = video.VideoPublicId;

    const deletedVideoFromCloudinary =
      await cloudinaryMethod.deleteOncloudinary(videopublicId, "video");

    const deletedThumbnailFromCloudinary =
      await cloudinaryMethod.deleteOncloudinary(thumbanilpublicId);

    if (!deletedThumbnailFromCloudinary) {
      throw new ApiError(400, "Error in deleted Thumbnail from cloudinary");
    }
    if (!deletedVideoFromCloudinary) {
      throw new ApiError(400, "Error in deleted Video from cloudinary");
    }

    const deleted = await Video.deleteOne({ _id: videoId });

    return res
      .status(200)
      .json(new ApiResponse(200, deleted, "Video Deleted Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!req.user?._id) {
    throw new ApiError(400, "User not Exist");
  }
  if (!videoId) {
    throw new ApiError(400, "Please provide videoId");
  }
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Please provide Valid Video ID");
  }

  const togglePublishAggregatePipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $set: {
        PublishedId: {
          $cond: {
            if: { $eq: ["$isPublished", true] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        owner: 1,
        PublishedId: 1,
        title: 1,
      },
    },
  ];

  const updatedVideo = await Video.aggregate(togglePublishAggregatePipeline);

  if (!updatedVideo) {
    throw new ApiError(400, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const videoController = {
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  uploadVideo,
};

export default videoController;
