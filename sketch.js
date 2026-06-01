// =====================================
// REALTIME COLOR HARMONY FIELD - 12 TONES VERSION
// p5.js + p5.sound
//
// index.html 에 추가:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/addons/p5.sound.min.js"></script>
//
// helvetica.ttf 파일을 sketch.js와 같은 폴더에 위치시킬 것
//
// =====================================

let cam;
let camLayer;
let uiLayer;

let soundPlayers = [];
let started = false;
let reverb;
let startTime = 0;

let particles = [];
let accumulatedParticles = [];

let helveticaFont;

// 19음계 시스템 (C Major + C Minor 혼합)
// 빨-주-노-초-파-남-보 사이에 각 2개씩 중간색 추가
const colorNotes = [
  // 빨강 계열 (0-30도)
  { name: 'red', freq: 261.63, hue: [345, 5], rgb: [255, 0, 0], label: 'C' },      // C
  { name: 'red-orange1', freq: 277.18, hue: [5, 10], rgb: [255, 64, 0], label: 'C#' }, // C# (C minor)
  { name: 'red-orange2', freq: 293.66, hue: [10, 15], rgb: [255, 128, 0], label: 'D' }, // D
  
  // 주황 계열 (15-60도)
  { name: 'orange', freq: 311.13, hue: [15, 30], rgb: [255, 165, 0], label: 'D#' },    // D# (C minor)
  { name: 'orange-yellow1', freq: 329.63, hue: [30, 40], rgb: [255, 200, 0], label: 'E' }, // E
  { name: 'orange-yellow2', freq: 349.23, hue: [40, 50], rgb: [255, 220, 0], label: 'F' }, // F
  
  // 노랑 계열 (50-90도)
  { name: 'yellow', freq: 369.99, hue: [50, 70], rgb: [255, 255, 0], label: 'F#' },    // F# (C minor)
  { name: 'yellow-green1', freq: 392.00, hue: [70, 80], rgb: [200, 255, 0], label: 'G' }, // G
  { name: 'yellow-green2', freq: 415.30, hue: [80, 90], rgb: [150, 255, 0], label: 'G#' }, // G# (C minor)
  
  // 초록 계열 (90-150度)
  { name: 'green', freq: 440.00, hue: [90, 120], rgb: [0, 255, 0], label: 'A' },       // A
  { name: 'green-cyan1', freq: 466.16, hue: [120, 140], rgb: [0, 255, 128], label: 'A#' }, // A# (C minor)
  { name: 'green-cyan2', freq: 493.88, hue: [140, 160], rgb: [0, 255, 200], label: 'B' }, // B
  
  // 파랑(시안) 계열 (160-220도)
  { name: 'cyan', freq: 523.25, hue: [160, 190], rgb: [0, 255, 255], label: 'C2' },    // C (옥타브 위)
  { name: 'cyan-blue1', freq: 554.37, hue: [190, 205], rgb: [0, 200, 255], label: 'C#2' }, // C#
  { name: 'cyan-blue2', freq: 587.33, hue: [205, 220], rgb: [0, 150, 255], label: 'D2' }, // D
  
  // 남색(블루) 계열 (220-280도)
  { name: 'blue', freq: 622.25, hue: [220, 250], rgb: [0, 100, 255], label: 'D#2' },   // D#
  { name: 'blue-purple1', freq: 659.25, hue: [250, 265], rgb: [100, 50, 255], label: 'E2' }, // E
  { name: 'blue-purple2', freq: 698.46, hue: [265, 280], rgb: [150, 0, 255], label: 'F2' }, // F
  
  // 보라 계열 (280-345도)
  { name: 'purple', freq: 739.99, hue: [280, 310], rgb: [200, 0, 255], label: 'F#2' }, // F#
  { name: 'purple-red1', freq: 783.99, hue: [310, 327], rgb: [255, 0, 200], label: 'G2' }, // G
  { name: 'purple-red2', freq: 830.61, hue: [327, 345], rgb: [255, 0, 100], label: 'G#2' }  // G#
];

const noteShapeLeft = [];
const noteShapeRight = [];

// 연속된 8분음표 🎵 형태 생성
function generateNoteShapes() {
  // 왼쪽 음표 - 두 음표 간격 증가 + beam 사선
  
  // 첫 번째 음표 머리 (왼쪽 하단)
  for (let i = 0; i < 120; i++) {
    let angle = random(TWO_PI);
    let radius = random(15, 22);
    noteShapeLeft.push({
      x: 0.05 + cos(angle) * radius / width,
      y: 0.80 + sin(angle) * radius / height
    });
  }
  
  // 두 번째 음표 머리 (첫 번째보다 오른쪽 + 위, 간격 증가)
  for (let i = 0; i < 120; i++) {
    let angle = random(TWO_PI);
    let radius = random(15, 22);
    noteShapeLeft.push({
      x: 0.12 + cos(angle) * radius / width,  // 0.10 → 0.12 (간격 증가)
      y: 0.68 + sin(angle) * radius / height  // 0.73 → 0.68 (높이 차이 증가)
    });
  }
  
  // 첫 번째 음표 기둥 (세로선)
  for (let i = 0; i < 70; i++) {
    noteShapeLeft.push({
      x: 0.05 + random(-2, 2) / width,
      y: random(0.42, 0.80)  // 기둥 길이 증가
    });
  }
  
  // 두 번째 음표 기둥 (세로선, 더 높음)
  for (let i = 0; i < 70; i++) {
    noteShapeLeft.push({
      x: 0.12 + random(-2, 2) / width,
      y: random(0.32, 0.68)  // 0.40 → 0.32 (더 위로)
    });
  }
  
  // 연결 가로줄 (beam - 사선으로 올라감)
  for (let i = 0; i < 60; i++) {
    let t = i / 60;
    noteShapeLeft.push({
      x: 0.05 + t * 0.07,  // 0.04 → 0.07 (폭 증가)
      y: 0.42 - t * 0.10 + random(-1, 1) / height  // 사선 (왼쪽 낮음 → 오른쪽 높음)
    });
  }
  

  // 오른쪽 음표 - 대칭 구조 (간격 증가 + beam 사선)
  
  // 첫 번째 음표 머리 (오른쪽 하단)
  for (let i = 0; i < 120; i++) {
    let angle = random(TWO_PI);
    let radius = random(15, 22);
    noteShapeRight.push({
      x: 0.95 + cos(angle) * radius / width,
      y: 0.80 + sin(angle) * radius / height
    });
  }
  
  // 두 번째 음표 머리 (첫 번째보다 왼쪽 + 위)
  for (let i = 0; i < 120; i++) {
    let angle = random(TWO_PI);
    let radius = random(15, 22);
    noteShapeRight.push({
      x: 0.88 + cos(angle) * radius / width,  // 0.90 → 0.88
      y: 0.68 + sin(angle) * radius / height
    });
  }
  
  // 첫 번째 음표 기둥
  for (let i = 0; i < 70; i++) {
    noteShapeRight.push({
      x: 0.95 + random(-2, 2) / width,
      y: random(0.42, 0.80)
    });
  }
  
  // 두 번째 음표 기둥 (더 높음)
  for (let i = 0; i < 70; i++) {
    noteShapeRight.push({
      x: 0.88 + random(-2, 2) / width,
      y: random(0.32, 0.68)
    });
  }
  
  // 연결 가로줄 (beam - 사선)
  for (let i = 0; i < 60; i++) {
    let t = i / 60;
    noteShapeRight.push({
      x: 0.88 + t * 0.07,  // 왼쪽에서 오른쪽으로
      y: 0.32 + t * 0.10 + random(-1, 1) / height  // 사선 (왼쪽 높음 → 오른쪽 낮음)
    });
  }
}

class ColorParticle {
  constructor(colorData, intensity, side) {
    this.side = side;
    
    if (side === 'left') {
      this.x = random(0, width * 0.2);
    } else {
      this.x = random(width * 0.8, width);
    }
    
    this.y = random(-100, -20);
    this.speed = map(intensity, 0, 1, 6, 15);
    this.color = colorData.rgb;
    this.label = colorData.label;
    this.size = map(intensity, 0, 1, 8, 20);
    this.alpha = 255;
    this.rotation = random(-0.2, 0.2);
    this.rotSpeed = random(-0.05, 0.05);
    this.bouncing = false;
    this.bounceVelocity = 0;
    this.settled = false;
    this.targetX = 0;
    this.targetY = 0;
    this.movingToTarget = false;
  }
  
  update() {
    if (this.settled) {
      return;
    }
    
    if (this.movingToTarget) {
      let dx = this.targetX - this.x;
      let dy = this.targetY - this.y;
      this.x += dx * 0.3;
      this.y += dy * 0.3;
      this.rotation *= 0.9;
      
      if (abs(dx) < 1 && abs(dy) < 1) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.rotation = 0;
        this.settled = true;
        accumulatedParticles.push(this);
      }
      return;
    }
    
    if (!this.bouncing) {
      this.y += this.speed;
      this.rotation += this.rotSpeed;
      
      if (this.y >= height - 50) {
        this.bouncing = true;
        this.bounceVelocity = -8;
      }
    } else {
      this.bounceVelocity += 0.8;
      this.y += this.bounceVelocity;
      this.rotation += this.rotSpeed * 2;
      
      if (this.bounceVelocity > 0 && this.y >= height - 100) {
        this.settleIntoNote();
      }
    }
  }
  
  settleIntoNote() {
    this.movingToTarget = true;
    
    let noteShape = this.side === 'left' ? noteShapeLeft : noteShapeRight;
    
    if (noteShape.length > 0) {
      let targetPos = random(noteShape);
      this.targetX = targetPos.x * width + random(-5, 5);
      this.targetY = targetPos.y * height + random(-5, 5);
    } else {
      this.targetX = this.x;
      this.targetY = height - 100;
    }
  }
  
  display() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    
    fill(this.color[0], this.color[1], this.color[2], this.alpha);
    textAlign(CENTER, CENTER);
    textSize(this.size);
    textFont(helveticaFont);
    text(this.label, 0, 0);
    
    pop();
  }
  
  isDead() {
    return this.settled;
  }
}

function preload() {
  helveticaFont = loadFont('helvetica.ttf');
}

function setup() {
  createCanvas(960, 540);
  
  camLayer = createGraphics(960, 540);
  uiLayer = createGraphics(960, 540);
  
  cam = createCapture(VIDEO);
  cam.size(160, 120);
  cam.hide();
  
  textAlign(CENTER, CENTER);
  
  generateNoteShapes();
}

function mousePressed() {
  if (!started) {
    userStartAudio();
    
    reverb = new p5.Reverb();
    reverb.set(3, 2);
    
    for (let i = 0; i < colorNotes.length; i++) {
      let osc = new p5.Oscillator();
      osc.setType('triangle');
      osc.freq(colorNotes[i].freq);
      osc.amp(0);
      osc.start();
      
      reverb.process(osc, 3, 2);
      
      soundPlayers.push({
        colorData: colorNotes[i],
        osc: osc,
        currentAmp: 0
      });
    }
    
    started = true;
    startTime = millis();
  }
}

function touchStarted() {
  mousePressed();
  return false;
}

function draw() {
  background(0);
  
  camLayer.clear();
  camLayer.push();
  camLayer.translate(camLayer.width, 0);
  camLayer.scale(-1, 1);
  camLayer.image(cam, 0, 0, camLayer.width, camLayer.height);
  camLayer.pop();
  
  image(camLayer, 0, 0);
  
  if (!started) {
    fill(255);
    textSize(48);
    textStyle(BOLD);
    text("CLICK OR TAP TO START", width / 2, height / 2);
    return;
  }
  
  analyzeAndPlayHarmony();
  updateParticles();
  
  image(uiLayer, 0, 0);
}

function analyzeAndPlayHarmony() {
  cam.loadPixels();
  
  if (cam.pixels.length < 10) return;
  
  let colorAmount = {};
  for (let i = 0; i < colorNotes.length; i++) {
    colorAmount[colorNotes[i].name] = 0;
  }
  
  let total = 0;
  
  for (let i = 0; i < cam.pixels.length; i += 40) {
    let r = cam.pixels[i];
    let g = cam.pixels[i + 1];
    let b = cam.pixels[i + 2];
    
    let h = rgbToHue(r, g, b);
    
    for (let j = 0; j < colorNotes.length; j++) {
      let hueRange = colorNotes[j].hue;
      if (j === 0) {
        if (h >= hueRange[0] || h < hueRange[1]) {
          colorAmount[colorNotes[j].name]++;
        }
      } else {
        if (h >= hueRange[0] && h < hueRange[1]) {
          colorAmount[colorNotes[j].name]++;
        }
      }
    }
    
    total++;
  }
  
  let elapsedTime = (millis() - startTime) / 1000;
  let generationMultiplier = elapsedTime < 20 ? 1.2 : 0.2;
  
  for (let i = 0; i < soundPlayers.length; i++) {
    let colorName = soundPlayers[i].colorData.name;
    let ratio = colorAmount[colorName] / total;
    
    let targetAmp = map(ratio, 0, 0.25, 0, 0.35, true);
    soundPlayers[i].osc.amp(targetAmp, 0.2);
    
    if (ratio > 0.015) {
      let particleCount = floor(map(ratio, 0.015, 0.25, 0.5, 3, true) * generationMultiplier);
      for (let p = 0; p < particleCount; p++) {
        if (random() < 0.4) {
          let intensity = map(ratio, 0.015, 0.25, 0.3, 1, true);
          let side = random() < 0.5 ? 'left' : 'right';
          particles.push(new ColorParticle(soundPlayers[i].colorData, intensity, side));
        }
      }
    }
    
    soundPlayers[i].currentAmp = targetAmp;
  }
}

function updateParticles() {
  uiLayer.clear();
  
  for (let i = 0; i < accumulatedParticles.length; i++) {
    uiLayer.push();
    uiLayer.translate(accumulatedParticles[i].x, accumulatedParticles[i].y);
    uiLayer.fill(accumulatedParticles[i].color[0], accumulatedParticles[i].color[1], accumulatedParticles[i].color[2], accumulatedParticles[i].alpha);
    uiLayer.textAlign(CENTER, CENTER);
    uiLayer.textSize(accumulatedParticles[i].size);
    uiLayer.textFont(helveticaFont);
    uiLayer.text(accumulatedParticles[i].label, 0, 0);
    uiLayer.pop();
  }
  
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    
    uiLayer.push();
    uiLayer.translate(particles[i].x, particles[i].y);
    uiLayer.rotate(particles[i].rotation);
    
    uiLayer.fill(particles[i].color[0], particles[i].color[1], particles[i].color[2], particles[i].alpha);
    uiLayer.textAlign(CENTER, CENTER);
    uiLayer.textSize(particles[i].size);
    uiLayer.textFont(helveticaFont);
    uiLayer.text(particles[i].label, 0, 0);
    
    uiLayer.pop();
    
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
}

function rgbToHue(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  let maxVal = max(r, g, b);
  let minVal = min(r, g, b);
  let d = maxVal - minVal;
  let h = 0;
  
  if (d === 0) {
    h = 0;
  } else if (maxVal === r) {
    h = ((g - b) / d) % 6;
  } else if (maxVal === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }
  
  h *= 60;
  if (h < 0) h += 360;
  
  return h;
}
