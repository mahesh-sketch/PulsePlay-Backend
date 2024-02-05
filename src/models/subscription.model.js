import { model, Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // one who is subsribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Subscription = model("Subscription", subscriptionSchema);

export default Subscription;
