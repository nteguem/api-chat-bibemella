const cloudinary = require("cloudinary/lib/cloudinary").v2;

cloudinary.config({
  cloud_name: "dwnut8bnb",
  api_key: "192229113853847",
  api_secret: "wQYmUf02A5maNf71MXs_oMmJr9I",
});

const uploadFileWithFormidable = (file, uploadDir, name = "") => {
  if (file) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        file.path,
        { resource_type: "auto", folder: uploadDir },
        (error, result) => {
          if (result) {
            resolve(result.secure_url);
          } else {
            reject(error);
          }
        }
      );
    });
  }
};

module.exports = uploadFileWithFormidable;
