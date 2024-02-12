import { mongoose, isValidObjectId } from "mongoose";
import Video from "../models/video.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import cloudinaryMethod from "../utils/cloudinary.js";
import fs from "fs";

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  try {
    //check for user there or not
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(200, "User Not Found");
    }
    if (!title) {
      throw new ApiError(400, "Title required");
    }
    if (!description) {
      throw new ApiError(400, "Description required");
    }
    //File checking for uploading
    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    console.log(videoFileLocalPath, thumbnailLocalPath);

    if (!videoFileLocalPath) {
      throw new ApiError(400, "Video File Required");
    }
    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail File required");
    }

    const uploadVideoFile = await cloudinaryMethod.uploadOnCloudinary(
      videoFileLocalPath,
      "Video UploadFile"
    );
    console.log(uploadVideoFile);
    if (!uploadVideoFile) {
      throw new ApiError(400, "Problem occurers in upload video file");
    }

    const uploadthumbnail = await cloudinaryMethod.uploadOnCloudinary(
      thumbnailLocalPath,
      "Video Thumbnail"
    );
    console.log(uploadVideoFile, uploadthumbnail);

    if (!uploadthumbnail) {
      throw new ApiError(400, "Problem occurers in upload thumbnail file");
    }

    //Assume if duration is in string format
    const duration =
      typeof uploadVideoFile.duration === "string"
        ? parseFloat(uploadVideoFile.duration)
        : uploadVideoFile.duration;
    console.log(duration);
    const video = await Video.create({
      videoFile: uploadVideoFile.url,
      thumbnail: uploadthumbnail.url,
      title: title,
      description: description,
      duration: duration,
      owner: new mongoose.Types.ObjectId(req.user?._id),
      videoPublicId: uploadVideoFile?.public_id,
      thumbnailPublicId: uploadthumbnail?.public_id,
    });
    console.log(video);
    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video Upload Successfully"));
  } catch (error) {
    console.log("error while uploading the video or thumbnail endpoint", error);

    throw new ApiError(
      error.statusCode || 500,
      error?.message || "internal server error upload video"
    );
  }
});

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
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

const videoController = {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  uploadVideo,
};

export default videoController;
