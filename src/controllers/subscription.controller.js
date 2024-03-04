import { mongoose } from "mongoose";
import Subscription from "../models/subscription.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;
    // TODO: toggle subscription
    if (!req.user._id) {
      throw new ApiError(400, "User Not Found");
    }

    if (!channelId) {
      throw new ApiError(400, "Channel Id Required");
    }
    if (!mongoose.isValidObjectId(channelId)) {
      throw new ApiError(400, "Provide Valid Channel Id");
    }

    const subscribed = await Subscription.findOne({
      subscriber: req.user._id,
      channel: channelId,
    });

    if (!subscribed) {
      try {
        const subscribe = await Subscription.create({
          subscriber: req.user._id,
          channel: channelId,
        });
        return res
          .status(200)
          .json(new ApiResponse(200, subscribe, "subscribe successfully"));
      } catch (error) {
        throw new ApiError(
          500,
          "Something went worng While subscribing the channel"
        );
      }
    }

    try {
      const deletedSubscription = await Subscription.findByIdAndDelete(
        subscribed._id
      );
      return res
        .status(200)
        .json(
          new ApiResponse(200, deletedSubscription, "Unsubscribe successfully")
        );
    } catch (error) {
      throw new ApiError(
        500,
        error.message || "Something went worng While Unsubscribing the channel"
      );
    }
  } catch (error) {
    console.error("Error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Internal server error"
    );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  try {
    const { subscriberId } = req.params;
    if (!req.user._id) {
      throw new ApiError(400, "User Not Found");
    }

    if (!subscriberId) {
      throw new ApiError(400, "Subscriber Id Required");
    }
    if (!mongoose.isValidObjectId(subscriberId)) {
      throw new ApiError(400, "Provide Valid Channel Id");
    }

    const subscriberCount = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(subscriberId),
        },
      },
      {
        $group: {
          _id: null,
          subscriberCount: {
            $sum: 1,
          },
        },
      },
      {
        $addFields: {
          subscriberCount: "$subscriberCount",
        },
      },
      {
        $project: {
          _id: 0,
          subscriberCount: 1,
        },
      },
    ]);

    if (!subscriberCount) {
      throw new ApiError(400, "While accessing the subscribers");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscriberCount,
          "Subscribers fetched successfully"
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

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  try {
    const { channelId } = req.params;

    if (!req.user._id) {
      throw new ApiError(400, "User Not Found");
    }

    if (!channelId) {
      throw new ApiError(400, "Subscriber Id Required");
    }
    if (!mongoose.isValidObjectId(channelId)) {
      throw new ApiError(400, "Provide Valid Channel Id");
    }

    const subscribedChannel = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channel",
          pipeline: [
            {
              $project: {
                username: 1,
                avatar: 1,
                _id: 1,
                fullName: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          channel: {
            $first: "$channel",
          },
        },
      },
    ]);

    if (!subscribedChannel) {
      throw new ApiError(400, "While accessing the subscribed channel");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribedChannel,
          "Subscribed channel fetched successfully"
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

const subscriptionController = {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
};

export default subscriptionController;
