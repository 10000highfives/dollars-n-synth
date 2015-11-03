var context = new AudioContext(),
    volume = context.createGain(),
    squareOscillators = {},
    sawtoothOscillators = {},
    analyser = context.createAnalyser(),
    dataArray = new Uint8Array(analyser.frequencyBinCount),
    canvas = document.getElementById('oscilloscope'),
    canvasCntxt = canvas.getContext('2d'),
    canvasHeight = 210,
    canvasWidth = 587;

//load and play a sample using Fetch API and web Audio API
var button = document.querySelector('#bling'),
    audioContext = new AudioContext(),
    audioBuffer,
    bufferSource;


//lower the output volume cause oscillators are loud
volume.gain.value = 0.5;

//route to output (context.destionation), speakers
volume.connect(context.destination);
//route output to analyser
volume.connect(analyser);

var keyboard = new QwertyHancock({
  id: 'keyboard',
  width: 600,
  height: 180,
  octaves: 2,
  startNote: 'A2'
});


keyboard.keyDown = function(note, frequency) {
  var squareOsc = context.createOscillator(),
      sawtoothOsc = context.createOscillator();

  squareOscillators[note] = squareOsc;
  sawtoothOscillators[note] = sawtoothOsc;

  squareOsc.connect(volume);
  sawtoothOsc.connect(volume);

  squareOsc.type = 'square';
  sawtoothOsc.type = 'sawtooth';

  squareOsc.frequency.value = frequency;
  squareOsc.detune.value = -10;

  sawtoothOsc.frequency.value = frequency;
  sawtoothOsc.detune.value = 5;

  squareOsc.start(context.currentTime);
  sawtoothOsc.start(context.currentTime);

};


keyboard.keyUp = function(note, frequency) {
  squareOscillators[note].stop(context.currentTime);
  squareOscillators[note].disconnect();

  sawtoothOscillators[note].stop(context.currentTime);
  sawtoothOscillators[note].disconnect();

};

var xWidth = canvasWidth / analyser.frequencyBinCount;

var draw = function() {
  requestAnimationFrame(function () {
    //clear canvas after each frame
    canvasCntxt.clearRect(0, 0, canvasWidth, canvasHeight);
    canvasCntxt.beginPath();

    //analyze dataArray from output
    analyser.getByteTimeDomainData(dataArray);

    for(var i = 0; i < dataArray.length; i++) {
      var yPos = dataArray[i] / 256,
          xPos = i * xWidth;

      yPos = yPos * canvasHeight;
      canvasCntxt.lineTo(xPos,yPos);
    }
      canvasCntxt.strokeStyle = 'green';
      canvasCntxt.stroke();
      draw();
  });
};

draw();


//fetch the file and return an array buffer. Then do something with it.
fetch('/audio/Sandel-OpenCulture.mp3')
  .then(function(response) {
    return response.arrayBuffer();
  })
  .then(function(arrayBuffer) {

    //decode teh array buffer into something the audio api can read, ie AudioBuffer
    audioContext.decodeAudioData(arrayBuffer, function(decodedBuffer) {

      //audio buffer is served up;
      audioBuffer = decodedBuffer;
    });
    return audioBuffer;
  });


var playSample = function() {
  //create new node to do stuff with the audio
  bufferSource = audioContext.createBufferSource();

  //point that at the returned decoded Audio buffer
  bufferSource.buffer = audioBuffer;

  //lower osc gain while sample is playing
  volume.gain.value = .1;

  //connect it to output (destination)
  bufferSource.connect(audioContext.destination);
  bufferSource.start(audioContext.currentTime);
};

button.onclick = playSample;
