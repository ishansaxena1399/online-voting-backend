var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var PositionSchema = new Schema({
  name: { type: String, required: true }
});

module.exports = mongoose.model("Position", PositionSchema);