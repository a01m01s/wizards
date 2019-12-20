const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A post must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A post name must have less or equal than 40 characters'],
      minlength: [10, 'A post name must have more or equal than 10 characters']
    },
    slug: String,
    difficulty: {
      type: String,
      required: [true, 'A post must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A post mussst have summary']
    },
    content: {
      type: String,
      trim: true,
      required: [true, 'A post mussst have content']
    },
    imageCover: {
      type: String,
      required: [true, 'A post must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now()
    },
    secretPost: {
      type: Boolean,
      default: false
    },

    refrences: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Post'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

postSchema.index({ slug: 1 });

postSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'post',
  localField: '_id'
});

postSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

postSchema.pre(/^find/, function(next) {
  this.find({ secretPost: { $ne: true } });
  next();
});

postSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'refrences',
    // select: '-__v -passwordChangedAt'
    select: '-__v'
  });
  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
