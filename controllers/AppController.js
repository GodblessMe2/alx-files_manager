const RedisClient = require('../utils/redis');
const DBClient = require('../utils/db');

exports.getStatus = async (req, res) => {
  const data = {
    redis: await RedisClient.isAlive(),
    db: await DBClient.isAlive(),
  };
  return res.status(200).send(data);
}

exports.getStats = async (res, req) => {
  const data = {
    users: await DBClient.nbUsers(),
    files: await DBClient.nbFiles(),
  };
  return res.status(200).send(data);
}
