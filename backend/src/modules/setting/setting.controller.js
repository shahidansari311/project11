const prisma = require("../../config/db");
const { successResponse, errorResponse } = require("../../utils/apiResponse");

// GET /api/v1/public/settings/tutorial-video
const getTutorialVideo = async (req, res) => {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: "tutorial_video" }
    });

    // If no setting found, return a default placeholder link
    const videoUrl = setting ? setting.value : "https://www.youtube.com/embed/WzlO79d3S8c";
    
    return successResponse(res, 200, { url: videoUrl }, "Tutorial video retrieved successfully");
  } catch (error) {
    console.error("Error getting tutorial video:", error);
    return errorResponse(res, 500, "Internal Server Error");
  }
};

// POST /api/v1/admin/settings/tutorial-video
const updateTutorialVideo = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== "string") {
      return errorResponse(res, 400, "Please provide a valid YouTube URL");
    }

    // Convert standard youtube link to embed link if necessary
    let finalUrl = url;
    if (url.includes("watch?v=")) {
      const videoId = url.split("watch?v=")[1].split("&")[0];
      finalUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1].split("?")[0];
      finalUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    const setting = await prisma.appSetting.upsert({
      where: { key: "tutorial_video" },
      update: { value: finalUrl },
      create: { key: "tutorial_video", value: finalUrl }
    });

    return successResponse(res, 200, { url: setting.value }, "Tutorial video updated successfully");
  } catch (error) {
    console.error("Error updating tutorial video:", error);
    return errorResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  getTutorialVideo,
  updateTutorialVideo
};
