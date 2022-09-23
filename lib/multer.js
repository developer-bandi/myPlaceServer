const multer = require("multer");
const path = require("path");
const {CloudinaryStorage} = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

const upload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `/place`,
      format: async (req, file) => {
        return file.originalname.substring(
          file.originalname.indexOf(".") + 1,
          file.originalname.length
        );
      },

      public_id: async () =>
        new Date().valueOf() +
        JSON.stringify(Math.round(Math.random() * 10 ** 10)),
    },
  }),
  limits: {fileSize: 5 * 1024 * 1024},
});

module.exports = upload;
