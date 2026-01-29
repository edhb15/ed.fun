import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
// ===================== UI =====================
const startBtn = document.getElementById("startButton");
const restartBtn = document.getElementById("restartButton");
const startScreen = document.getElementById("startScreen");
const endScreen = document.getElementById("endScreen");
const endTitle = document.getElementById("endTitle");
const timerDiv = document.getElementById("timer");

startBtn.onclick = () => {
  startScreen.style.display = "none";
  timerDiv.style.display = "block";
  startGame();
};

restartBtn.onclick = () => location.reload();
const CAR_MODELS = {
  default: "car.glb",
  sport: "sport_car.glb",
  super: "super_car.glb"
};

// ===================== GAME =====================
function startGame() {
  let selectedCar = "default";

// Auto-select best unlocked car
if (saveDataObj.unlockedCars.includes("super")) selectedCar = "super";
else if (saveDataObj.unlockedCars.includes("sport")) selectedCar = "sport";

  const SAVE_KEY = "kartSurvivalData";

function loadSave() {
  return JSON.parse(localStorage.getItem(SAVE_KEY)) || {
    bestTime: null,
    unlockedCars: ["default"]
  };
}

function saveData(data) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

let saveDataObj = loadSave();

  // ---------- SCENE ----------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe9ff);

  // ---------- CAMERA ----------
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // ---------- RENDERER ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // ---------- LIGHTING ----------
  scene.add(new THREE.HemisphereLight(0xcceeff, 0x88aa88, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(50, 80, 20);
  scene.add(sun);

  // ---------- GROUND ----------
  const BOUNDS = 80;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x5fbf60, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ---------- INPUT ----------
  const keys = {};
  window.addEventListener("keydown", e => keys[e.code] = true);
  window.addEventListener("keyup", e => keys[e.code] = false);

  // ---------- CAR (GLTF) ----------
  let car, carHitbox;
  let speed = 0, turn = 0;

  loader.load(CAR_MODELS[selectedCar], gltf => {
    car = gltf.scene;
    car.scale.set(1.2, 1.2, 1.2);
    car.rotation.y = Math.PI;
    scene.add(car);
  });
  

    carHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1, 3.2),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    carHitbox.position.y = 0.5;
    scene.add(carHitbox);
  };

  // ---------- OBSTACLES ----------
  const obstacles = [];
  const movingObstacles = [];

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  for (let i = 0; i < 20; i++) {
    const o = new THREE.Mesh(
      new THREE.BoxGeometry(2, rand(2, 4), 2),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    o.position.set(rand(-BOUNDS, BOUNDS), o.scale.y, rand(-BOUNDS, BOUNDS));
    scene.add(o);
    obstacles.push(o);
  }

  for (let i = 0; i < 10; i++) {
    const o = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0x3366ff })
    );
    o.position.set(rand(-BOUNDS, BOUNDS), 1, rand(-BOUNDS, BOUNDS));
    o.userData.vel = new THREE.Vector3(rand(-1.2, 1.2), 0, rand(-1.2, 1.2));
    scene.add(o);
    movingObstacles.push(o);
  }

  // ---------- COINS ----------
  function createCoinTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(0, 0, 128, 128);
    const g = ctx.createLinearGradient(60, 0, 68, 0);
    g.addColorStop(0, "#fff700");
    g.addColorStop(0.5, "#FFD700");
    g.addColorStop(1, "#fff700");
    ctx.fillStyle = g;
    ctx.fillRect(60, 0, 8, 128);
    return new THREE.CanvasTexture(c);
  }

  const coins = [];
  const coinMat = new THREE.MeshStandardMaterial({
    map: createCoinTexture(),
    emissive: 0xffff33,
    metalness: 0.8,
    roughness: 0.3
  });

  for (let i = 0; i < 15; i++) {
    const c = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 16),
      coinMat
    );
    c.position.set(rand(-BOUNDS, BOUNDS), 0.6, rand(-BOUNDS, BOUNDS));
    scene.add(c);
    coins.push(c);
  }

  // ---------- TIMER ----------
  const GAME_TIME_LIMIT = 60;
  let startTime = performance.now();


  // ---------- COLLISION ----------
  function collide(obj) {
    if (!carHitbox) return;
    if (carHitbox.position.distanceTo(obj.position) < 1.8) {
      speed *= -0.4;
      car.translateZ(-0.8);
    }
  }

  // ---------- END ----------
  function handleWin() {
    const finishTime = (performance.now() - startTime) / 1000;
  
    // Best time logic
    if (!saveDataObj.bestTime || finishTime < saveDataObj.bestTime) {
      saveDataObj.bestTime = finishTime;
    }
  
    // Unlock logic
    if (finishTime < 45 && !saveDataObj.unlockedCars.includes("sport")) {
      saveDataObj.unlockedCars.push("sport");
    }
  
    if (finishTime < 35 && !saveDataObj.unlockedCars.includes("super")) {
      saveDataObj.unlockedCars.push("super");
    }
  
    saveData(saveDataObj);
  
    endTitle.innerText = `YOU WIN!\nTime: ${finishTime.toFixed(2)}s`;
    endScreen.style.display = "flex";
  }
  

  // ---------- RESIZE ----------
  window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  // ---------- LOOP ----------
  function animate() {
    requestAnimationFrame(animate);
    if (!car) return;

    // Timer
    timeLeft -= 1 / 60;
    timerDiv.innerText = `Time: ${timeLeft.toFixed(1)} | Coins: ${coins.length}`;

    if (coins.length === 0) return handleWin();
    if (timeLeft <= 0) return endGame("GAME OVER 😢");

    // Controls
    if (keys["KeyW"]) speed += 0.04;
    if (keys["KeyS"]) speed -= 0.04;
    speed *= 0.95;

    if (keys["KeyA"]) turn += 0.025;4
    if (keys["KeyD"]) turn -= 0.025;
    turn *= 0.8;

    car.rotation.y += turn;
    car.translateZ(speed);

    carHitbox.position.copy(car.position);
    carHitbox.rotation.copy(car.rotation);

    car.position.x = THREE.MathUtils.clamp(car.position.x, -BOUNDS, BOUNDS);
    car.position.z = THREE.MathUtils.clamp(car.position.z, -BOUNDS, BOUNDS);

    // Obstacles
    obstacles.forEach(collide);

    movingObstacles.forEach(o => {
      o.position.add(o.userData.vel);
      if (Math.abs(o.position.x) > BOUNDS) o.userData.vel.x *= -1;
      if (Math.abs(o.position.z) > BOUNDS) o.userData.vel.z *= -1;
      collide(o);
    });

    // Coins
    for (let i = coins.length - 1; i >= 0; i--) {
      coins[i].rotation.y += 0.08;
      if (carHitbox.position.distanceTo(coins[i].position) < 1.2) {
        scene.remove(coins[i]);
        coins.splice(i, 1);
      }
    }

    // Camera
    const camOffset = new THREE.Vector3(0, 6, -10)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y);
    camera.position.lerp(car.position.clone().add(camOffset), 0.08);
    camera.lookAt(car.position);

    renderer.render(scene, camera);
  }

  animate();
