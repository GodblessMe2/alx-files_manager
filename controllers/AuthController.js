const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const RedisClient = require('../utils/redis');
const DBClient = require('../utils/db');

exports.getConnect = async (req, res, next) => {
  const authorization = req.header('Authorization') || null;
  if (!authorization) return res.status(401).send({ error: 'Unauthorized' });

  const buff = Buffer.from(authorization.replace('Basic ', ''), 'base64');
  const credentials = {
    email: buff.toString('utf-8').split(':')[0],
    password: buff.toString('utf-8').split(':')[1],
  };

  if (!credentials.email || !credentials.password) return res.status(401).send({ error: 'Unauthorized' });

  credentials.password = sha1(credentials.password);

  const userExists = await DBClient.db
    .collection('users')
    .findOne(credentials);
  if (!userExists) return res.status(401).send({ error: 'Unauthorized' });

  const token = uuidv4();
  const key = `auth_${token}`;
  await RedisClient.set(key, userExists._id.toString(), 86400);

  return res.status(200).send({ token });
}

exports.getDisconnect = async (req, req) => {
  const token = req.header('X-Token') || null;
  if (!token) return res.status(401).send({ error: 'Unauthorized' });

  const redisToken = await RedisClient.get(`auth_${token}`);
  if (!redisToken) return res.status(401).send({ error: 'Unauthorized' });

  await RedisClient.del(`auth_${token}`);
  return res.status(204).send();
}
