const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const RedisClient = require('../utils/redis');
const DBClient = require('../utils/db');
const { ObjectId } = require('mongodb');

exports.postNew = async (req, res) => {
  const userEmail = req.body.email;
  if (!userEmail) return res.status(400).send({ error: 'Missing email' });

  const userPassword = req.body.password;
  if (!userPassword) return res.status(400).send({ error: 'Missing password' });

  const oldUserEmail = await DBClient.db
    .collection('users')
    .findOne({ email: userEmail });
  if (oldUserEmail) return res.status(400).send({ error: 'Already exist' });

  const shaUserPassword = sha1(userPassword);
  const result = await DBClient.db
    .collection('users')
    .insertOne({ email: userEmail, password: shaUserPassword });

  return res
    .status(201)
    .send({ id: result.insertedId, email: userEmail });
}

exports.getMe = async (req, res) => {
  const token = req.header('X-Token') || null;
  if (!token) return res.status(401).send({ error: 'Unauthorized' });

  const redisToken = await RedisClient.get(`auth_${token}`);
  if (!redisToken) return res.status(401).send({ error: 'Unauthorized' });

  const user = await DBClient.db
    .collection('users')
    .findOne({ _id: ObjectId(redisToken) });
  if (!user) return res.status(401).send({ error: 'Unauthorized' });
  delete user.password;

  return res.status(200).send({ id: user._id, email: user.email });
}
