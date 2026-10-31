/**
 * 2.5D Orthographic Cozy Simulation Game Engine for ClimateKaz
 * Built with Three.js r160, ACES Filmic Tone Mapping, procedural models,
 * and zero external assets.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TASKS_CATALOG, TaskDefinition, PlayerResources } from './rules.ts';
import { sounds } from '../audio/soundEffects.ts';

export interface SceneCallbacks {
  onStationProximity: (task: TaskDefinition | null) => void;
  onStationClick: (task: TaskDefinition) => void;
  onPlayerPositionUpdate: (pos: { x: number; z: number }) => void;
}

export class ClimateKazScene {
  private container: HTMLDivElement;
  private callbacks: SceneCallbacks;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private lastTime: number = 0;

  // Player Character: Kaz the Duck
  private playerGroup!: THREE.Group;
  private playerBodyMesh!: THREE.Mesh;
  private leftWingMesh!: THREE.Mesh;
  private rightWingMesh!: THREE.Mesh;
  private leftFootMesh!: THREE.Mesh;
  private rightFootMesh!: THREE.Mesh;
  private playerTargetPos = new THREE.Vector3(0, 0, 0);
  private playerFacing = new THREE.Vector3(0, 0, 1);
  private isWalking = false;
  private walkDistance = 0;

  // Station objects and interactables
  private stations: { task: TaskDefinition; group: THREE.Group; marker: THREE.Group; floatingY: number }[] = [];
  private windTurbineBlades: THREE.Group[] = [];
  private oceanPlastics: THREE.Mesh[] = [];
  private farmCrops: THREE.Group[] = [];
  private waterMesh!: THREE.Mesh;

  // Input state
  private keysPressed = new Set<string>();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Particles
  private particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[] = [];
  private particleGroup = new THREE.Group();

  constructor(container: HTMLDivElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.init();
  }

  private init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch (_) {
        return true;
      }
    })();

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa2e2f2); // Vibrant tropical sky
    this.scene.fog = new THREE.Fog(0xa2e2f2, 40, 75);

    // Camera: 2.5D Orthographic Isometric Camera
    const aspect = width / height;
    const viewSize = 21;
    this.camera = new THREE.OrthographicCamera(
      (-viewSize * aspect) / 2,
      (viewSize * aspect) / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      100
    );
    // Classical 45-degree isometric camera setup
    this.camera.position.set(16, 17, 16);
    this.camera.lookAt(0, 0, 0);

    // Environment map
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch (_) {}

    // Lighting
    this.setupLighting();

    // World & Island
    this.buildIsland();

    // Character
    this.buildKazTheDuck();

    // Stations
    this.buildAllStations();

    // Particles
    this.scene.add(this.particleGroup);

    // Event listeners
    this.setupEvents();

    // Ensure initial dimensions & immediate first paint
    this.onWindowResize();
    this.renderer.render(this.scene, this.camera);

    // Start loop
    this.lastTime = performance.now();
    this.tick = this.tick.bind(this);
    this.frameId = requestAnimationFrame(this.tick);
  }

  private setupLighting() {
    // Warm Golden Key Sun
    const sunLight = new THREE.DirectionalLight(0xfff8e7, 1.4);
    sunLight.position.set(15, 24, 12);
    if (!this.isSoftwareGl) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 50;
      const d = 16;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(sunLight);

    // Cool Sky & Lush Grass Fill
    const hemiLight = new THREE.HemisphereLight(0x60c5db, 0x388e3c, 0.7);
    this.scene.add(hemiLight);

    // Gentle Warm Rim
    const rimLight = new THREE.DirectionalLight(0xffe082, 0.4);
    rimLight.position.set(-12, 12, -12);
    this.scene.add(rimLight);
  }

  private buildIsland() {
    // 1. Lush Main Island Platform (layered rounded green hill)
    const islandGeo = new THREE.CylinderGeometry(15, 16.5, 2.2, 48);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x48a838, // Rich HayDay meadow green
      roughness: 0.65,
      metalness: 0.05,
    });
    const islandMesh = new THREE.Mesh(islandGeo, islandMat);
    islandMesh.position.y = -1.1;
    islandMesh.receiveShadow = true;
    this.scene.add(islandMesh);

    // Earthy soil edge under grass
    const soilRimGeo = new THREE.CylinderGeometry(16.5, 17.5, 0.8, 48);
    const soilRimMat = new THREE.MeshStandardMaterial({
      color: 0x8d5b32, // Warm loam soil
      roughness: 0.9,
    });
    const soilRim = new THREE.Mesh(soilRimGeo, soilRimMat);
    soilRim.position.y = -2.1;
    soilRim.receiveShadow = true;
    this.scene.add(soilRim);

    // Subtle Sandy shoreline shelf
    const shoreGeo = new THREE.CylinderGeometry(17.5, 19.2, 0.6, 48);
    const shoreMat = new THREE.MeshStandardMaterial({
      color: 0xf1c453, // Warm golden beach sand
      roughness: 0.85,
    });
    const shoreMesh = new THREE.Mesh(shoreGeo, shoreMat);
    shoreMesh.position.y = -2.6;
    shoreMesh.receiveShadow = true;
    this.scene.add(shoreMesh);

    // 2. Sparkling Shimmering Water Lagoon (Ocean Zone)
    const waterGeo = new THREE.PlaneGeometry(70, 70, 16, 16);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1b9aaa, // Deep tropical teal
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = -1.8;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // 3. Cobblestone Garden Pathways connecting zones
    const pathGroup = new THREE.Group();
    const pathCoords = [
      { x: 0, z: 0 },
      { x: -2, z: 1 },
      { x: -4, z: 2 },
      { x: -6, z: 4 }, // To Zero waste
      { x: 2, z: 2 },
      { x: 4, z: 4 },
      { x: 5, z: 6 }, // To Academy
      { x: 3, z: -2 },
      { x: 5, z: -3 },
      { x: 7, z: -4 }, // To Farm
      { x: -3, z: -3 },
      { x: -5, z: -5 },
      { x: -7, z: -6 }, // To Lagoon Pier
      { x: 0, z: 4 },
      { x: 0, z: 7 }, // To City
      { x: 3, z: 0 },
      { x: 6, z: 0 }, // To Renewables
      { x: -3, z: -1 },
      { x: -4, z: -2 }, // To Bazaar
    ];

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xe0d6c3,
      roughness: 0.9,
    });

    pathCoords.forEach((coord) => {
      const stoneGeo = new THREE.CylinderGeometry(0.55 + Math.random() * 0.1, 0.6, 0.08, 8);
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(coord.x + (Math.random() - 0.5) * 0.3, 0.04, coord.z + (Math.random() - 0.5) * 0.3);
      stone.receiveShadow = true;
      pathGroup.add(stone);
    });
    this.scene.add(pathGroup);

    // 4. Cozy Perimeter Foliage & Trees
    this.buildPerimeterFlora();
  }

  private buildPerimeterFlora() {
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.85 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.65 });
    const flowerMatA = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
    const flowerMatB = new THREE.MeshStandardMaterial({ color: 0xfeca57 });

    const treePositions = [
      { x: -10, z: 2, s: 1.1 },
      { x: -9, z: 7, s: 0.9 },
      { x: -3, z: 11, s: 1.2 },
      { x: 4, z: 10, s: 1.0 },
      { x: 10, z: 6, s: 1.15 },
      { x: 11, z: -1, s: 0.85 },
      { x: 9, z: -8, s: 1.05 },
      { x: 2, z: -11, s: 1.25 },
      { x: -2, z: -10, s: 0.95 },
    ];

    treePositions.forEach((tp) => {
      const tree = new THREE.Group();
      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * tp.s, 0.35 * tp.s, 1.4 * tp.s, 8), treeTrunkMat);
      trunk.position.y = (0.7 * tp.s);
      trunk.castShadow = !this.isSoftwareGl;
      tree.add(trunk);

      // 3 Stacked stylized fluffy foliage cones
      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry((1.1 - i * 0.22) * tp.s, (0.95 - i * 0.1) * tp.s, 8),
          foliageMat
        );
        cone.position.y = (1.2 + i * 0.6) * tp.s;
        cone.castShadow = !this.isSoftwareGl;
        tree.add(cone);
      }

      tree.position.set(tp.x, 0, tp.z);
      this.scene.add(tree);
    });

    // Cozy flower patches
    for (let f = 0; f < 24; f++) {
      const angle = (f / 24) * Math.PI * 2;
      const radius = 11 + Math.sin(f * 3) * 2.5;
      const flower = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.18, 0),
        f % 2 === 0 ? flowerMatA : flowerMatB
      );
      flower.position.set(Math.cos(angle) * radius, 0.15, Math.sin(angle) * radius);
      this.scene.add(flower);
    }
  }

  /**
   * Hero character: Kaz the Duck!
   * Multi-part cute stylized 3D duck with leaf gardener hat.
   */
  private buildKazTheDuck() {
    this.playerGroup = new THREE.Group();

    const duckYellow = new THREE.MeshStandardMaterial({
      color: 0xffd124, // Bright cute duck yellow
      roughness: 0.6,
      metalness: 0.05,
    });
    const beakOrange = new THREE.MeshStandardMaterial({
      color: 0xff7a00, // Vibrant orange bill
      roughness: 0.5,
    });
    const eyeBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
    const leafGreen = new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.5 });
    const blushPink = new THREE.MeshStandardMaterial({ color: 0xff8da1, roughness: 0.7 });

    // 1. Plump Body (Egg-shaped cylinder/sphere)
    this.playerBodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), duckYellow);
    this.playerBodyMesh.scale.set(1.0, 1.15, 1.2);
    this.playerBodyMesh.position.y = 0.65;
    this.playerBodyMesh.castShadow = !this.isSoftwareGl;
    this.playerGroup.add(this.playerBodyMesh);

    // 2. Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), duckYellow);
    head.position.set(0, 1.15, 0.2);
    head.castShadow = !this.isSoftwareGl;
    this.playerGroup.add(head);

    // 3. Duck Bill
    const bill = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.3), beakOrange);
    bill.position.set(0, 1.08, 0.52);
    bill.castShadow = !this.isSoftwareGl;
    this.playerGroup.add(bill);

    // 4. Eyes & Blushing Cheeks
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), eyeBlack);
    eyeL.position.set(-0.16, 1.22, 0.48);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), eyeBlack);
    eyeR.position.set(0.16, 1.22, 0.48);
    this.playerGroup.add(eyeL, eyeR);

    const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), blushPink);
    blushL.position.set(-0.25, 1.12, 0.45);
    blushL.rotation.y = -0.3;
    const blushR = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), blushPink);
    blushR.position.set(0.25, 1.12, 0.45);
    blushR.rotation.y = 0.3;
    this.playerGroup.add(blushL, blushR);

    // 5. Flapping Wings (Left & Right)
    const wingGeo = new THREE.ConeGeometry(0.24, 0.65, 8);
    wingGeo.rotateZ(Math.PI / 2);
    this.leftWingMesh = new THREE.Mesh(wingGeo, duckYellow);
    this.leftWingMesh.position.set(-0.55, 0.72, 0);
    this.leftWingMesh.rotation.y = 0.2;
    this.rightWingMesh = new THREE.Mesh(wingGeo, duckYellow);
    this.rightWingMesh.position.set(0.55, 0.72, 0);
    this.rightWingMesh.rotation.y = -0.2;
    this.playerGroup.add(this.leftWingMesh, this.rightWingMesh);

    // 6. Orange Webbed Feet
    const footGeo = new THREE.BoxGeometry(0.22, 0.06, 0.34);
    this.leftFootMesh = new THREE.Mesh(footGeo, beakOrange);
    this.leftFootMesh.position.set(-0.22, 0.05, 0.05);
    this.rightFootMesh = new THREE.Mesh(footGeo, beakOrange);
    this.rightFootMesh.position.set(0.22, 0.05, 0.05);
    this.playerGroup.add(this.leftFootMesh, this.rightFootMesh);

    // 7. Gardener Sprout / Leaf Hat
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.2, 6), leafGreen);
    stem.position.set(0, 1.55, 0.2);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), leafGreen);
    leaf.scale.set(1.5, 0.3, 0.8);
    leaf.position.set(0.08, 1.62, 0.2);
    leaf.rotation.z = 0.4;
    this.playerGroup.add(stem, leaf);

    // 8. Soft Ground Shadow
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x224411,
      transparent: true,
      opacity: 0.32,
    });
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.52, 16), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.playerGroup.add(shadow);

    this.playerGroup.scale.setScalar(1.22);
    this.playerGroup.position.set(0, 0, 0);
    this.scene.add(this.playerGroup);
  }

  /**
   * Builds the 7 SDG Interactive Stations
   */
  private buildAllStations() {
    TASKS_CATALOG.forEach((task) => {
      const stationGroup = new THREE.Group();
      stationGroup.position.set(task.location.x, 0, task.location.z);

      // Station specific procedural 3D model
      switch (task.topic) {
        case 'zero_waste':
          this.buildZeroWasteModel(stationGroup);
          break;
        case 'climate_education':
          this.buildEducationModel(stationGroup);
          break;
        case 'food_security':
          this.buildFarmModel(stationGroup);
          break;
        case 'marine_health':
          this.buildMarineSanctuaryModel(stationGroup);
          break;
        case 'resilient_cities':
          this.buildResilientCityModel(stationGroup);
          break;
        case 'conscious_consumption':
          this.buildBazaarModel(stationGroup);
          break;
        case 'renewable_energy':
          this.buildRenewableEnergyModel(stationGroup);
          break;
      }

      // Overhead Floating 3D Badge Indicator
      const marker = this.createStationMarker(task);
      marker.position.set(0, 3.2, 0);
      stationGroup.add(marker);

      // Base footprint ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        wireframe: true,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.75, 24), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      stationGroup.add(ring);

      this.scene.add(stationGroup);
      this.stations.push({
        task,
        group: stationGroup,
        marker,
        floatingY: 3.2,
      });
    });
  }

  private createBadgeTexture(emoji: string, bgColor: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    // Circle background
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();
    // Inner border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.stroke();
    // Emoji Icon
    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 68);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private createStationMarker(task: TaskDefinition): THREE.Group {
    const marker = new THREE.Group();

    const emojiMap: Record<string, { emoji: string; bg: string }> = {
      zero_waste: { emoji: '♻️', bg: '#2e7d32' },
      climate_education: { emoji: '🎓', bg: '#1565c0' },
      food_security: { emoji: '🥕', bg: '#ef6c00' },
      marine_health: { emoji: '🌊', bg: '#00838f' },
      resilient_cities: { emoji: '🏙️', bg: '#6a1b9a' },
      conscious_consumption: { emoji: '🛍️', bg: '#c2185b' },
      renewable_energy: { emoji: '⚡', bg: '#f9a825' },
    };

    const cfg = emojiMap[task.topic] || { emoji: '🌱', bg: '#2e7d32' };

    // Outer white rim
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
    });
    const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.14, 24), badgeMat);
    badge.rotation.x = Math.PI / 2;
    marker.add(badge);

    // Front icon face
    const iconTex = this.createBadgeTexture(cfg.emoji, cfg.bg);
    const frontMat = new THREE.MeshBasicMaterial({ map: iconTex, transparent: true });
    const front = new THREE.Mesh(new THREE.CircleGeometry(0.72, 24), frontMat);
    front.position.z = 0.08;
    marker.add(front);

    // Back icon face
    const back = new THREE.Mesh(new THREE.CircleGeometry(0.72, 24), frontMat);
    back.position.z = -0.08;
    back.rotation.y = Math.PI;
    marker.add(back);

    return marker;
  }

  // 1. Zero Waste Station (Color-coded sorting bins & upcycle crate)
  private buildZeroWasteModel(group: THREE.Group) {
    const binColors = [0x4caf50, 0x2196f3, 0xffc107]; // Organic, Paper/Plastic, Glass/E-waste
    binColors.forEach((col, i) => {
      const binGeo = new THREE.CylinderGeometry(0.35, 0.3, 0.9, 12);
      const binMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 });
      const bin = new THREE.Mesh(binGeo, binMat);
      bin.position.set((i - 1) * 0.9, 0.45, 0);
      bin.castShadow = !this.isSoftwareGl;
      group.add(bin);

      const lidGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.1, 12);
      const lidMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 });
      const lid = new THREE.Mesh(lidGeo, lidMat);
      lid.position.set((i - 1) * 0.9, 0.95, 0);
      group.add(lid);
    });

    // Compost box
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.9), woodMat);
    crate.position.set(0, 0.3, 1.1);
    group.add(crate);
  }

  // 2. Climate Education Academy (Cozy open gazebo & chalkboard)
  private buildEducationModel(group: THREE.Group) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xa1887f, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });

    // 4 Corner pillars
    for (let x = -1; x <= 1; x += 2) {
      for (let z = -1; z <= 1; z += 2) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8), woodMat);
        pillar.position.set(x * 0.9, 1.0, z * 0.9);
        group.add(pillar);
      }
    }

    // Gazebo Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.0, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 2.4, 0);
    group.add(roof);

    // Chalkboard
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.9 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.08), boardMat);
    board.position.set(0, 1.2, -0.85);
    group.add(board);
  }

  // 3. Sustainable Permaculture Farm
  private buildFarmModel(group: THREE.Group) {
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.95 });
    const soil = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 2.0), soilMat);
    soil.position.set(0, 0.1, 0);
    group.add(soil);

    // Rows of cute organic carrots and corn
    const cropMatA = new THREE.MeshStandardMaterial({ color: 0xff7043 });
    const cropMatB = new THREE.MeshStandardMaterial({ color: 0x81c784 });
    const farmCropsSubgroup = new THREE.Group();

    for (let rx = -0.8; rx <= 0.8; rx += 0.8) {
      for (let rz = -0.7; rz <= 0.7; rz += 0.45) {
        const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), cropMatA);
        carrot.rotation.x = Math.PI;
        carrot.position.set(rx, 0.35, rz);
        const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), cropMatB);
        foliage.position.set(rx, 0.45, rz);
        farmCropsSubgroup.add(carrot, foliage);
      }
    }
    group.add(farmCropsSubgroup);
    this.farmCrops.push(farmCropsSubgroup);

    // Drip irrigation black hose
    const hoseMat = new THREE.MeshStandardMaterial({ color: 0x212121 });
    const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), hoseMat);
    hose.rotation.x = Math.PI / 2;
    hose.position.set(0, 0.22, 0);
    group.add(hose);
  }

  // 4. Ocean & Marine Health (Wooden Jetty Pier + Floating Plastic in Water)
  private buildMarineSanctuaryModel(group: THREE.Group) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.8 });
    // Pier extending into lagoon
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 2.4), woodMat);
    pier.position.set(0, -0.3, -0.6);
    group.add(pier);

    // Pier pilings
    for (let px = -0.5; px <= 0.5; px += 1.0) {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), woodMat);
      piling.position.set(px, -0.8, -1.6);
      group.add(piling);
    }

    // Floating plastics in the water to clear
    const plasticMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    for (let p = 0; p < 5; p++) {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8), plasticMat);
      bottle.rotation.z = Math.PI / 2 + Math.random() * 0.4;
      bottle.position.set((Math.random() - 0.5) * 2.2, -1.4, -2.0 - Math.random() * 1.5);
      group.add(bottle);
      this.oceanPlastics.push(bottle);
    }
  }

  // 5. Climate-Resilient City District (Living Sedum Green Roof)
  private buildResilientCityModel(group: THREE.Group) {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xefebe9, roughness: 0.8 });
    const greenRoofMat = new THREE.MeshStandardMaterial({ color: 0x66bb6a, roughness: 0.6 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x81d4fa, metalness: 0.8, roughness: 0.2 });

    const building = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.8, 1.6), wallMat);
    building.position.set(0, 0.9, 0);
    group.add(building);

    // Green rooftop garden
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.3, 1.7), greenRoofMat);
    roof.position.set(0, 1.9, 0);
    group.add(roof);

    // Tiny roof trees / bioswale shrubs
    for (let t = 0; t < 3; t++) {
      const shrub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), greenRoofMat);
      shrub.position.set(-0.6 + t * 0.6, 2.15, 0);
      group.add(shrub);
    }

    // Windows
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), windowMat);
    win.position.set(0, 1.0, 0.81);
    group.add(win);
  }

  // 6. Conscious Consumption Bazaar (Market Stall with Burlap Sacks & Jars)
  private buildBazaarModel(group: THREE.Group) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xbcaaa4, roughness: 0.8 });
    const awningMat = new THREE.MeshStandardMaterial({ color: 0xffb74d, roughness: 0.5 });

    // Table / stall counter
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1.0), woodMat);
    table.position.set(0, 0.4, 0);
    group.add(table);

    // Awning roof
    const awning = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 1.3), awningMat);
    awning.position.set(0, 1.6, 0);
    awning.rotation.x = 0.15;
    group.add(awning);

    // Burlap grains sacks
    const sackMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.9 });
    for (let s = -0.5; s <= 0.5; s += 0.5) {
      const sack = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), sackMat);
      sack.scale.set(1, 1.3, 1);
      sack.position.set(s, 0.95, 0);
      group.add(sack);
    }
  }

  // 7. Renewable Energy Park (Stylized Wind Turbines & Solar Panel Arrays)
  private buildRenewableEnergyModel(group: THREE.Group) {
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x1a237e, metalness: 0.9, roughness: 0.15 });

    // Wind Turbine 1
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 3.2, 12), towerMat);
    tower.position.set(-0.7, 1.6, 0);
    tower.castShadow = !this.isSoftwareGl;
    group.add(tower);

    // Turbine Rotor & 3 Aerofoil Blades
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(-0.7, 3.2, 0.2);

    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), towerMat);
    rotorGroup.add(hub);

    for (let b = 0; b < 3; b++) {
      const angle = (b * Math.PI * 2) / 3;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.04), bladeMat);
      blade.position.set(Math.sin(angle) * 0.65, Math.cos(angle) * 0.65, 0);
      blade.rotation.z = -angle;
      rotorGroup.add(blade);
    }
    group.add(rotorGroup);
    this.windTurbineBlades.push(rotorGroup);

    // Angled Solar Photovoltaic Panel
    const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.0), solarMat);
    solarPanel.rotation.x = -0.5;
    solarPanel.position.set(0.9, 0.6, 0.2);
    solarPanel.castShadow = !this.isSoftwareGl;
    group.add(solarPanel);

    // Panel kickstand
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), towerMat);
    stand.position.set(0.9, 0.3, 0.2);
    group.add(stand);
  }

  private setupEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    window.addEventListener('resize', this.onWindowResize);
    this.container.addEventListener('pointerdown', this.onPointerDown);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keysPressed.add(e.code);

    if (e.code === 'KeyE' || e.code === 'Space') {
      // Find nearest station within interaction distance
      const nearest = this.getNearestStation(2.8);
      if (nearest) {
        this.callbacks.onStationClick(nearest.task);
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed.delete(e.code);
  };

  private onWindowBlur = () => {
    this.keysPressed.clear();
  };

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const aspect = w / h;
    const viewSize = 22;

    this.camera.left = (-viewSize * aspect) / 2;
    this.camera.right = (viewSize * aspect) / 2;
    this.camera.top = viewSize / 2;
    this.camera.bottom = -viewSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
  };

  private onPointerDown = (e: MouseEvent) => {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check if clicked directly on an interactive station
    for (const st of this.stations) {
      const stationDist = this.raycaster.ray.distanceToPoint(st.group.position);
      if (stationDist < 2.5) {
        sounds.playClick();
        // Move towards station and trigger
        this.playerTargetPos.copy(st.group.position);
        this.callbacks.onStationClick(st.task);
        return;
      }
    }

    // Otherwise click to move
    const intersectPoint = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint)) {
      // Clamp to island radius
      if (intersectPoint.length() < 14.5) {
        this.playerTargetPos.copy(intersectPoint);
        this.playerTargetPos.y = 0;
      }
    }
  };

  public getNearestStation(threshold = 2.8) {
    let closest: { task: TaskDefinition; dist: number } | null = null;
    const pPos = this.playerGroup.position;

    for (const st of this.stations) {
      const dx = st.group.position.x - pPos.x;
      const dz = st.group.position.z - pPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < threshold) {
        if (!closest || dist < closest.dist) {
          closest = { task: st.task, dist };
        }
      }
    }
    return closest;
  }

  /**
   * Spawns celebration reward particles (eco sparkles & leaves)
   */
  public spawnBurstParticles(pos: THREE.Vector3, count = 16, color = 0x2ecc71) {
    const geo = new THREE.DodecahedronGeometry(0.12, 0);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);
      p.position.y += 1.2;

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        2.5 + Math.random() * 2.5,
        Math.sin(angle) * speed
      );

      this.particleGroup.add(p);
      this.particles.push({
        mesh: p,
        vel,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4,
      });
    }
  }

  /**
   * Visual transformation when a task is completed
   */
  public triggerTaskVisualUpdate(task: TaskDefinition, resources: PlayerResources) {
    // Spawn sparkle particles
    const station = this.stations.find((s) => s.task.id === task.id);
    if (station) {
      this.spawnBurstParticles(station.group.position, 24, 0xffd166);
    }

    // Clean up plastics if marine health task
    if (task.topic === 'marine_health') {
      this.oceanPlastics.forEach((p, idx) => {
        if (idx < 3) p.visible = false;
      });
    }
  }

  public navigateToStation(task: TaskDefinition) {
    this.playerTargetPos.set(task.location.x, 0, task.location.z);
  }

  private tick(timestamp: number) {
    const rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    const dt = Math.min(rawDt, 0.05);

    // 1. Player Movement & Input Update
    this.updatePlayer(dt);

    // 2. Animate stations and wind turbines
    this.updateWorldAnimations(timestamp, dt);

    // 3. Update active particles
    this.updateParticles(dt);

    // 4. Smooth Camera Follow
    const targetCamX = this.playerGroup.position.x + 16;
    const targetCamZ = this.playerGroup.position.z + 16;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 3.5, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 3.5, dt);

    // 5. Check station proximity
    const nearest = this.getNearestStation(2.6);
    this.callbacks.onStationProximity(nearest ? nearest.task : null);

    // Render
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(() => {
        this.frameId = requestAnimationFrame(this.tick);
      });
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || !gl.fenceSync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updatePlayer(dt: number) {
    const moveInput = new THREE.Vector3(0, 0, 0);

    // Isometric 45-degree projected movement mapping
    if (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp')) {
      moveInput.x -= 1;
      moveInput.z -= 1;
    }
    if (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown')) {
      moveInput.x += 1;
      moveInput.z += 1;
    }
    if (this.keysPressed.has('KeyA') || this.keysPressed.has('ArrowLeft')) {
      moveInput.x -= 1;
      moveInput.z += 1;
    }
    if (this.keysPressed.has('KeyD') || this.keysPressed.has('ArrowRight')) {
      moveInput.x += 1;
      moveInput.z -= 1;
    }

    const speed = 6.2;

    if (moveInput.lengthSq() > 0) {
      moveInput.normalize();
      this.playerGroup.position.x += moveInput.x * speed * dt;
      this.playerGroup.position.z += moveInput.z * speed * dt;
      this.playerTargetPos.copy(this.playerGroup.position);
      this.playerFacing.copy(moveInput);
      this.isWalking = true;
    } else {
      // Move towards target position from mouse click
      const diff = new THREE.Vector3().subVectors(this.playerTargetPos, this.playerGroup.position);
      diff.y = 0;
      if (diff.length() > 0.15) {
        diff.normalize();
        this.playerGroup.position.x += diff.x * speed * dt;
        this.playerGroup.position.z += diff.z * speed * dt;
        this.playerFacing.copy(diff);
        this.isWalking = true;
      } else {
        this.isWalking = false;
      }
    }

    // Clamp player to island perimeter
    const distFromCenter = Math.sqrt(
      this.playerGroup.position.x * this.playerGroup.position.x +
        this.playerGroup.position.z * this.playerGroup.position.z
    );
    if (distFromCenter > 13.5) {
      const angle = Math.atan2(this.playerGroup.position.z, this.playerGroup.position.x);
      this.playerGroup.position.x = Math.cos(angle) * 13.5;
      this.playerGroup.position.z = Math.sin(angle) * 13.5;
    }

    // Rotate player towards facing direction
    if (this.playerFacing.lengthSq() > 0) {
      const targetAngle = Math.atan2(this.playerFacing.x, this.playerFacing.z);
      this.playerGroup.rotation.y = THREE.MathUtils.damp(this.playerGroup.rotation.y, targetAngle, 12, dt);
    }

    // Waddling walk animation & sound
    if (this.isWalking) {
      this.walkDistance += dt * 14;
      const bob = Math.sin(this.walkDistance);
      this.playerGroup.position.y = Math.abs(bob) * 0.14;

      // Wing flapping & foot stepping
      this.leftWingMesh.rotation.z = Math.sin(this.walkDistance) * 0.35;
      this.rightWingMesh.rotation.z = -Math.sin(this.walkDistance) * 0.35;

      this.leftFootMesh.position.z = Math.sin(this.walkDistance) * 0.18;
      this.rightFootMesh.position.z = -Math.sin(this.walkDistance) * 0.18;

      if (Math.abs(bob) > 0.95 && Math.random() < 0.1) {
        sounds.playWaddle();
      }
    } else {
      // Idle breathing
      const idleBob = Math.sin(performance.now() * 0.003) * 0.04;
      this.playerGroup.position.y = idleBob;
      this.leftWingMesh.rotation.z = 0;
      this.rightWingMesh.rotation.z = 0;
      this.leftFootMesh.position.z = 0.05;
      this.rightFootMesh.position.z = 0.05;
    }

    this.callbacks.onPlayerPositionUpdate({
      x: this.playerGroup.position.x,
      z: this.playerGroup.position.z,
    });
  }

  private updateWorldAnimations(timestamp: number, dt: number) {
    const t = timestamp * 0.001;

    // Rotate Wind Turbines
    this.windTurbineBlades.forEach((rotor) => {
      rotor.rotation.z += dt * 2.8;
    });

    // Floating bobbing station badges
    this.stations.forEach((st, i) => {
      const bobOffset = Math.sin(t * 2.2 + i * 0.8) * 0.18;
      st.marker.position.y = st.floatingY + bobOffset;
      st.marker.rotation.y += dt * 0.8;
    });

    // Floating ocean plastic bobbing
    this.oceanPlastics.forEach((bottle, i) => {
      bottle.position.y = -1.4 + Math.sin(t * 1.8 + i) * 0.06;
      bottle.rotation.x = Math.sin(t + i) * 0.1;
    });

    // Gentle water shimmer
    if (this.waterMesh) {
      (this.waterMesh.material as THREE.MeshStandardMaterial).opacity = 0.8 + Math.sin(t * 1.2) * 0.04;
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particleGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      p.vel.y -= 7.5 * dt; // gravity

      const progress = 1 - p.life / p.maxLife;
      p.mesh.scale.setScalar(progress);
    }
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('resize', this.onWindowResize);
    this.container.removeEventListener('pointerdown', this.onPointerDown);

    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
  }
}
