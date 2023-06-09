const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const RedisClient = require('../utils/redis');
const DBClient = require('../utils/db');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const mime = require('mime-types');
const Bull = require('bull');

exports.postUpload = async (req, res) => {
  const fileQueue = new Bull('fileQueue');

  const token = req.header('X-Token') || null;
  if (!token) return res.status(401).send({ error: 'Unauthorized' });

  const redisToken = await RedisClient.get(`auth_${token}`);
  if (!redisToken) return res.status(401).send({ error: 'Unauthorized' });

  const user = await DBClient.db
    .collection('users')
    .findOne({ _id: ObjectId(redisToken) });
  if (!user) return res.status(401).send({ error: 'Unauthorized' });

  const fileName = req.body.name;
  if (!fileName) return res.status(400).send({ error: 'Missing name' });

  const fileType = req.body.type;
  if (!fileType || !['folder', 'file', 'image'].includes(fileType)) return res.status(400).send({ error: 'Missing type' });

  const fileData = req.body.data;
  if (!fileData && ['file', 'image'].includes(fileType)) return res.status(400).send({ error: 'Missing data' });

  const fileIsPublic = req.body.isPublic || false;
  let idParent = req.body.parentId || 0;
  idParent = idParent === '0' ? 0 : idParent;
  if (idParent !== 0) {
    const parentFile = await DBClient.db
      .collection('files')
      .findOne({ _id: ObjectId(idParent) });
    if (!parentFile) return res.status(400).send({ error: 'Parent not found' });
    if (!['folder'].includes(parentFile.type)) return res.status(400).send({ error: 'Parent is not a folder' });
  }

  const dbFile = {
    userId: user._id,
    name: fileName,
    type: fileType,
    isPublic: fileIsPublic,
    parentId: idParent,
  };

  if (['folder'].includes(fileType)) {
    await DBClient.db.collection('files').insertOne(dbFile);
    return res.status(201).send({
      id: dbFile._id,
      userId: dbFile.userId,
      name: dbFile.name,
      type: dbFile.type,
      isPublic: dbFile.isPublic,
      parentId: dbFile.parentId,
    });
  }

  const pathDir = process.env.FOLDER_PATH || '/tmp/files_manager';
  const uuidFile = uuidv4();

  const buff = Buffer.from(fileData, 'base64');
  const pathFile = `${pathDir}/${uuidFile}`;

  await fs.mkdir(pathDir, { recursive: true }, (error) => {
    if (error) return res.status(400).send({ error: error.message });
    return true;
  });

  await fs.writeFile(pathFile, buff, (error) => {
    if (error) return res.status(400).send({ error: error.message });
    return true;
  });

  dbFile.localPath = pathFile;
  await DBClient.db.collection('files').insertOne(dbFile);

  fileQueue.add({
    userId: dbFile.userId,
    fileId: dbFile._id,
  });

  return res.status(201).send({
    id: dbFile._id,
    userId: dbFile.userId,
    name: dbFile.name,
    type: dbFile.type,
    isPublic: dbFile.isPublic,
    parentId: dbFile.parentId,
  });
}
exports.getShow = async (req, res) => {
  const fileQueue = new Bull('fileQueue');

  const token = req.header('X-Token') || null;
  if (!token) return res.status(401).send({ error: 'Unauthorized' });

  const redisToken = await RedisClient.get(`auth_${token}`);
  if (!redisToken) return res.status(401).send({ error: 'Unauthorized' });

  const user = await DBClient.db
    .collection('users')
    .findOne({ _id: ObjectId(redisToken) });
  if (!user) return res.status(401).send({ error: 'Unauthorized' });

  const fileName = req.body.name;
  if (!fileName) return res.status(400).send({ error: 'Missing name' });

  const fileType = req.body.type;
  if (!fileType || !['folder', 'file', 'image'].includes(fileType)) return res.status(400).send({ error: 'Missing type' });

  const fileData = req.body.data;
  if (!fileData && ['file', 'image'].includes(fileType)) return res.status(400).send({ error: 'Missing data' });

  const fileIsPublic = req.body.isPublic || false;
  let idParent = req.body.parentId || 0;
  idParent = idParent === '0' ? 0 : idParent;
  if (idParent !== 0) {
    const parentFile = await DBClient.db
      .collection('files')
      .findOne({ _id: ObjectId(idParent) });
    if (!parentFile) return res.status(400).send({ error: 'Parent not found' });
    if (!['folder'].includes(parentFile.type)) return res.status(400).send({ error: 'Parent is not a folder' });
  }

  const dbFile = {
    userId: user._id,
    name: fileName,
    type: fileType,
    isPublic: fileIsPublic,
    parentId: idParent,
  };

  if (['folder'].includes(fileType)) {
    await DBClient.db.collection('files').insertOne(dbFile);
    return res.status(201).send({
      id: dbFile._id,
      userId: dbFile.userId,
      name: dbFile.name,
      type: dbFile.type,
      isPublic: dbFile.isPublic,
      parentId: dbFile.parentId,
    });
  }

  const pathDir = process.env.FOLDER_PATH || '/tmp/files_manager';
  const uuidFile = uuidv4();

  const buff = Buffer.from(fileData, 'base64');
  const pathFile = `${pathDir}/${uuidFile}`;

  await fs.mkdir(pathDir, { recursive: true }, (error) => {
    if (error) return res.status(400).send({ error: error.message });
    return true;
  });

  await fs.writeFile(pathFile, buff, (error) => {
    if (error) return res.status(400).send({ error: error.message });
    return true;
  });

  dbFile.localPath = pathFile;
  await DBClient.db.collection('files').insertOne(dbFile);

  fileQueue.add({
    userId: dbFile.userId,
    fileId: dbFile._id,
  });

  return res.status(201).send({
    id: dbFile._id,
    userId: dbFile.userId,
    name: dbFile.name,
    type: dbFile.type,
    isPublic: dbFile.isPublic,
    parentId: dbFile.parentId,
  });
}
exports.getIndex = async (req, res) => {
  const token = req.header('X-Token') || null;
  if (!token) return res.status(401).send({ error: 'Unauthorized' });

  const redisToken = await RedisClient.get(`auth_${token}`);
  if (!redisToken) return res.status(401).send({ error: 'Unauthorized' });

  const user = await DBClient.db
    .collection('users')
    .findOne({ _id: ObjectId(redisToken) });
  if (!user) return res.status(401).send({ error: 'Unauthorized' });

  const parentId = req.query.parentId || 0;
  // parentId = parentId === '0' ? 0 : parentId;

  const pagination = req.query.page || 0;

  const aggregationMatch = { $and: [{ parentId }] };
  let aggregateData = [
    { $match: aggregationMatch },
    { $skip: pagination * 20 },
    { $limit: 20 },
  ];
  if (parentId === 0) aggregateData = [{ $skip: pagination * 20 }, { $limit: 20 }];

  const files = await DBClient.db
    .collection('files')
    .aggregate(aggregateData);
  const filesArray = [];
  await files.forEach((item) => {
    const fileItem = {
      id: item._id,
      userId: item.userId,
      name: item.name,
      type: item.type,
      isPublic: item.isPublic,
      parentId: item.parentId,
    };
    filesArray.push(fileItem);
  });

  return res.send(filesArray);
}
exports.putPublish = async (req, res) => {
  const token = req.header('X-Token') || null;
  if (!token) return res.status(401).send({ error: 'Unauthorized' });

  const redisToken = await RedisClient.get(`auth_${token}`);
  if (!redisToken) return res.status(401).send({ error: 'Unauthorized' });

  const user = await DBClient.db
    .collection('users')
    .findOne({ _id: ObjectId(redisToken) });
  if (!user) return res.status(401).send({ error: 'Unauthorized' });

  const idFile = req.params.id || '';

  let fileDocument = await DBClient.db
    .collection('files')
    .findOne({ _id: ObjectId(idFile), userId: user._id });
  if (!fileDocument) return res.status(404).send({ error: 'Not found' });

  await DBClient.db
    .collection('files')
    .update({ _id: ObjectId(idFile) }, { $set: { isPublic: true } });
  fileDocument = await DBClient.db
    .collection('files')
    .findOne({ _id: ObjectId(idFile), userId: user._id });

  return res.send({
    id: fileDocument._id,
    userId: fileDocument.userId,
    name: fileDocument.name,
    type: fileDocument.type,
    isPublic: fileDocument.isPublic,
    parentId: fileDocument.parentId,
  });
}
exports.putUnPublish = async (req, res) => {
  const token = req.header('X-Token') || null;
  if (!token) return res.status(401).send({ error: 'Unauthorized' });

  const redisToken = await RedisClient.get(`auth_${token}`);
  if (!redisToken) return res.status(401).send({ error: 'Unauthorized' });

  const user = await DBClient.db
    .collection('users')
    .findOne({ _id: ObjectId(redisToken) });
  if (!user) return res.status(401).send({ error: 'Unauthorized' });

  const idFile = req.params.id || '';

  let fileDocument = await DBClient.db
    .collection('files')
    .findOne({ _id: ObjectId(idFile), userId: user._id });
  if (!fileDocument) return res.status(404).send({ error: 'Not found' });

  await DBClient.db
    .collection('files')
    .update(
      { _id: ObjectId(idFile), userId: user._id },
      { $set: { isPublic: false } },
    );
  fileDocument = await DBClient.db
    .collection('files')
    .findOne({ _id: ObjectId(idFile), userId: user._id });

  return res.send({
    id: fileDocument._id,
    userId: fileDocument.userId,
    name: fileDocument.name,
    type: fileDocument.type,
    isPublic: fileDocument.isPublic,
    parentId: fileDocument.parentId,
  })
}
exports.getFile = async (req, res) => {
  const idFile = req.params.id || '';
  const size = req.query.size || 0;

  const fileDocument = await DBClient.db
    .collection('files')
    .findOne({ _id: ObjectId(idFile) });
  if (!fileDocument) return res.status(404).send({ error: 'Not found' });

  const { isPublic } = fileDocument;
  const { userId } = fileDocument;
  const { type } = fileDocument;

  let user = null;
  let owner = false;

  const token = req.header('X-Token') || null;
  if (token) {
    const redisToken = await RedisClient.get(`auth_${token}`);
    if (redisToken) {
      user = await DBClient.db
        .collection('users')
        .findOne({ _id: ObjectId(redisToken) });
      if (user) owner = user._id.toString() === userId.toString();
    }
  }

  if (!isPublic && !owner) return res.status(404).send({ error: 'Not found' });
  if (['folder'].includes(type)) return res.status(400).send({ error: "A folder doesn't have content" });

  const realPath = size === 0 ? fileDocument.localPath : `${fileDocument.localPath}_${size}`;

  try {
    const dataFile = fs.readFileSync(realPath);
    const mimeType = mime.contentType(fileDocument.name);
    res.setHeader('Content-Type', mimeType);
    return res.send(dataFile);
  } catch (error) {
    return res.status(404).send({ error: 'Not found' });
  }
}
