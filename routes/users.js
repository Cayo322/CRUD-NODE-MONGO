const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const router = express.Router();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

router.get('/', async (req, res) => {
  const users = await User.find();
  res.render('index', { users, errors: [] });
});

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('email')
      .isEmail()
      .withMessage('El correo electrónico no es válido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 5 })
      .withMessage('La contraseña debe tener al menos 5 caracteres')
      .matches(/^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).*$/)
      .withMessage(
        'La contraseña debe contener al menos una letra mayúscula y un caracter especial'
      ),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const users = await User.find();
      return res.render('index', { users, errors: errors.array() });
    }

    const newUser = new User(req.body);
    await newUser.save();
    res.redirect('/users');
  }
);

router.get('/edit/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.render('partials/edit', { user });
});

router.post('/update/:id', async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/users');
});

router.get('/delete/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/users');
});

module.exports = router;
