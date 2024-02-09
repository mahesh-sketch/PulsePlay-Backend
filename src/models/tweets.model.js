import { Schema, model } from "mongoose";

const tweetSchema = Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Tweet = model("Tweet", tweetSchema);

export default Tweet;
