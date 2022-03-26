var User = require("../models/user");
var Party = require("../models/party");
var Position = require("../models/position");
var multer = require("multer");
var path = require("path");
var fs = require("fs");
const Pusher = require("pusher");

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});


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
}).single("file");

async function addCandidate(req, res, next) {
  upload(req, res, err => {
    if (err) return next(err);

    const { name, email, bio, position, party, role } = req.body;

    if (!name) {
      const error = {
        "message": "Please provide candidate name"
      }
      return next(error);
    }

    let candidateData = new User({
      name,
      email,
      bio,
      position,
      party,
      role
    });

    if (typeof req.file === "undefined") {
      candidateData["img"] = process.env.DEPLOY_URL + "/images/default.jpg";
    } else {
      candidateData["img"] = process.env.DEPLOY_URL + "/images/" + req.file.filename;
    }

    candidateData.save(function (error) {
      if (error) {
        return next(error);
      }
      res.status(200).send(JSON.stringify({
        "success": true,
        "message": "Data saved successfully",
        candidateData
      }));
    });
  });
};

async function addParty(req, res, next) {
  const { name } = req.body;

  if (!name) {
    const error = {
      "success": false,
      "message": "Party name is required"
    };
    return next(error);
  }

  const party = new Party({ name });

  party.save(function (error) {
    if (error) {
      return next(error);
    }
    res.status(200).send(JSON.stringify({
      "success": true,
      "message": "Party saved !",
      party
    }));
  });
};

async function addPosition(req, res, next) {
  const { name } = req.body;

  if (!name) {
    const error = {
      "success": false,
      "message": "Position name is required"
    };
    return next(error);
  }

  const position = new Position({ name });

  position.save(function (error) {
    if (error) {
      return next(error);
    }
    res.status(200).send(JSON.stringify({
      "success": true,
      "message": "Position saved !",
      position
    }));
  });
};

async function editCandidate(req, res, next) {
  upload(req, res, error => {
    if (error) return next(error);

    let update = { ...req.body };
    const id = req.body.dataId;

    User.findById(update.dataId)
      .then(result => {
        if (result.img === req.body.file) {
          update.img = result.img;
          updateRecord(id, update, res, next);
        } else if (typeof req.file === "undefined") {
          update.img = process.env.DEPLOY_URL + "/images/default.jpg";
          updateRecord(id, update, res, next);
        } else {
          if (result.img) {
            const url = new URL(result.img);
            const path = 'public' + url.pathname;

            if (!path.includes("default.jpg")) {
              fs.unlink(path, function (error) {
                // if (error) return next(error);

                update.img = process.env.DEPLOY_URL + "/images/" + req.file.filename;
                updateRecord(id, update, res, next);
              });
            } else {
              update.img = process.env.DEPLOY_URL + "/images/" + req.file.filename;
              updateRecord(id, update, res, next);
            }
          }
        }
      });
  });
};

async function deleteCandidate(req, res, next) {
  const find = { _id: req.body.dataId };

  const data = await User.find(find);
  if (!data.length) return next({ "message": "Record not found", "success": true });

  User.find(find)
    .then(result => {
      const url = new URL(result[0].img);
      const path = 'public' + url.pathname;

      if (!path.includes("default.jpg")) {
        fs.unlink(path, function (error) {
          User.findOneAndDelete(find, function (err) {
            if (err) return next({ "message": "Error while deleting record. Please try again later", "success": false });
            res.status(200).send({ "success": true, "message": "Record deleted successfully" });
          });
        });
      } else {
        User.findOneAndDelete(find, function (err) {
          if (err) return next({ "message": "Error while deleting record. Please try again later", "success": false });
          res.status(200).send({ "success": true, "message": "Record deleted successfully" });
        });
      }
    });
};

async function deleteVoter(req, res, next) {
  const find = { _id: req.body.dataId };

  const data = await User.find(find);
  if (!data.length) return next({ "message": "Record not found", "success": true });

  User.find(find)
    .then(result => {
      User.findOneAndDelete(find, function (error) {
        if (error) return next({ "message": "Error while deleting record. Please try again later", "success": false });
        res.status(200).send({ "success": true, "message": "Record deleted successfully" });
      });
    });
};

async function deleteParty(req, res, next) {
  const find = { _id: req.body.dataId };

  const data = await Party.find(find);
  if (!data.length) return next({ "message": "Record not found", "success": true });

  Party.find(find)
    .then(result => {
      Party.findOneAndDelete(find, function (error) {
        if (error) return next({ "message": "Error while deleting record. Please try again later", "success": false });
        res.status(200).send({ "success": true, "message": "Record deleted successfully" });
      });
    });
};

async function deletePosition(req, res, next) {
  const find = { _id: req.body.dataId };

  const data = await Position.find(find);
  if (!data.length) return next({ "message": "Record not found", "success": true });

  Position.find(find)
    .then(result => {
      Position.findOneAndDelete(find, function (error) {
        if (error) return next({ "message": "Error while deleting record. Please try again later", "success": false });
        res.status(200).send({ "success": true, "message": "Record deleted successfully" });
      });
    });
};

async function editParty(req, res, next) {
  const find = { _id: req.body.dataId };

  const update = { "name": req.body.name };

  const data = await Party.find(find);
  if (!data.length) return next({ "message": "Record not found", "success": true });

  Party.findByIdAndUpdate(req.body.dataId, update, function (error) {
    if (error) return next({ "message": "Error while updating record. Please try again later", "success": false });

    res.status(200).send({ "success": true, "message": "Record updated successfully" });
  });
}

async function editPosition(req, res, next) {
  const find = { _id: req.body.dataId };

  const update = { "name": req.body.name };

  const data = await Position.find(find);
  if (!data.length) return next({ "message": "Record not found", "success": true });

  Position.findByIdAndUpdate(req.body.dataId, update, function (error) {
    if (error) return next({ "message": "Error while updating record. Please try again later", "success": false });

    res.status(200).send({ "success": true, "message": "Record updated successfully" });
  });
}

async function updateVotingStatus(req, res, next) {
  const { userId, flag, votingTimeLeft } = req.body;

  const user = await User.findById(userId).then(result => result);

  if (user.role === "admin") {
    User.findByIdAndUpdate(userId, { "isVotingStarted": flag, "votingTimeLeft": votingTimeLeft }, function (error, result) {
      if(error) return next({...error, "success": false});

      pusher.trigger("voting", "voting_status", {
        isVotingStarted: flag,
        "votingTimeLeft": votingTimeLeft,
      });
      res.status(200).send({"message": `Voting ${flag ? "Started" : "Stopped"}`, "success": true});
    });
  }else {
    res.status(401).send({"message": "Unauthorized access", "success": false});
  }
};

async function resetVotes(req,res, next) {
  await Party.updateMany({}, {"votes": 0})
  .then(result => {
    User.updateMany({}, { "hasAlreadyVoted": false })
    .then(result => res.status(200).send({"message": "Votes reset", "success": true}))
    .catch(error => next({...error, "success": false}));
  })
  .catch(error => next({...error, "success": false}));
}

function updateRecord(id, update, res, next) {
  delete update.dataId;
  User.findByIdAndUpdate(id, update, function (err) {
    if (err) return next({ "message": "Error while updating record. Please try again later.", "success": false });

    res.status(200).send({ "success": true, "message": "Data updated successfully" });
  });
};

module.exports = {
  addCandidate,
  addParty,
  addPosition,
  editCandidate,
  deleteCandidate,
  deleteVoter,
  deleteParty,
  deletePosition,
  editParty,
  editPosition,
  updateVotingStatus,
  resetVotes
};