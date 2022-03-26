var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var PartySchema = new Schema({
  name: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

module.exports = mongoose.model("Party", PartySchema);