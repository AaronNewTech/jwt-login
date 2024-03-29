require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const users = [];
let refreshTokens = [];

console.log(users)
app.post('/users', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = { name: req.body.name, password: hashedPassword };
    users.push(user);
    res.status(201).send();
  } catch {
    res.status(500).send();
  }
  console.log(users);
});


app.post('/users/login', async (req, res) => {
  const user = users.find((user) => user.name === req.body.name);

  if (user == null) {
    return res.status(400).send('Cannot find user');
  }

  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      const refreshToken = jwt.sign({ name: user.name }, process.env.REFRESH_TOKEN_SECRET);
      refreshTokens.push(refreshToken);

      const accessToken = generateAccessToken({ name: user.name });
      res.json({ accessToken: accessToken, refreshToken: refreshToken });
      console.log(res.json({ accessToken: accessToken, refreshToken: refreshToken }))
    } else {
      res.status(401).send('Invalid password');
    }
  } catch {
    res.status(500).send();
  }
  console.log(users)
});


app.post('/token', (req, res) => {
  const refreshToken = req.body.token;

  if (refreshToken == null) return res.sendStatus(401);
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);

    const accessToken = generateAccessToken({ name: user.name });
    res.json({ accessToken: accessToken });
  });
});


app.delete('/logout', (req, res) => {
  refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
  res.sendStatus(204);
});


function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
}


app.listen(3000, () => {
  console.log('Server is running on port 3000');
  
});
