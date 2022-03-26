var express = require("express");
var router = express.Router();
var controller = require("../controllers/adminController");

// router.post("/login", )

router.post("/candidate", controller.addCandidate);
router.post("/party", controller.addParty);
router.post("/position", controller.addPosition);
router.post("/editCandidate", controller.editCandidate);
router.post("/editParty", controller.editParty);
router.post("/editPosition", controller.editPosition);
router.delete("/deleteCandidate", controller.deleteCandidate);
router.delete("/deleteVoter", controller.deleteVoter);
router.delete("/deleteParty", controller.deleteParty);
router.delete("/deletePosition", controller.deletePosition);
router.post("/updateVotingStatus", controller.updateVotingStatus);
router.post("/resetVotes", controller.resetVotes);

module.exports = router;