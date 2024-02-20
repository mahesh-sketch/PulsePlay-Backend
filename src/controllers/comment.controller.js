import mongoose from "mongoose";
import Comment from "../models/comment.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const addComment = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!req.user?._id) {
      throw new ApiError(400, "User not found");
    }
    if (!videoId) {
      throw new ApiError(400, "Provide Video ID");
    }
    if (!mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Provide Valid Video ID");
    }

    const comment = await Comment.create({
      video: videoId,
      owner: req.user?._id,
      content: content,
    });

    if (!comment) {
      throw new ApiError(401, "Error in posting Comment");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "Comment posted Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const getVideoComments = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!req.user?._id) {
      throw new ApiError(400, "User not found");
    }
    if (!videoId) {
      throw new ApiError(400, "Provide Video ID");
    }
    if (!mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Provide Valid Video ID");
    }

    const allComment = await Comment.find({ video: videoId }).select("-video");

    if (!allComment || allComment.length === 0) {
      throw new ApiError(400, "Erorr in getting comment");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, allComment, "Comment fetched Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const updateComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!req.user?._id) {
      throw new ApiError(400, "User not found");
    }
    if (!commentId) {
      throw new ApiError(400, "Provide Comment ID");
    }
    if (!mongoose.isValidObjectId(commentId)) {
      throw new ApiError(400, "Provide Valid Comment ID");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      {
        _id: commentId,
      },
      {
        $set: {
          content: content,
        },
      },
      {
        new: true,
      }
    );
    if (!updatedComment) {
      throw new ApiError(400, "Error in updating comment");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedComment, "Comment Updated Successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User not found");
    }
    if (!commentId) {
      throw new ApiError(400, "Provide Comment ID");
    }
    if (!mongoose.isValidObjectId(commentId)) {
      throw new ApiError(400, "Provide Valid Comment ID");
    }

    const deletedComment = await Comment.deleteOne({ _id: commentId });

    if (!deletedComment) {
      throw new ApiError(400, "Error in deleting comment");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, deletedComment, "Comment Deleted Successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const commentController = {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
};
export default commentController;
