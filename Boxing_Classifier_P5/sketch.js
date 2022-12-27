let serialOptions = { baudRate: 115200 };
let acc_read = []; // tracks the new shape fraction off serial
let serial; // the Serial object
let pHtmlMsg; // used for displaying messages via html (optional)
let queue = []

let model; // holds an instance of tensorflow model
let Modelisloaded=false; // Boolean True when model is loaded

let predictionReady = false;

let finalPrediction = -1;
let finalPredAccuracy = null;
let finalPredictionReady = false;

let startRecord = false;

let prediction;

function onSerialErrorOccurred(eventSender, error) {
  console.log("onSerialErrorOccurred", error);
  pHtmlMsg.html(error);
}

function onSerialConnectionOpened(eventSender) {
  console.log("onSerialConnectionOpened");
  pHtmlMsg.html("Serial connection opened successfully");
}

function onSerialConnectionClosed(eventSender) {
  console.log("onSerialConnectionClosed");
  pHtmlMsg.html("onSerialConnectionClosed");
}

async function preload() { // loades the LSTM Model
    model = await tf.loadLayersModel('https://raw.githubusercontent.com/karimjawhar5/Boxing-Classifier/main/Boxing_Classifier_P5/model.json');
    console.log(model)
    Modelisloaded=true;
}

function onSerialDataReceived(eventSender, newData) {
    //console.log("onSerialDataReceived", newData);
    pHtmlMsg.html("onSerialDataReceived: " + newData);

    // Split the string into an array of substrings using the `split()` function
    let arr = newData.split(',');

    // Use the `map()` function to convert each substring into a float
    let floats = arr.map(function(substr) {
    return [parseFloat(substr)];
    });

    if (startRecord){
      queue.push(floats);
    }
    
}

function setup() {
  createCanvas(400, 400);
  
  // Setup Web Serial using serial.js
  serial = new Serial();
  serial.on(SerialEvents.CONNECTION_OPENED, onSerialConnectionOpened);
  serial.on(SerialEvents.CONNECTION_CLOSED, onSerialConnectionClosed);
  serial.on(SerialEvents.DATA_RECEIVED, onSerialDataReceived);
  serial.on(SerialEvents.ERROR_OCCURRED, onSerialErrorOccurred);

  // If we have previously approved ports, attempt to connect with them
  serial.autoConnectAndOpenPreviouslyApprovedPort(serialOptions);

  // Add in a lil <p> element to provide messages. This is optional
  pHtmlMsg = createP("Click anywhere on this page to open the serial connection dialog");
  createButton("Record").mousePressed(startRecording);
  createButton("Connect to Serial").mousePressed(findASerialPort);
}

function startRecording() {
  startRecord = true;
  console.log(`Start record: ${startRecord}`);
}

function findASerialPort() {
  if (!serial.isOpen()) {
    serial.connectAndOpen(null, serialOptions);
  }
}

function draw() {
  background(0);
  textSize(50);
  textAlign(CENTER, CENTER);

  if(startRecord){
    fill(255, 0, 0);
    text('Recording...', width/2, height/2);
  }else if(finalPredictionReady){
    fill(255);
    text(showPrediction(finalPrediction), width/2, height/2);
    textSize(20);
    fill(100, 255, 0);
    text('Accuracy:'+str(round(finalPredAccuracy*100)), width/2, height/1.5);
  }else{
    fill(255);
    text('No Prediction', width/2, height/2);
  }

  if(Modelisloaded){

    if(queue.length >= 60){
        startRecord = false;
        predictionReady = false;
        finalPredictionReady = false;
        // Take the first 60 elements from the queue
        let frame = queue.splice(0, 60);
        console.log(frame)
        queue = []

        // Call the function on the frame
        prediction = predict([frame]);
    }
    if(predictionReady){
      prediction.then(array => {
           let maxNumber = max(array)
           finalPredAccuracy = maxNumber
           finalPrediction = array.indexOf(maxNumber);
           finalPredictionReady = true;
           
        });
      predictionReady = false;
  }
  }
}

async function predict(input) {

    const inputTensor = tf.tensor4d(input, [1, 60, 3, 1]);
    // Make a prediction using the model
    const output = model.predict(inputTensor);
    predictionReady = true;
    let array = Array.from(output.dataSync());
    return array;
  }

  function showPrediction(prediction) {
    let predictionText;
  
    // Set the predictionText based on the prediction value
    switch (prediction) {
      case 0:
        predictionText = "Jab";
        break;
      case 1:
        predictionText = "Hook";
        break;
      case 2:
        predictionText = "Uppercut";
        break;
      case 3:
        predictionText = "Stance";
        break;
      default:
        predictionText = "Invalid prediction";
        break;
    }
  
    // Display the predictionText using the text() function
    return predictionText;
  }