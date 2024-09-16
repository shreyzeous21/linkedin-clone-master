import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

// Get Suggested Connections Controller
export const getSuggestedConnections = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select("connections");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find users not connected to the current user and exclude their own profile
    const suggestedUsers = await User.find({
      _id: {
        $ne: req.user._id, // Exclude current user
        $nin: currentUser.connections, // Exclude connected users
      },
    })
      .select("name username profilePicture headline")
      .limit(3);

    res.json(suggestedUsers);
  } catch (error) {
    console.error("Error in getSuggestedConnections controller:", error);
    res.status(500).json({ message: "Server error, unable to fetch connections" });
  }
};

// Get Public Profile Controller
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error in getPublicProfile controller:", error);
    res.status(500).json({ message: "Server error, unable to fetch profile" });
  }
};

// Update Profile Controller
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "username",
      "headline",
      "about",
      "location",
      "profilePicture",
      "bannerImg",
      "skills",
      "experience",
      "education",
    ];

    const updatedData = {};

    // Collect valid fields from request body
    for (const field of allowedFields) {
      if (req.body[field]) {
        updatedData[field] = req.body[field];
      }
    }

    // Upload profilePicture to Cloudinary if present
    if (req.body.profilePicture) {
      const uploadResult = await cloudinary.uploader.upload(req.body.profilePicture, {
        folder: "profile_pictures",
      });
      updatedData.profilePicture = uploadResult.secure_url;
    }

    // Upload bannerImg to Cloudinary if present
    if (req.body.bannerImg) {
      const uploadResult = await cloudinary.uploader.upload(req.body.bannerImg, {
        folder: "banners",
      });
      updatedData.bannerImg = uploadResult.secure_url;
    }

    // Update user profile and return the updated user without password
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updatedData },
      { new: true, select: "-password" } // Exclude password from the result
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error in updateProfile controller:", error);
    res.status(500).json({ message: "Server error, unable to update profile" });
  }
};
