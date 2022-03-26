var User = require("../models/user");
var Party = require("../models/party");
var Position = require("../models/position");
const Pusher = require("pusher");

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

async function getAllParties(req, res, next) {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const skipIndex = (page - 1) * limit;

  const result = {};

  try {
    // result.length = (await Party.find()).length;
    result.data = await Party.find()
      // .sort({ _id: -1 })
      // .skip(skipIndex)
      // .limit(limit)
      // .exec();

    result.success = true;
    res.status(200).send(result);
    return;
  } catch (error) {
    next(error);
  }
}

async function getAllPositions(req, res, next) {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const skipIndex = (page - 1) * limit;

  const result = {};

  try {
    // result.length = (await Position.find()).length;
    result.data = await Position.find()
      // .sort({ _id: -1 })
      // .skip(skipIndex)
      // .limit(limit)
      // .exec();

    result.success = true;
    res.status(200).send(result);
    return;
  } catch (error) {
    next(error);
  }
}

async function getAllCandidates(req, res, next) {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const skipIndex = (page - 1) * limit;

  const result = {};

  try {
    // result.length = (await User.find({ role: "candidate" })).length;
    result.data = await User.find({ role: "candidate" })
      // .sort({ _id: -1 })
      // .skip(skipIndex)
      // .limit(limit)
      // .exec();

    result.success = true;
    res.status(200).send(result);
    return;
  } catch (error) {
    next(error);
  }
}

async function getAllVoters(req, res, next) {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const skipIndex = (page - 1) * limit;

  const result = {};

  try {
    // result.length = (await User.find({ role: "user" })).length;
    result.data = await User.find({ role: "user" })
      // .sort({ _id: -1 })
      // .skip(skipIndex)
      // .limit(limit)
      // .exec();

    result.success = true;
    res.status(200).send(result);
    return;
  } catch (error) {
    next(error);
  }
}

async function updateVoteCount(req, res, next) {
  const { partyId } = req.body;

  Party.findById(partyId, function(error, result) {
    if(error) return next({...error, "success": false});
    const party = result;

    Party.findByIdAndUpdate(partyId, {votes: party.votes + 1}, function(error) {
      if(error) return next({...error, "success": false});
      pusher.trigger("voting", "voted_added", {
        partyId
      });
      res.status(200).send(JSON.stringify({
        "message": "Vote added!",
        "success": true
      }));
    });
  });
};

async function updateHasAlreadyVoted(req, res, next) {
  const { userId } = req.body;

  User.findByIdAndUpdate(userId, { hasAlreadyVoted: true }, function(error) {
    if(error) return next({...error, "success": false});
    res.status(200).send(JSON.stringify({
      "message": "Flag updated",
      "success": true
    }));
  });
};

async function getHasAlreadyVoted(req, res, next) {
  const { userId } = req.query;

  User.findById(userId, function(error, result) {
    if(error) return next({...error, "success": false});
    res.send({"message": "User found", "success": true, "data": { hasAlreadyVoted: result.hasAlreadyVoted }});
  });
};

async function isVotingGoingOn(req, res, next) {
  await User.find({"role": "admin"})
  .then(result => {
    if(result[0].isVotingStarted) {
      res.status(200).send({"message": "API success", "success": true, "isVotingStarted": true, "votingTime": result[0].votingTimeLeft});
    }else {
      res.status(200).send({"message": "API success", "success": true, "isVotingStarted": false});
    }
  })
  .catch(error => next({...error, "success": false}));
};

module.exports = {
  getAllCandidates,
  getAllParties,
  getAllPositions,
  getAllVoters,
  updateVoteCount,
  updateHasAlreadyVoted,
  getHasAlreadyVoted,
  isVotingGoingOn
};