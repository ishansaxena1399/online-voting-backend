var express = require("express");
var router = express.Router();
var controller = require("../controllers/commonRoutesController");

router.get("/parties", controller.getAllParties);
router.get("/positions", controller.getAllPositions);
router.get("/candidates", controller.getAllCandidates);
router.get("/voters", controller.getAllVoters);
router.post("/addVote", controller.updateVoteCount);
router.post("/updateHasAlreadyVoted", controller.updateHasAlreadyVoted);
router.get("/getHasAlreadyVoted", controller.getHasAlreadyVoted);
router.get("/checkVotingStatus", controller.isVotingGoingOn);

module.exports = router;