const mongoose = require('mongoose');
const Post = require('./postModel');

const commentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: [true, 'Comment can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    post: {
      type: mongoose.Schema.ObjectId,
      ref: 'Post',
      required: [true, 'Comment must belong to a post']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Comment must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

commentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

commentSchema.statics.calcAverageRatings = async function(postId) {
  const stats = await this.aggregate([
    {
      $match: { post: postId }
    },
    {
      $group: {
        _id: '$post',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  if (stats.length > 0) {
    await Post.findByIdAndUpdate(postId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Post.findByIdAndUpdate(postId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};
commentSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.post);
});

commentSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  next();
});
commentSchema.post(/^findOneAnd/, async function() {
  await this.r.constructor.calcAverageRatings(this.r.post);
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
