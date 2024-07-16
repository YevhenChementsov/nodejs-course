const { Schema, model } = require('mongoose');
const Joi = require('joi');

const { handleMongooseError, regexp } = require('../helpers');

//* Mongoose users DB validation schema
const userSchema = new Schema(
  {
    password: {
      type: String,
      minlength: [
        6,
        'The value is shorter than the minimum allowed length ({MINLENGTH}).',
      ],
      required: [true, 'Password is required'],
    },
    email: {
      type: String,
      match: regexp.emailRegExp,
      required: [true, 'Email is required'],
      unique: true,
    },
    subscription: {
      type: String,
      enum: ['starter', 'pro', 'business'],
      default: 'starter',
    },
    token: {
      type: String,
      default: null,
    },
  },
  { versionKey: false, timestamps: true },
);

userSchema.post('save', handleMongooseError);

const User = model('user', userSchema);

//* Users Joi validation
const signupSchema = Joi.object({
  name: Joi.string()
    .pattern(regexp.nameRegExp)
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.base': 'Name should be a string',
      'string.pattern.base': 'Name should be a string',
      'string.empty': 'Name cannot be an empty field',
      'string.min': 'Name should have a minimum of {#limit} letters',
      'string.max': 'Name should have a maximum of {#limit} letters',
      'any.required': 'Name is a required field',
    }),
  email: Joi.string().pattern(regexp.emailRegExp).required().messages({
    'string.email': 'Please enter a valid email address',
    'string.empty': 'Email cannot be an empty field',
    'any.required': 'Email is a required field',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password should have a minimum of {#limit} symbols',
    'string.empty': 'Password cannot be an empty field',
    'any.required': 'Password is a required field',
  }),
});

const schemas = {
  signupSchema,
};

module.exports = {
  User,
  schemas,
};
