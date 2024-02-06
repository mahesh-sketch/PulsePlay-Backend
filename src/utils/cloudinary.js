import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import ApiError from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, folderName) => {
  try {
    if (!localFilePath) return null;
    //upload file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: folderName,
    });
    //file has been uploaded successfully
    console.log("File is uploaded on cloudinary: ", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const deleteOncloudinary = async (publicId) => {
  try {
    if (!publicId || publicId.length === 0) return "public id not provided";
    const deleteImageResponse = await cloudinary.api.delete_resources(
      publicId,
      {
        type: "upload",
        resource_type: "image",
      }
    );
    return deleteImageResponse;
  } catch (error) {
    throw new ApiError(400, error?.message || "Error in deleting file");
  }
};
const cloudinaryMethod = {
  uploadOnCloudinary,
  deleteOncloudinary,
};
export default cloudinaryMethod;
