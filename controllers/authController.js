var User = require("../models/user");
var jwt = require("jsonwebtoken");
var crypto = require("crypto");
var multer = require("multer");
var path = require("path");
var fs = require("fs");
// require("@tensorflow/tfjs-node");
var faceApi = require("face-api.js");
var canvas = require("canvas");

const { Canvas, Image, ImageData } = canvas;
faceApi.env.monkeyPatch({ Canvas, Image, ImageData });

const faceDetectionNet = faceApi.nets.ssdMobilenetv1;

const minConfidence = 0.5

// TinyFaceDetectorOptions
const inputSize = 408
const scoreThreshold = 0.5

// MtcnnOptions
const minFaceSize = 50
const scaleFactor = 0.8

function getFaceDetectorOptions(net) {
  return net === faceApi.nets.ssdMobilenetv1
    ? new faceApi.SsdMobilenetv1Options({ minConfidence })
    : (net === faceApi.nets.tinyFaceDetector
      ? new faceApi.TinyFaceDetector({ inputSize, scoreThreshold })
      : new faceApi.MtcnnOptions({ minFaceSize, scaleFactor })
    )
}

const faceDetectionOptions = getFaceDetectorOptions(faceDetectionNet);

const secret = process.env.JWT_SECRET;
const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(secret, 'salt', 32);
const iv = Buffer.alloc(16, 0);

// define storage for images
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(__dirname, '../public/images/'));
  },

  filename: function (req, file, callback) {
    callback(null, (Date.now() + '_' + file.originalname));
  },
});

// upload params for multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // max file size - 5MB
  }
}).single("profileImage");

async function validatePassword(password, user) {
  return new Promise((resolve, reject) => {
    user.comparePasswords(password, (error, isMatch) => {
      if (error) return reject(error);
      if (!isMatch) resolve(false);
      resolve(true);
    })
  });
};

function encryptToken(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted;
}

function generateToken(userId) {
  const tokenExpiry = Math.floor(Date.now() / 1000) + 3600 * 4320;

  return encryptToken(
    jwt.sign(
      {
        data: {
          _id: userId
        },
        exp: tokenExpiry
      },
      process.env.JWT_SECRET
    )
  );
}

async function generateSendUserDataAndToken(userData, resObj) {
  let sendableUserData = {
    "success": true,
    "message": "Login Success",
    "userId": userData._id,
    "name": userData.name,
    "role": userData.role,
    "hasAlreadyVoted": userData.hasAlreadyVoted,
    "token": ""
  };

  const token = generateToken(userData._id);
  sendableUserData.token = token;

  resObj.status(200).send(sendableUserData);
}

async function loginUser(req, res, next) {
  let { email, password, phone, profileImage } = req.body;

  if (!email || !password) {
    const error = {
      "message": "Missing one or more required paramters"
    }
    return next(error);
  }

  await User.find(({ email }))
    .then(async (response) => {
      const userData = response[0];

      if (userData.phone !== phone) {
        const error = {
          "success": false,
          "message": "Please enter correct phone number"
        };
        return next(error);
      }

      const isPasswordCorrect = await validatePassword(password, userData);
      if (isPasswordCorrect) {

        if (userData.role !== "admin") {
          await faceDetectionNet.loadFromDisk("weights");
          await faceApi.nets.faceLandmark68Net.loadFromDisk("weights");
          await faceApi.nets.ssdMobilenetv1.loadFromDisk("./models");
          await faceApi.nets.faceRecognitionNet.loadFromDisk("./models");

          const storedImage = await canvas.loadImage(userData.profileImage);
          const queryImage = await canvas.loadImage(profileImage);

          const storedImageResults = await faceApi.detectSingleFace(storedImage, faceDetectionOptions).withFaceLandmarks().withFaceDescriptor();

          const queryImageResults = await faceApi.detectSingleFace(queryImage, faceDetectionOptions).withFaceLandmarks().withFaceDescriptor();

          const faceMatcher = new faceApi.FaceMatcher(storedImageResults);

          if (queryImageResults) {
            const bestMatch = faceMatcher.findBestMatch(queryImageResults.descriptor);

            if (bestMatch._distance > 0.5) {
              const error = {
                "success": false,
                "message": "Unauthorized Access. Please enter your email & password"
              };
              return next(error);
            } else if (bestMatch._distance <= 0.5) {
              generateSendUserDataAndToken(userData, res);
            }
          }
        }else {
          generateSendUserDataAndToken(userData, res);
        }
      } else {
        const error = {
          "success": false,
          "message": "Invalid email or password"
        };
        return next(error);
      }
    })
    .catch(error => next(error))
}

async function registerUser(req, res, next) {
  let { name, email, phone, password, role, profileImage } = req.body;

  await User.find({ email })
    .then(async response => {
      if (response.length) {
        const error = {
          "message": "User already registered"
        }
        return next(error);
      } else {
        let userData = new User({
          name,
          email,
          phone,
          password,
          role,
          profileImage
        });

        userData.save(function (error) {
          if (error) return next(error);

          res.status(200).send(JSON.stringify({
            "success": true,
            "message": "User registered successfully;"
          }));
        });
      }
    })
    .catch(error => next(error))
}

async function updatePassword(req, res, next) {
  const { email, password } = req.body;

  await User.find({ email }).then(async result => {
    let user = result;
    if (user.length > 0) {
      let userData = user[0];

      User.findById(userData._id, function (error, result) {
        if (error) return next({ ...error, "success": false });

        result.password = password;
        result.save(function (error) {
          if (error) return next({ ...error, "success": false });

          res.status(200).send({ "message": "Password updated successfully", "success": true });
        });
      });
    } else {
      res.status(400).send({ "message": "Email does not exist. Please register", "success": false });
    }
  });
};

module.exports = {
  registerUser,
  loginUser,
  updatePassword
};