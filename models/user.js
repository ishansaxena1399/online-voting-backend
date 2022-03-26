var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcryptjs");

var UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  password: { type: String },
  hasAlreadyVoted: { type: Boolean, default: false },
  role: { type: String },
  bio: { type: String, default: undefined },
  position: { type: String, default: undefined },
  party: { type: String, default: undefined },
  img: { type: Object, default: undefined },
  profileImage: { type: Object, default: undefined },
  isVotingStarted: { type: Boolean, default: false },
  votingTimeLeft: { type: Number }
}, {timestamps: true});

function hash(user, salt, next) {
  bcrypt.hash(user.password, salt, (error, newHash) => {
    if(error) return next(error);
    user.password = newHash;
    return next();
  })
}

function generateSalt(user, SALT_FACTOR, next) {
  bcrypt.genSalt(SALT_FACTOR, (error, salt) => {
    if(error) {
      return next(error);
    }
    return hash(user, salt, next);
  })
}

UserSchema.pre("save", function(next) {
  const that = this;
  const SALT_FACTOR = 5;
  if(!that.isModified('password')) {
    return next();
  }
  return generateSalt(that, SALT_FACTOR, next);
});

UserSchema.methods.comparePasswords = function(incomingPassword, cb) {
  bcrypt.compare(incomingPassword, this.password, (error, isMatch) => {
    error ? cb(error) : cb(null, isMatch);
  });
};

module.exports = mongoose.model('User', UserSchema);