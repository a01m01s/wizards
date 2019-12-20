const Comment = require('./../models/commentModel');
const factory = require('./handlerFactory');

exports.getAllComments = factory.getAll(Comment);

exports.setPostsAndUsersIds = (req, res, next) => {
  // Allowed nested routs
  if (!req.body.post) req.body.post = req.params.postId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createComment = factory.createOne(Comment);

exports.getComment = factory.getOne(Comment);
exports.updateComment = factory.updateOne(Comment);
exports.deleteComment = factory.deleteOne(Comment);
