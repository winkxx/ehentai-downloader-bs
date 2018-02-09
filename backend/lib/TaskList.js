const fs = require('fs');
const path = require('path');
const nanoid = require('nanoid/generate');
const downloadGallery = require('ehentai-downloader')({
  download: {
    downloadLog: true,
    retries: 3
  }
});

const RANGE = (function(begin, end, _ = []){
  for(let i = begin; i <= end; i++)
    _.push(i);
  return _;
})(0, 100); // 只下载序号为0-100的图片

class TaskList {
  constructor(storeDirPath) {
    this.STORE_DIR_PATH = storeDirPath;
    this.TASK_DB_PATH = path.join(this.STORE_DIR_PATH, 'db.json');
    this.taskList = fs.existsSync(this.TASK_DB_PATH) ? JSON.parse(fs.readFileSync(this.TASK_DB_PATH)) : [];
  }

  save() {
    fs.writeFileSync(this.TASK_DB_PATH, JSON.stringify(this.taskList));  // 保存taskList到文件
  }

  add(galleryUrl) {
    let id = nanoid('0123456789ABCDEFGHXYZ', 8);
    let taskInfo = {
      id        : id,
      state     : undefined,
      gurl      : galleryUrl,
      outerPath : path.join(this.STORE_DIR_PATH, id),
      dirPath   : undefined,
      title     : undefined,
      logs      : []
    }
    fs.mkdirSync(taskInfo.outerPath);
    this.taskList.unshift(taskInfo);
    return {
      taskInfo: taskInfo,
      donePromise: downloadTask(taskInfo).then(this.save.bind(this))
    }
  }

  retry(id) {
    let taskInfo = this.find(id);
    if(!taskInfo || taskInfo.state !== 'failure') {
      return null;
    }
    return {
      taskInfo: taskInfo,
      donePromise: downloadTask(taskInfo).then(this.save.bind(this))
    }
  }

  find(id) {
    let taskInfo = this.taskList.find(e => e.id === id);
    return taskInfo;
  }

  all() {
    return this.taskList;
  }
}

function logDownloadProcess(ev, logArr) {
  ev.on('download', info => {
    logArr.push({
      event: 'download',
      date: +new Date(),
      index: info.index,
      fileName: info.fileName
    });
  });
  ev.on('done', _ => {
    logArr.push({
      event: 'done',
      date: +new Date()
    });
  });
  ev.on('fail', (err, info) => {
    logArr.push({
      event: 'fail',
      date: +new Date(),
      index: info.index,
      fileName: info.fileName,
      errMsg: err.message
    });
  });
  ev.on('error', err => {
    logArr.push({
      event: 'error',
      date: +new Date(),
      errMsg: err.message
    });
  });
}

function downloadTask(taskInfo) {
  taskInfo.state = 'waiting';
  return downloadGallery(taskInfo.gurl, taskInfo.outerPath, RANGE).then(ev => {
    taskInfo.title = ev.dirName;
    taskInfo.dirPath = ev.dirPath;
    taskInfo.state = 'downloading';

    logDownloadProcess(ev, taskInfo.logs);

    // 这个Promise用于保证触发done事件后再进行下一步
    return new Promise(resolve => ev.on('done', resolve));
  }).then(_ => {

    // 因为允许重试，所以日志数组中可能会有多次下载的日志
    // 这里通过'done'事件找到最后一次下载的下载日志起始位置
    // taskInfo.logs.length - 2 用来跳过这一次下载的'done'
    let beginIndex = 0;
    for (let i = taskInfo.logs.length - 2; i !== 0; i--) {
      if (taskInfo.logs[i].event === 'done') {
        beginIndex = i + 1;
        break;
      }
    }

    let lastLogs = taskInfo.logs.slice(beginIndex); // 最后一次下载的日志数组
    let hasFail = lastLogs.some(log => log.event === 'fail');
    let hasErr = lastLogs.some(log => log.event === 'error');

    if (hasErr) {
      taskInfo.state = 'error';
    } else if (hasFail) {
      taskInfo.state = 'failure';
    } else {
      taskInfo.state = 'success';
    }
  }).catch(err => {
    taskInfo.state = 'error';
    taskInfo.logs.push({
      event: 'error',
      date: +new Date(),
      errMsg: err.message
    });
  });
}

module.exports = TaskList;