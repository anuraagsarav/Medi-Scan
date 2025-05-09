const multer = require("multer");
const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../utils/s3Client");
const File = require("../models/fileModel");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const FormData = require("form-data");


// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

// Upload file to S3 and save metadata
exports.uploadToS3 = [
  upload,
  async (req, res) => {
    const userId = req.user.id;
    const file = req.file;
    const { hospital, purpose } = req.body;

    if (!file || !hospital) {
      return res.status(400).json({ msg: "File and hospital name are required" });
    }

    const sanitizedHospital = hospital.trim().replace(/\s+/g, '_');
    const fileKey = `${sanitizedHospital}/${Date.now()}_${file.originalname}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      await s3.send(new PutObjectCommand(params));

      const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

      const newFile = await File.create({
        user: userId,
        fileUrl,
        originalName: file.originalname,
        fileType: file.mimetype,
        hospital,
        purpose,
        summary: null,
      });

    

      res.status(201).json({ msg: "File uploaded", file: newFile });
    } catch (err) {
      console.error("Upload Error:", err);
      res.status(500).json({ msg: "File upload failed" });
    }
  },
];

// Get all uploaded files by user
exports.getUserFiles = async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to retrieve files" });
  }
};

// Delete a file from S3 and MongoDB
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: "File not found" });
    if (file.user.toString() !== req.user.id)
      return res.status(403).json({ msg: "Unauthorized" });

    await file.deleteOne(); // Only delete from DB, not from S3
    res.json({ msg: "File metadata deleted from DB" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to delete file from DB" });
  }
};

exports.getSignedUrlForFile = async (req, res) => {
  const fileUrl = req.query.fileUrl;
  if (!fileUrl) return res.status(400).json({ msg: "File URL is required" });

  try {
    const decodedUrl = decodeURIComponent(fileUrl);
    const key = decodedUrl.split('.amazonaws.com/')[1];

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // valid for 5 min

    res.json({ signedUrl });
  } catch (err) {
    console.error("Signed URL error:", err);
    res.status(500).json({ msg: "Failed to generate signed URL" });
  }
};
