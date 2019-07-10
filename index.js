const https = require('https');
const inquirer = require('inquirer');


// Use https to make get request for the task
const getADPTask = () => new Promise((resolve, reject) => {
  console.log('Gettings Task...');
  https.get('https://interview.adpeai.com/api/v1/get-task', (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      resolve(JSON.parse(data));
    });
  }).on('error', (err) => {
    reject(err);
  });
});


// Use https to make post request with id and answer
const postAnswer = (id, result) => new Promise((resolve) => {
  console.log('Submitting Answer...');
  const postData = JSON.stringify({ id, result });
  const options = {
    hostname: 'interview.adpeai.com',
    path: '/api/v1/submit-task',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  https.request(options, (res) => {
    const { statusCode } = res;
    let message = '';

    res.on('data', (chunk) => {
      message += chunk;
    });

    res.on('end', () => {
      resolve({ message, statusCode });
    });
  }).write(postData);
});


const performTask = (task) => {
  console.log('Performing Task...');
  const {
    operation, left, right,
  } = task;
  let result;

  switch (operation) {
    case 'addition':
      result = left + right;
      break;
    case 'subtraction':
      result = left - right;
      break;
    case 'division':
      result = left / right;
      break;
    case 'multiplication':
      result = left * right;
      break;
    case 'remainder':
      result = left % right;
      break;
    default:
      result = `Unknown Operation: ${operation}`;
  }

  return result;
};


const getAndPost = async () => {
  const task = await getADPTask();
  const { id } = task;
  const answer = performTask(task);
  const { message, statusCode } = await postAnswer(id, answer);

  console.log(`Status Code: ${statusCode}`);
  console.log(`Message: ${message}`);
};


const continuousCall = async () => {
  await getAndPost();
  console.log('Waiting...');
  setTimeout(() => {
    continuousCall();
  }, 5000);
};


const askUser = async () => {
  const singleTask = 'Get and post a single task.';
  const continuousTasks = 'Continuously get and post tasks.';
  const { selection } = await inquirer.prompt([{
    type: 'list',
    message: 'What would you like to do?',
    choices: [singleTask, continuousTasks, 'Exit.'],
    name: 'selection',
  }]);

  if (selection === singleTask) {
    await getAndPost();
    askUser();
  } else if (selection === continuousTasks) {
    continuousCall();
  } else {
    console.log('Goodbye.');
  }
};

askUser();
