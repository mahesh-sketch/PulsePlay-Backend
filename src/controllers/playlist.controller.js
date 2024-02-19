import { mongoose, isValidObjectId } from "mongoose";
import Playlist from "../models/playlist.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!req.user?._id) {
      throw new ApiError(400, "User not Found");
    }

    if (!name) {
      throw new ApiError(400, "Provide Name");
    }
    if (!description) {
      throw new ApiError(400, "Provide Description");
    }

    const existedPlayListname = await Playlist.findOne({
      name: name,
    });

    console.log(existedPlayListname);

    if (existedPlayListname) {
      throw new ApiError(400, "Play List Already Exist choose Another name");
    }

    const playlist = await Playlist.create({
      name: name,
      description: description,
      owner: new mongoose.Types.ObjectId(req.user?._id),
    });

    if (!playlist) {
      throw new ApiError(400, "Creation of Play list problem");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "PlayList Created Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User not Found");
    }

    if (!userId) {
      throw new ApiError(400, "Provide UserId");
    }

    if (!mongoose.isValidObjectId(userId)) {
      throw new ApiError(400, "Please provide Valid UserId");
    }

    const findPlayList = await Playlist.find({ owner: userId });

    if (!findPlayList) {
      throw new ApiError(400, "PlayList not Found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, findPlayList, "PlayList Fetched Successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User not Found");
    }

    if (!playlistId) {
      throw new ApiError(400, "Provide Playlist Id");
    }

    if (!mongoose.isValidObjectId(playlistId)) {
      throw new ApiError(400, "Please provide Valid PlaylistId");
    }

    const findPlayList = await Playlist.find({
      _id: playlistId,
    });

    if (!findPlayList) {
      throw new ApiError(400, "PlayList not Found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, findPlayList, "PlayList Fetched Successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User Not found");
    }
    if (!playlistId) {
      throw new ApiError(400, "Provide PlayList ID");
    }
    if (!videoId) {
      throw new ApiError(400, "Provide video ID");
    }

    if (!mongoose.isValidObjectId(playlistId)) {
      throw new ApiError(400, "Provide Valid Playlist ID");
    }
    if (!mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Provide Valid VideoId");
    }

    const existedVideo = await Playlist.findOne({
      _id: playlistId,
      owner: req.user?._id,
      videos: { $in: [videoId] },
    });

    if (existedVideo) {
      throw new ApiError(404, "video Already Exist");
    }

    const updatePlaylist = await Playlist.findOneAndUpdate(
      {
        _id: playlistId,
        owner: req.user?._id,
      },
      {
        $addToSet: {
          videos: videoId,
        },
      },
      {
        new: true,
      }
    );

    if (!updatePlaylist) {
      throw new ApiError(400, "Problem in updating PlayList");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatePlaylist, "Video Added Successfully"));
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User Not found");
    }
    if (!playlistId) {
      throw new ApiError(400, "Provide PlayList ID");
    }
    if (!videoId) {
      throw new ApiError(400, "Provide video ID");
    }

    if (!mongoose.isValidObjectId(playlistId)) {
      throw new ApiError(400, "Provide Valid Playlist ID");
    }
    if (!mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Provide Valid VideoId");
    }

    const deletedVideoPlaylist = await Playlist.findOneAndUpdate(
      {
        _id: playlistId,
        videos: videoId,
        owner: req.user?._id,
      },
      {
        $pull: {
          videos: videoId,
        },
      },
      { new: true }
    );

    if (!deletedVideoPlaylist) {
      throw new ApiError(400, "Video Not Exist");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          deletedVideoPlaylist,
          "Video Remove from Playlist successfully"
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

const deletePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;

    if (!req.user?._id) {
      throw new ApiError(400, "User Not found");
    }
    if (!playlistId) {
      throw new ApiError(400, "Provide PlayList ID");
    }

    if (!mongoose.isValidObjectId(playlistId)) {
      throw new ApiError(400, "Provide Valid Playlist ID");
    }

    const deletePlaylists = await Playlist.deleteOne({ _id: playlistId });

    return res
      .status(200)
      .json(
        new ApiResponse(200, deletePlaylists, "Delete PlayList Successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!req.user?._id) {
      throw new ApiError(400, "User Not found");
    }
    if (!playlistId) {
      throw new ApiError(400, "Provide PlayList ID");
    }
    if (!name) {
      throw new ApiError(400, "Name Required");
    }
    if (!description) {
      throw new ApiError(400, "Description Required");
    }

    if (!mongoose.isValidObjectId(playlistId)) {
      throw new ApiError(400, "Provide Valid Playlist ID");
    }

    const updatePlaylists = await Playlist.findByIdAndUpdate(
      {
        _id: playlistId,
      },
      {
        $set: {
          name: name,
          description: description,
        },
      },
      {
        new: true,
      }
    );

    console.log(updatePlaylists);

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatePlaylists, "Delete PlayList Successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

const playlistController = {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};

export default playlistController;
