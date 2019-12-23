const Post = require('../models/postModel');
const catchAsync = require('../utils/catchAsync');

exports.getMain = (req, res) => {
  res.status(200).render('main', {
    title: 'Magic World'
  });
};

exports.getOverview = catchAsync(async (req, res, next) => {
  const posts = await Post.find();

  res.status(200).render('overview', {
    title: 'All posts',
    posts
  });
});

exports.getPost = catchAsync(async (req, res, next) => {
  const post = await Post.findOne({ slug: req.params.slug }).populate({
    path: 'comments',
    fields: 'comment rating user'
  });
  res.status(200).render('post', {
    title: 'this is the title of the post',
    post
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Login'
  });
};
