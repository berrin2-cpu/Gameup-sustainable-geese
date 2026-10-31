/**
 * 2.5D Orthographic Cozy Simulation Game Engine for Sustainable Geese (ClimateKaz)
 * Built with Three.js r160, ACES Filmic Tone Mapping, procedural models,
 * 5x Expanded Island with Paved City Roads Network, Crosswalks, Bioswales,
 * and Interactive Elder Goose NPC (Professor Barnaby).
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TASKS_CATALOG, TaskDefinition, PlayerResources, NPC_GOOSE_POSITION, SoilPlot, INITIAL_SOIL_PLOTS } from './rules.ts';
import { sounds } from '../audio/soundEffects.ts';

export interface SceneCallbacks {
  onStationProximity: (task: TaskDefinition | null) => void;
  onStationClick: (task: TaskDefinition) => void;
  onPlayerPositionUpdate: (pos: { x: number; z: number }) => void;
  onNPCProximity: (isNear: boolean) => void;
  onNPCClick: () => void;
  onSoilPlotProximity: (plot: SoilPlot | null) => void;
  onSoilPlotClick: (plot: SoilPlot) => void;
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

  // Visual Directioning Click Indicator Ring
  private clickTargetRing!: THREE.Mesh;

  // Elder Goose NPC: Professor Barnaby
  private npcGroup!: THREE.Group;
  private npcMarker!: THREE.Group;
  private isNearNPC: boolean = false;

  // Soil Plots & Permaculture Beds
  private soilPlots: SoilPlot[] = [];
  private soilPlotMeshes: { plot: SoilPlot; group: THREE.Group; plantGroup: THREE.Group; marker: THREE.Group }[] = [];
  private nearbySoilPlot: SoilPlot | null = null;

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
    this.scene.fog = new THREE.Fog(0xa2e2f2, 60, 140);

    // Camera: 2.5D Orthographic Isometric Camera (Enlarged view for 5x map)
    const aspect = width / height;
    const viewSize = 30;
    this.camera = new THREE.OrthographicCamera(
      (-viewSize * aspect) / 2,
      (viewSize * aspect) / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      250
    );
    this.camera.position.set(22, 24, 22);
    this.camera.lookAt(0, 0, 0);

    // Environment map
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch (_) {}

    // Lighting
    this.setupLighting();

    // World & 5x Enlarged Island with City Roads Network
    this.buildIsland();

    // Characters
    this.buildKazTheDuck();
    this.buildProfessorGoose();

    // Stations
    this.buildAllStations();

    // Permaculture Soil Beds for Goose Planting
    this.buildSoilGardenBeds(INITIAL_SOIL_PLOTS);

    // Click-to-Move Target Directioning Ring (Visual feedback)
    const ringGeo = new THREE.RingGeometry(0.38, 0.65, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    this.clickTargetRing = new THREE.Mesh(ringGeo, ringMat);
    this.clickTargetRing.rotation.x = -Math.PI / 2;
    this.clickTargetRing.position.y = 0.045;
    this.clickTargetRing.visible = false;
    this.scene.add(this.clickTargetRing);

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
    // Warm Golden Key Sun with wide coverage for 5x island
    const sunLight = new THREE.DirectionalLight(0xfff8e7, 1.4);
    sunLight.position.set(30, 48, 25);
    if (!this.isSoftwareGl) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 120;
      const d = 50;
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
    rimLight.position.set(-25, 25, -25);
    this.scene.add(rimLight);
  }

  /**
   * Builds the 5x Enlarged Island Platform, Paved City Roads Network,
   * Bike Lanes, Roundabout Plaza, Bioswales, and Street Lamps.
   */
  private buildIsland() {
    // 1. Lush Main Island Platform (Radius ~72, layered rounded green hill)
    const islandGeo = new THREE.CylinderGeometry(72, 76, 4.0, 64);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x48a838, // Rich meadow green
      roughness: 0.7,
      metalness: 0.05,
    });
    const islandMesh = new THREE.Mesh(islandGeo, islandMat);
    islandMesh.position.y = -2.0;
    islandMesh.receiveShadow = true;
    this.scene.add(islandMesh);

    // Earthy soil edge under grass
    const soilRimGeo = new THREE.CylinderGeometry(76, 80, 1.6, 64);
    const soilRimMat = new THREE.MeshStandardMaterial({
      color: 0x8d5b32, // Warm loam soil
      roughness: 0.9,
    });
    const soilRim = new THREE.Mesh(soilRimGeo, soilRimMat);
    soilRim.position.y = -3.8;
    soilRim.receiveShadow = true;
    this.scene.add(soilRim);

    // Sandy shoreline shelf
    const shoreGeo = new THREE.CylinderGeometry(80, 86, 1.2, 64);
    const shoreMat = new THREE.MeshStandardMaterial({
      color: 0xf1c453, // Warm golden beach sand
      roughness: 0.85,
    });
    const shoreMesh = new THREE.Mesh(shoreGeo, shoreMat);
    shoreMesh.position.y = -4.6;
    shoreMesh.receiveShadow = true;
    this.scene.add(shoreMesh);

    // 2. Sparkling Shimmering Water Lagoon (Enlarged 250 x 250)
    const waterGeo = new THREE.PlaneGeometry(250, 250, 32, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1b9aaa, // Deep tropical teal
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = -3.2;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    // 3. City Roads Network (Paved Avenues, Roundabout Plaza, Bike Lanes, Crosswalks)
    this.buildCityRoadsNetwork();

    // 4. Perimeter Flora & Cozy Park Trees
    this.buildPerimeterFlora();
  }

  /**
   * Paved City Road System connecting all 7 SDG Districts
   */
  private buildCityRoadsNetwork() {
    const roadsGroup = new THREE.Group();

    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x374151, // Charcoal smooth pavement
      roughness: 0.85,
    });
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Clean light stone curb & sidewalk
      roughness: 0.8,
    });
    const yellowStripeMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // High-vis yellow center lines
      roughness: 0.5,
    });
    const whiteStripeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Zebra crosswalk white stripes
      roughness: 0.4,
    });
    const bikeLaneMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Eco green painted bike lane
      roughness: 0.75,
    });
    const plazaCobbleMat = new THREE.MeshStandardMaterial({
      color: 0xd6c4b2, // Warm terracotta cobblestone plaza
      roughness: 0.85,
    });

    // A. Central Roundabout Plaza (Terracotta ring + Center Garden)
    const plazaOuter = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.08, 36), plazaCobbleMat);
    plazaOuter.position.set(0, 0.04, 0);
    plazaOuter.receiveShadow = true;
    roadsGroup.add(plazaOuter);

    const plazaCenterGarden = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 0.16, 24), new THREE.MeshStandardMaterial({ color: 0x388e3c }));
    plazaCenterGarden.position.set(0, 0.12, 0);
    plazaCenterGarden.receiveShadow = true;
    roadsGroup.add(plazaCenterGarden);

    // Centerpiece Plaza Garden Fountain / Floral Mosaic
    const fountainRim = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.35, 12, 24), new THREE.MeshStandardMaterial({ color: 0xf1f5f9 }));
    fountainRim.rotation.x = Math.PI / 2;
    fountainRim.position.set(0, 0.35, 0);
    roadsGroup.add(fountainRim);

    const fountainWater = new THREE.Mesh(new THREE.CircleGeometry(3.0, 24), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 }));
    fountainWater.rotation.x = -Math.PI / 2;
    fountainWater.position.set(0, 0.32, 0);
    roadsGroup.add(fountainWater);

    // B. Grand North-South Avenue (Z: -65 to 65, Width: 7.2)
    const avenueNSGeo = new THREE.PlaneGeometry(7.2, 130);
    const avenueNS = new THREE.Mesh(avenueNSGeo, asphaltMat);
    avenueNS.rotation.x = -Math.PI / 2;
    avenueNS.position.set(0, 0.03, 0);
    avenueNS.receiveShadow = true;
    roadsGroup.add(avenueNS);

    // North-South Sidewalks
    [-4.1, 4.1].forEach((xOffset) => {
      const walk = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 130), sidewalkMat);
      walk.rotation.x = -Math.PI / 2;
      walk.position.set(xOffset, 0.05, 0);
      roadsGroup.add(walk);
    });

    // North-South Bike Lane (West side)
    const bikeLaneNS = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 130), bikeLaneMat);
    bikeLaneNS.rotation.x = -Math.PI / 2;
    bikeLaneNS.position.set(-2.8, 0.035, 0);
    roadsGroup.add(bikeLaneNS);

    // North-South Dashed Center Line
    for (let z = -60; z <= 60; z += 4) {
      if (Math.abs(z) > 13) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 2.2), yellowStripeMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(0, 0.04, z);
        roadsGroup.add(dash);
      }
    }

    // C. East-West Grand Avenue (X: -65 to 65, Width: 6.8)
    const avenueEWGeo = new THREE.PlaneGeometry(130, 6.8);
    const avenueEW = new THREE.Mesh(avenueEWGeo, asphaltMat);
    avenueEW.rotation.x = -Math.PI / 2;
    avenueEW.position.set(0, 0.03, 0);
    avenueEW.receiveShadow = true;
    roadsGroup.add(avenueEW);

    // East-West Sidewalks
    [-3.8, 3.8].forEach((zOffset) => {
      const walk = new THREE.Mesh(new THREE.PlaneGeometry(130, 1.2), sidewalkMat);
      walk.rotation.x = -Math.PI / 2;
      walk.position.set(0, 0.05, zOffset);
      roadsGroup.add(walk);
    });

    // East-West Dashed Center Line
    for (let x = -60; x <= 60; x += 4) {
      if (Math.abs(x) > 13) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.24), yellowStripeMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.04, 0);
        roadsGroup.add(dash);
      }
    }

    // D. Diagonal Avenue Branches to Specific SDG Districts (Off-Road Access)
    // Branch 1: Southwest to Zero Waste Hub (-30, 20)
    this.buildDiagonalRoad(roadsGroup, { x: -10, z: 8 }, { x: -30, z: 20 }, 4.4, asphaltMat);
    // Branch 2: Northeast to Climate Academy (25, 30)
    this.buildDiagonalRoad(roadsGroup, { x: 8, z: 10 }, { x: 25, z: 30 }, 4.4, asphaltMat);
    // Branch 3: Southeast to Farmstead & Permaculture Garden (35, -20)
    this.buildDiagonalRoad(roadsGroup, { x: 10, z: -8 }, { x: 35, z: -20 }, 4.4, asphaltMat);
    // Branch 4: Northwest to Lagoon Pier (-35, -30)
    this.buildDiagonalRoad(roadsGroup, { x: -10, z: -8 }, { x: -35, z: -30 }, 4.4, asphaltMat);
    // Branch 5: North-West to Civic Eco-District (-28, 38) (relocated off the NS road)
    this.buildDiagonalRoad(roadsGroup, { x: -8, z: 14 }, { x: -28, z: 38 }, 4.4, asphaltMat);
    // Branch 6: South-East to Breeze Wind & Solar Overlook (34, -36) (relocated off the EW road)
    this.buildDiagonalRoad(roadsGroup, { x: 14, z: -12 }, { x: 34, z: -36 }, 4.4, asphaltMat);

    // E. Pedestrian Zebra Crosswalks at Roundabout entrances
    const crosswalkZ = [-15, 15];
    crosswalkZ.forEach((cz) => {
      for (let bar = -3; bar <= 3; bar += 0.8) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 1.6), whiteStripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(bar, 0.045, cz);
        roadsGroup.add(stripe);
      }
    });

    const crosswalkX = [-15, 15];
    crosswalkX.forEach((cx) => {
      for (let bar = -2.8; bar <= 2.8; bar += 0.8) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.45), whiteStripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(cx, 0.045, bar);
        roadsGroup.add(stripe);
      }
    });

    // F. Roadside Bioswales (SDG 11: Stormwater vegetated filtration strips)
    const swalePositions = [
      { x: -5.4, z: -35 },
      { x: -5.4, z: 35 },
      { x: 5.4, z: -35 },
      { x: 5.4, z: 35 },
      { x: -35, z: 5.2 },
      { x: 35, z: 5.2 },
    ];
    const swaleMat = new THREE.MeshStandardMaterial({ color: 0x33691e, roughness: 0.9 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xffb703 });

    swalePositions.forEach((sp) => {
      const swale = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 16), swaleMat);
      swale.position.set(sp.x, 0.03, sp.z);
      roadsGroup.add(swale);

      // Bioswale plants
      for (let f = -7; f <= 7; f += 2.2) {
        const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), flowerMat);
        plant.position.set(sp.x + (Math.random() - 0.5) * 0.4, 0.22, sp.z + f);
        roadsGroup.add(plant);
      }
    });

    // G. Solar-Powered LED Eco Street Lamps along avenues
    const lampPositions = [
      { x: -4.8, z: -45 },
      { x: -4.8, z: -25 },
      { x: -4.8, z: 25 },
      { x: -4.8, z: 45 },
      { x: 4.8, z: -45 },
      { x: 4.8, z: -25 },
      { x: 4.8, z: 25 },
      { x: 4.8, z: 45 },
      { x: -45, z: 4.5 },
      { x: -25, z: 4.5 },
      { x: 25, z: 4.5 },
      { x: 45, z: 4.5 },
    ];

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const lampHeadMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });

    lampPositions.forEach((lp) => {
      const lamp = new THREE.Group();
      lamp.position.set(lp.x, 0, lp.z);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 8), poleMat);
      post.position.y = 1.6;
      lamp.add(post);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), poleMat);
      arm.position.set(lp.x > 0 ? -0.25 : 0.25, 3.2, 0);
      lamp.add(arm);

      // Solar cap on top
      const solarCap = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
      solarCap.position.set(0, 3.3, 0);
      lamp.add(solarCap);

      // Glowing LED fixture
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), lampHeadMat);
      bulb.position.set(lp.x > 0 ? -0.45 : 0.45, 3.1, 0);
      lamp.add(bulb);

      roadsGroup.add(lamp);
    });

    this.scene.add(roadsGroup);
  }

  /**
   * Helper to construct angled connector road between two points
   */
  private buildDiagonalRoad(
    parent: THREE.Group,
    p1: { x: number; z: number },
    p2: { x: number; z: number },
    width: number,
    material: THREE.Material
  ) {
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const roadGeo = new THREE.PlaneGeometry(width, length);
    const road = new THREE.Mesh(roadGeo, material);
    road.rotation.x = -Math.PI / 2;
    road.rotation.z = -angle;
    road.position.set((p1.x + p2.x) / 2, 0.035, (p1.z + p2.z) / 2);
    parent.add(road);
  }

  /**
   * Builds the Elder Goose NPC: Professor Barnaby!
   * Stationed in the central plaza garden terrace at { x: 7, z: -7 } (off the road)
   */
  private buildProfessorGoose() {
    this.npcGroup = new THREE.Group();
    this.npcGroup.position.set(NPC_GOOSE_POSITION.x, 0, NPC_GOOSE_POSITION.z);

    // Terracotta terrace platform
    const terraceBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.4, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0xc89d7c, roughness: 0.8 })
    );
    terraceBase.position.y = 0.05;
    this.npcGroup.add(terraceBase);

    // Cute wooden scholar bench behind Professor
    const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.5), benchWoodMat);
    benchSeat.position.set(0, 0.45, -0.6);
    const benchBack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.06), benchWoodMat);
    benchBack.position.set(0, 0.72, -0.82);
    this.npcGroup.add(benchSeat, benchBack);

    const gooseWhite = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Pure clean goose white
      roughness: 0.65,
    });
    const gooseGrey = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Distinguished grey wing tips
      roughness: 0.7,
    });
    const beakOrange = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Vibrant orange bill
      roughness: 0.5,
    });
    const eyeBlack = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
    const glassesGold = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const bowtieBlue = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.4,
    });
    const satchelBrown = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.8,
    });

    // 1. Plump Body (Slightly taller & scholarly than Kaz)
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 12), gooseWhite);
    body.scale.set(1.0, 1.25, 1.35);
    body.position.y = 0.8;
    body.castShadow = !this.isSoftwareGl;
    this.npcGroup.add(body);

    // 2. Elegant Goose Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.9, 12), gooseWhite);
    neck.position.set(0, 1.5, 0.25);
    neck.rotation.x = -0.15;
    this.npcGroup.add(neck);

    // 3. Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), gooseWhite);
    head.position.set(0, 2.05, 0.35);
    head.castShadow = !this.isSoftwareGl;
    this.npcGroup.add(head);

    // 4. Large Goose Bill
    const bill = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.36), beakOrange);
    bill.position.set(0, 1.98, 0.72);
    this.npcGroup.add(bill);

    // 5. Wire-Rimmed Scholarly Spectacles!
    const leftRim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16), glassesGold);
    leftRim.position.set(-0.16, 2.12, 0.68);
    const rightRim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16), glassesGold);
    rightRim.position.set(0.16, 2.12, 0.68);
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6), glassesGold);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, 2.12, 0.69);
    this.npcGroup.add(leftRim, rightRim, bridge);

    // Eyes behind spectacles
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeBlack);
    eyeL.position.set(-0.16, 2.12, 0.64);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeBlack);
    eyeR.position.set(0.16, 2.12, 0.64);
    this.npcGroup.add(eyeL, eyeR);

    // 6. Dapper Blue Academic Bow Tie
    const bowCenter = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), bowtieBlue);
    bowCenter.position.set(0, 1.65, 0.52);
    const bowLeft = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 6), bowtieBlue);
    bowLeft.rotation.z = Math.PI / 2;
    bowLeft.position.set(-0.16, 1.65, 0.52);
    const bowRight = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 6), bowtieBlue);
    bowRight.rotation.z = -Math.PI / 2;
    bowRight.position.set(0.16, 1.65, 0.52);
    this.npcGroup.add(bowCenter, bowLeft, bowRight);

    // 7. Wings with Scholarly Grey Feather Tips
    const wingL = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.8, 8), gooseGrey);
    wingL.rotateZ(Math.PI / 2);
    wingL.position.set(-0.66, 0.88, 0);
    const wingR = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.8, 8), gooseGrey);
    wingR.rotateZ(-Math.PI / 2);
    wingR.position.set(0.66, 0.88, 0);
    this.npcGroup.add(wingL, wingR);

    // 8. Leather Scholar Satchel / Field Guide
    const satchel = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.44), satchelBrown);
    satchel.position.set(0.68, 0.72, 0.1);
    satchel.rotation.z = 0.2;
    this.npcGroup.add(satchel);

    // 9. Webbed Feet
    const footGeo = new THREE.BoxGeometry(0.24, 0.08, 0.4);
    const footL = new THREE.Mesh(footGeo, beakOrange);
    footL.position.set(-0.25, 0.06, 0.08);
    const footR = new THREE.Mesh(footGeo, beakOrange);
    footR.position.set(0.25, 0.06, 0.08);
    this.npcGroup.add(footL, footR);

    // 10. Overhead Floating Dialogue Indicator Badge: 💬 [E] Talk
    this.npcMarker = this.createNPCMarker();
    this.npcMarker.position.set(0, 3.2, 0);
    this.npcGroup.add(this.npcMarker);

    // Shadow
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.3 });
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.65, 16), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;
    this.npcGroup.add(shadow);

    this.npcGroup.scale.setScalar(1.25);
    this.scene.add(this.npcGroup);
  }

  private createNPCMarker(): THREE.Group {
    const marker = new THREE.Group();

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    // Yellow badge circle
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(80, 80, 74, 0, Math.PI * 2);
    ctx.fill();

    // White outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Goose emoji
    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💬', 80, 72);

    // Subtitle text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('[E] Talk', 80, 126);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const badgeMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const front = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), badgeMat);
    front.position.z = 0.05;

    const back = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), badgeMat);
    back.position.z = -0.05;
    back.rotation.y = Math.PI;

    marker.add(front, back);
    return marker;
  }

  private buildPerimeterFlora() {
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.85 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.65 });

    const treePositions = [
      { x: -50, z: 12, s: 1.4 },
      { x: -45, z: 38, s: 1.2 },
      { x: -16, z: 54, s: 1.5 },
      { x: 22, z: 52, s: 1.3 },
      { x: 52, z: 32, s: 1.45 },
      { x: 56, z: -8, s: 1.2 },
      { x: 48, z: -42, s: 1.35 },
      { x: 12, z: -55, s: 1.5 },
      { x: -14, z: -52, s: 1.25 },
      { x: -48, z: -25, s: 1.4 },
    ];

    treePositions.forEach((tp) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * tp.s, 0.55 * tp.s, 2.2 * tp.s, 8), treeTrunkMat);
      trunk.position.y = 1.1 * tp.s;
      trunk.castShadow = !this.isSoftwareGl;
      tree.add(trunk);

      // Fluffy rounded canopy
      for (let c = 0; c < 3; c++) {
        const ball = new THREE.Mesh(new THREE.DodecahedronGeometry((1.2 - c * 0.25) * tp.s, 1), foliageMat);
        ball.position.set((c === 1 ? 0.3 : c === 2 ? -0.3 : 0) * tp.s, (2.2 + c * 0.8) * tp.s, 0);
        ball.castShadow = !this.isSoftwareGl;
        tree.add(ball);
      }

      tree.position.set(tp.x, 0, tp.z);
      this.scene.add(tree);
    });
  }

  /**
   * Hero character: Kaz the Duck
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

    // 1. Plump Body
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

    // 5. Flapping Wings
    const wingGeo = new THREE.ConeGeometry(0.24, 0.65, 8);
    wingGeo.rotateZ(Math.PI / 2);
    this.leftWingMesh = new THREE.Mesh(wingGeo, duckYellow);
    this.leftWingMesh.position.set(-0.55, 0.72, 0);
    this.leftWingMesh.rotation.y = 0.2;
    this.rightWingMesh = new THREE.Mesh(wingGeo, duckYellow);
    this.rightWingMesh.position.set(0.55, 0.72, 0);
    this.rightWingMesh.rotation.y = -0.2;
    this.playerGroup.add(this.leftWingMesh, this.rightWingMesh);

    // 6. Feet
    const footGeo = new THREE.BoxGeometry(0.22, 0.06, 0.34);
    this.leftFootMesh = new THREE.Mesh(footGeo, beakOrange);
    this.leftFootMesh.position.set(-0.22, 0.05, 0.05);
    this.rightFootMesh = new THREE.Mesh(footGeo, beakOrange);
    this.rightFootMesh.position.set(0.22, 0.05, 0.05);
    this.playerGroup.add(this.leftFootMesh, this.rightFootMesh);

    // 7. Gardener Sprout Hat
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.2, 6), leafGreen);
    stem.position.set(0, 1.55, 0.2);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), leafGreen);
    leaf.scale.set(1.5, 0.3, 0.8);
    leaf.position.set(0.08, 1.62, 0.2);
    leaf.rotation.z = 0.4;
    this.playerGroup.add(stem, leaf);

    // Shadow
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
   * Builds the 7 SDG Interactive Stations at their 5x Coordinates
   */
  private buildAllStations() {
    TASKS_CATALOG.forEach((task) => {
      const stationGroup = new THREE.Group();
      stationGroup.position.set(task.location.x, 0, task.location.z);

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
      marker.position.set(0, 3.4, 0);
      stationGroup.add(marker);

      // Base footprint ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        wireframe: true,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.2, 24), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      stationGroup.add(ring);

      this.scene.add(stationGroup);
      this.stations.push({
        task,
        group: stationGroup,
        marker,
        floatingY: 3.4,
      });
    });
  }

  private createBadgeTexture(emoji: string, bgColor: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.stroke();
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

    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
    });
    const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.14, 24), badgeMat);
    badge.rotation.x = Math.PI / 2;
    marker.add(badge);

    const iconTex = this.createBadgeTexture(cfg.emoji, cfg.bg);
    const frontMat = new THREE.MeshBasicMaterial({ map: iconTex, transparent: true });
    const front = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), frontMat);
    front.position.z = 0.08;
    marker.add(front);

    const back = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), frontMat);
    back.position.z = -0.08;
    back.rotation.y = Math.PI;
    marker.add(back);

    return marker;
  }

  // 1. Zero Waste Station
  private buildZeroWasteModel(group: THREE.Group) {
    const binColors = [0x4caf50, 0x2196f3, 0xffc107];
    binColors.forEach((col, i) => {
      const binGeo = new THREE.CylinderGeometry(0.45, 0.38, 1.1, 12);
      const binMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 });
      const bin = new THREE.Mesh(binGeo, binMat);
      bin.position.set((i - 1) * 1.1, 0.55, 0);
      bin.castShadow = !this.isSoftwareGl;
      group.add(bin);

      const lidGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.12, 12);
      const lidMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 });
      const lid = new THREE.Mesh(lidGeo, lidMat);
      lid.position.set((i - 1) * 1.1, 1.15, 0);
      group.add(lid);
    });

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.1), woodMat);
    crate.position.set(0, 0.35, 1.3);
    group.add(crate);
  }

  // 2. Climate Education Academy
  private buildEducationModel(group: THREE.Group) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xa1887f, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });

    for (let x = -1; x <= 1; x += 2) {
      for (let z = -1; z <= 1; z += 2) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8), woodMat);
        pillar.position.set(x * 1.2, 1.1, z * 1.2);
        group.add(pillar);
      }
    }

    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.2, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 2.7, 0);
    group.add(roof);

    const boardMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.9 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.1), boardMat);
    board.position.set(0, 1.3, -1.1);
    group.add(board);
  }

  // 3. Sustainable Permaculture Farm
  private buildFarmModel(group: THREE.Group) {
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.95 });
    const soil = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.25, 2.6), soilMat);
    soil.position.set(0, 0.12, 0);
    group.add(soil);

    const cropMatA = new THREE.MeshStandardMaterial({ color: 0xff7043 });
    const cropMatB = new THREE.MeshStandardMaterial({ color: 0x81c784 });
    const farmCropsSubgroup = new THREE.Group();

    for (let rx = -1.0; rx <= 1.0; rx += 1.0) {
      for (let rz = -0.9; rz <= 0.9; rz += 0.6) {
        const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 8), cropMatA);
        carrot.rotation.x = Math.PI;
        carrot.position.set(rx, 0.45, rz);
        const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), cropMatB);
        foliage.position.set(rx, 0.55, rz);
        farmCropsSubgroup.add(carrot, foliage);
      }
    }
    group.add(farmCropsSubgroup);
    this.farmCrops.push(farmCropsSubgroup);
  }

  // 4. Ocean & Marine Health
  private buildMarineSanctuaryModel(group: THREE.Group) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.8 });
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.24, 3.2), woodMat);
    pier.position.set(0, -0.4, -0.8);
    group.add(pier);

    for (let px = -0.6; px <= 0.6; px += 1.2) {
      const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.6, 8), woodMat);
      piling.position.set(px, -1.0, -2.0);
      group.add(piling);
    }

    const plasticMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    for (let p = 0; p < 6; p++) {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.36, 8), plasticMat);
      bottle.rotation.z = Math.PI / 2 + Math.random() * 0.4;
      bottle.position.set((Math.random() - 0.5) * 2.8, -1.8, -2.5 - Math.random() * 2.0);
      group.add(bottle);
      this.oceanPlastics.push(bottle);
    }
  }

  // 5. Climate-Resilient City District
  private buildResilientCityModel(group: THREE.Group) {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xefebe9, roughness: 0.8 });
    const greenRoofMat = new THREE.MeshStandardMaterial({ color: 0x66bb6a, roughness: 0.6 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x81d4fa, metalness: 0.8, roughness: 0.2 });

    const building = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 2.0), wallMat);
    building.position.set(0, 1.1, 0);
    group.add(building);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 2.2), greenRoofMat);
    roof.position.set(0, 2.3, 0);
    group.add(roof);

    for (let t = 0; t < 3; t++) {
      const shrub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), greenRoofMat);
      shrub.position.set(-0.8 + t * 0.8, 2.65, 0);
      group.add(shrub);
    }

    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), windowMat);
    win.position.set(0, 1.2, 1.01);
    group.add(win);
  }

  // 6. Conscious Consumption Bazaar
  private buildBazaarModel(group: THREE.Group) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xbcaaa4, roughness: 0.8 });
    const awningMat = new THREE.MeshStandardMaterial({ color: 0xffb74d, roughness: 0.5 });

    const table = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.2), woodMat);
    table.position.set(0, 0.45, 0);
    group.add(table);

    const awning = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 1.5), awningMat);
    awning.position.set(0, 1.9, 0);
    awning.rotation.x = 0.15;
    group.add(awning);

    const sackMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.9 });
    for (let s = -0.6; s <= 0.6; s += 0.6) {
      const sack = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), sackMat);
      sack.scale.set(1, 1.3, 1);
      sack.position.set(s, 1.1, 0);
      group.add(sack);
    }
  }

  // 7. Renewable Energy Park
  private buildRenewableEnergyModel(group: THREE.Group) {
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x1a237e, metalness: 0.9, roughness: 0.15 });

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 4.2, 12), towerMat);
    tower.position.set(-1.0, 2.1, 0);
    tower.castShadow = !this.isSoftwareGl;
    group.add(tower);

    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(-1.0, 4.2, 0.25);

    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), towerMat);
    rotorGroup.add(hub);

    for (let b = 0; b < 3; b++) {
      const angle = (b * Math.PI * 2) / 3;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.6, 0.05), bladeMat);
      blade.position.set(Math.sin(angle) * 0.9, Math.cos(angle) * 0.9, 0);
      blade.rotation.z = -angle;
      rotorGroup.add(blade);
    }
    group.add(rotorGroup);
    this.windTurbineBlades.push(rotorGroup);

    // Solar panels
    for (let sp = 0; sp < 2; sp++) {
      const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.2), solarMat);
      solarPanel.rotation.x = -0.5;
      solarPanel.position.set(0.8 + sp * 1.8, 0.8, 0.2);
      solarPanel.castShadow = !this.isSoftwareGl;
      group.add(solarPanel);

      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6), towerMat);
      stand.position.set(0.8 + sp * 1.8, 0.4, 0.2);
      group.add(stand);
    }
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
      // Priority 1: Elder Goose NPC proximity
      if (this.isNearNPC) {
        sounds.playClick();
        this.callbacks.onNPCClick();
        return;
      }

      // Priority 2: Permaculture Soil Bed proximity (Planting / Harvesting)
      const nearPlot = this.getNearestSoilPlot(3.5);
      if (nearPlot) {
        sounds.playClick();
        this.callbacks.onSoilPlotClick(nearPlot);
        return;
      }

      // Priority 3: Interactive Station proximity
      const nearest = this.getNearestStation(5.2);
      if (nearest) {
        this.callbacks.onStationClick(nearest.task);
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed.delete(e.code);
    if (this.keysPressed.size === 0) {
      // Instantly stop walking and lock current position to prevent drifting
      this.playerTargetPos.copy(this.playerGroup.position);
      this.isWalking = false;
      this.hideClickTarget();
    }
  };

  private onWindowBlur = () => {
    this.keysPressed.clear();
    this.playerTargetPos.copy(this.playerGroup.position);
    this.isWalking = false;
    this.hideClickTarget();
  };

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const aspect = w / h;
    const viewSize = 30;

    this.camera.left = (-viewSize * aspect) / 2;
    this.camera.right = (viewSize * aspect) / 2;
    this.camera.top = viewSize / 2;
    this.camera.bottom = -viewSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
  };

  private onPointerDown = (e: MouseEvent) => {
    // Only primary left button
    if (e.button !== 0) return;

    // Ignore clicks that originated on UI overlays (HUD, Drawer menu, dialogs)
    const target = e.target as HTMLElement | null;
    if (target && target !== this.renderer.domElement) return;

    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check if clicked directly on a Permaculture Soil Bed
    for (const sp of this.soilPlotMeshes) {
      const dist = this.raycaster.ray.distanceToPoint(sp.group.position);
      if (dist < 2.6) {
        sounds.playClick();
        this.playerTargetPos.set(sp.plot.position.x, 0, sp.plot.position.z + 1.2);
        this.showClickTarget(this.playerTargetPos);
        this.callbacks.onSoilPlotClick(sp.plot);
        return;
      }
    }

    // 2. Check if clicked directly on Professor Barnaby
    if (this.npcGroup) {
      const npcDist = this.raycaster.ray.distanceToPoint(this.npcGroup.position);
      if (npcDist < 3.8) {
        sounds.playClick();
        this.playerTargetPos.set(NPC_GOOSE_POSITION.x, 0, NPC_GOOSE_POSITION.z + 2.5);
        this.showClickTarget(this.playerTargetPos);
        this.callbacks.onNPCClick();
        return;
      }
    }

    // 3. Check if clicked directly on an interactive station
    for (const st of this.stations) {
      const stationDist = this.raycaster.ray.distanceToPoint(st.group.position);
      if (stationDist < 4.5) {
        sounds.playClick();
        this.playerTargetPos.copy(st.group.position);
        this.showClickTarget(this.playerTargetPos);
        this.callbacks.onStationClick(st.task);
        return;
      }
    }

    // 4. Otherwise click to move (clamped to enlarged 5x island radius)
    const intersectPoint = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint)) {
      if (intersectPoint.length() < 66.0) {
        this.playerTargetPos.copy(intersectPoint);
        this.playerTargetPos.y = 0;
        this.showClickTarget(this.playerTargetPos);
      }
    }
  };

  public showClickTarget(pos: THREE.Vector3) {
    if (this.clickTargetRing) {
      this.clickTargetRing.position.set(pos.x, 0.045, pos.z);
      this.clickTargetRing.scale.setScalar(1.0);
      this.clickTargetRing.visible = true;
    }
  }

  public hideClickTarget() {
    if (this.clickTargetRing) {
      this.clickTargetRing.visible = false;
    }
  }

  /**
   * Build 3D Permaculture Soil Beds where Kaz the Duck can plant organic crops
   */
  private buildSoilGardenBeds(plots: SoilPlot[]) {
    this.soilPlots = plots;
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.85 });
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 });

    plots.forEach((plot) => {
      const plotGroup = new THREE.Group();
      plotGroup.position.set(plot.position.x, 0, plot.position.z);

      // Raised wooden planter frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 2.4), woodMat);
      frame.position.y = 0.14;
      frame.castShadow = !this.isSoftwareGl;
      frame.receiveShadow = true;
      plotGroup.add(frame);

      // Dark rich fertile tilled soil
      const soil = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 2.1), soilMat);
      soil.position.y = 0.2;
      soil.receiveShadow = true;
      plotGroup.add(soil);

      // Container for dynamic plant meshes (sprouts/vegetables)
      const plantGroup = new THREE.Group();
      plantGroup.position.y = 0.3;
      plotGroup.add(plantGroup);
      this.renderPlotVegetation(plantGroup, plot);

      // Floating Action Marker Badge
      const marker = this.createSoilMarker(plot);
      marker.position.set(0, 2.4, 0);
      plotGroup.add(marker);

      this.scene.add(plotGroup);
      this.soilPlotMeshes.push({
        plot,
        group: plotGroup,
        plantGroup,
        marker,
      });
    });
  }

  /**
   * Dynamically renders crops (empty stake, growing sprouts, or mature vegetables)
   */
  private renderPlotVegetation(group: THREE.Group, plot: SoilPlot) {
    // Clear previous children
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
    }

    const sproutGreen = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.6 });
    const matureGreen = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6 });
    const woodStakeMat = new THREE.MeshStandardMaterial({ color: 0xbcaaa4, roughness: 0.8 });

    if (plot.state === 'empty') {
      // Cute wooden planting stake with seed packet
      const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), woodStakeMat);
      stake.position.set(0, 0.35, 0);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.06), woodStakeMat);
      sign.position.set(0, 0.65, 0);
      group.add(stake, sign);
    } else if (plot.state === 'growing') {
      // Cute young seedling sprouts emerging from soil
      const scale = 0.4 + (plot.growthProgress / 100) * 0.6;
      for (let i = -0.5; i <= 0.5; i += 0.5) {
        for (let j = -0.5; j <= 0.5; j += 0.5) {
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.5 * scale, 6), sproutGreen);
          stem.position.set(i + (Math.random() - 0.5) * 0.1, 0.25 * scale, j + (Math.random() - 0.5) * 0.1);
          const leafL = new THREE.Mesh(new THREE.SphereGeometry(0.12 * scale, 6, 6), sproutGreen);
          leafL.scale.set(1.4, 0.3, 0.8);
          leafL.position.set(stem.position.x - 0.08 * scale, 0.45 * scale, stem.position.z);
          leafL.rotation.z = 0.4;
          const leafR = new THREE.Mesh(new THREE.SphereGeometry(0.12 * scale, 6, 6), sproutGreen);
          leafR.scale.set(1.4, 0.3, 0.8);
          leafR.position.set(stem.position.x + 0.08 * scale, 0.45 * scale, stem.position.z);
          leafR.rotation.z = -0.4;
          group.add(stem, leafL, leafR);
        }
      }
    } else if (plot.state === 'mature') {
      // Full mature crops based on crop name!
      if (plot.cropName.includes('Carrot')) {
        const carrotOrange = new THREE.MeshStandardMaterial({ color: 0xff6f00, roughness: 0.5 });
        for (let i = -0.45; i <= 0.45; i += 0.45) {
          for (let j = -0.45; j <= 0.45; j += 0.45) {
            const carrotTop = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 0.28, 8), carrotOrange);
            carrotTop.position.set(i, 0.14, j);
            const foliage = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.6, 6), matureGreen);
            foliage.position.set(i, 0.48, j);
            group.add(carrotTop, foliage);
          }
        }
      } else if (plot.cropName.includes('Corn')) {
        const cornYellow = new THREE.MeshStandardMaterial({ color: 0xffd600, roughness: 0.4 });
        for (let i = -0.4; i <= 0.4; i += 0.4) {
          for (let j = -0.4; j <= 0.4; j += 0.4) {
            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 8), matureGreen);
            stalk.position.set(i, 0.6, j);
            const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8), cornYellow);
            cob.position.set(i + 0.08, 0.7, j);
            cob.rotation.z = -0.3;
            group.add(stalk, cob);
          }
        }
      } else if (plot.cropName.includes('Sunflower')) {
        const petalYellow = new THREE.MeshStandardMaterial({ color: 0xffc107, roughness: 0.3 });
        const flowerCenter = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
        for (let i = -0.4; i <= 0.4; i += 0.4) {
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.3, 8), matureGreen);
          stem.position.set(i, 0.65, 0);
          const center = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 12), flowerCenter);
          center.rotation.x = Math.PI / 2;
          center.position.set(i, 1.3, 0.1);
          const petals = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.1, 8, 16), petalYellow);
          petals.position.set(i, 1.3, 0.1);
          group.add(stem, center, petals);
        }
      } else if (plot.cropName.includes('Tomato')) {
        const tomatoRed = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.3 });
        for (let i = -0.4; i <= 0.4; i += 0.4) {
          const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), matureGreen);
          bush.position.set(i, 0.45, 0);
          const t1 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), tomatoRed);
          t1.position.set(i + 0.2, 0.45, 0.2);
          const t2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), tomatoRed);
          t2.position.set(i - 0.2, 0.35, -0.15);
          group.add(bush, t1, t2);
        }
      } else {
        // General lush leafy vegetables / squash
        const squashGold = new THREE.MeshStandardMaterial({ color: 0xff9800, roughness: 0.4 });
        for (let i = -0.4; i <= 0.4; i += 0.4) {
          const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), matureGreen);
          foliage.scale.set(1.2, 0.5, 1.2);
          foliage.position.set(i, 0.25, 0);
          const veg = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), squashGold);
          veg.position.set(i + 0.15, 0.2, 0.15);
          group.add(foliage, veg);
        }
      }
    }
  }

  private createSoilMarker(plot: SoilPlot): THREE.Group {
    const marker = new THREE.Group();
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    const bgColor = plot.state === 'mature' ? '#10b981' : plot.state === 'growing' ? '#f59e0b' : '#8b5cf6';
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(80, 80, 72, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.font = '60px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(plot.cropIcon, 80, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    const label = plot.state === 'mature' ? 'Harvest' : plot.state === 'growing' ? `${Math.round(plot.growthProgress)}%` : 'Plant';
    ctx.fillText(label, 80, 124);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const badgeMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });

    const front = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), badgeMat);
    front.position.z = 0.04;
    const back = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), badgeMat);
    back.position.z = -0.04;
    back.rotation.y = Math.PI;

    marker.add(front, back);
    return marker;
  }

  /**
   * Updates soil plots state dynamically from App controller
   */
  public updateSoilPlots(plots: SoilPlot[]) {
    this.soilPlots = plots;
    plots.forEach((p) => {
      const match = this.soilPlotMeshes.find((m) => m.plot.id === p.id);
      if (match) {
        match.plot = p;
        this.renderPlotVegetation(match.plantGroup, p);

        // Update badge text texture
        match.group.remove(match.marker);
        match.marker = this.createSoilMarker(p);
        match.marker.position.set(0, 2.4, 0);
        match.group.add(match.marker);
      }
    });
  }

  public getNearestSoilPlot(threshold = 3.5): SoilPlot | null {
    let closest: { plot: SoilPlot; dist: number } | null = null;
    const pPos = this.playerGroup.position;

    for (const p of this.soilPlots) {
      const dx = p.position.x - pPos.x;
      const dz = p.position.z - pPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < threshold) {
        if (!closest || dist < closest.dist) {
          closest = { plot: p, dist };
        }
      }
    }
    return closest ? closest.plot : null;
  }

  public navigateToSoilPlot(plot: SoilPlot) {
    this.playerTargetPos.set(plot.position.x, 0, plot.position.z + 1.2);
    this.showClickTarget(this.playerTargetPos);
  }

  public getNearestStation(threshold = 5.2) {
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

  public spawnBurstParticles(pos: THREE.Vector3, count = 18, color = 0x2ecc71) {
    const geo = new THREE.DodecahedronGeometry(0.14, 0);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);
      p.position.y += 1.4;

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 3.0;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        3.0 + Math.random() * 3.0,
        Math.sin(angle) * speed
      );

      this.particleGroup.add(p);
      this.particles.push({
        mesh: p,
        vel,
        life: 0,
        maxLife: 0.9 + Math.random() * 0.4,
      });
    }
  }

  public triggerTaskVisualUpdate(task: TaskDefinition, _resources: PlayerResources) {
    const station = this.stations.find((s) => s.task.id === task.id);
    if (station) {
      this.spawnBurstParticles(station.group.position, 28, 0xffd166);
    }

    if (task.topic === 'marine_health') {
      this.oceanPlastics.forEach((p, idx) => {
        if (idx < 3) p.visible = false;
      });
    }
  }

  public navigateToStation(task: TaskDefinition) {
    this.playerTargetPos.set(task.location.x, 0, task.location.z);
    this.showClickTarget(this.playerTargetPos);
  }

  public navigateToNPC() {
    this.playerTargetPos.set(NPC_GOOSE_POSITION.x, 0, NPC_GOOSE_POSITION.z + 2.5);
    this.showClickTarget(this.playerTargetPos);
  }

  private tick(timestamp: number) {
    const rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    const dt = Math.min(rawDt, 0.05);

    // 1. Player Movement & Input Update (Fixed smooth directioning, no jitter)
    this.updatePlayer(dt);

    // 2. Animate stations, wind turbines, and click target
    this.updateWorldAnimations(timestamp, dt);

    // 3. Update active particles
    this.updateParticles(dt);

    // 4. Smooth Camera Follow
    const targetCamX = this.playerGroup.position.x + 22;
    const targetCamZ = this.playerGroup.position.z + 22;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 3.8, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 3.8, dt);

    // 5. Check NPC Proximity (Professor Barnaby)
    const distToNPC = Math.hypot(
      this.playerGroup.position.x - NPC_GOOSE_POSITION.x,
      this.playerGroup.position.z - NPC_GOOSE_POSITION.z
    );
    const nearNow = distToNPC < 5.2;
    if (nearNow !== this.isNearNPC) {
      this.isNearNPC = nearNow;
      this.callbacks.onNPCProximity(nearNow);
    }

    // 6. Check Station Proximity
    const nearest = this.getNearestStation(5.2);
    this.callbacks.onStationProximity(nearest ? nearest.task : null);

    // 7. Check Soil Plot Proximity
    const nearestPlot = this.getNearestSoilPlot(3.5);
    if (nearestPlot?.id !== this.nearbySoilPlot?.id) {
      this.nearbySoilPlot = nearestPlot;
      this.callbacks.onSoilPlotProximity(nearestPlot);
    }

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

    const speed = 14.0;

    if (moveInput.lengthSq() > 0) {
      // Manual Keyboard Direction: directly walks in intended direction
      moveInput.normalize();
      this.playerGroup.position.x += moveInput.x * speed * dt;
      this.playerGroup.position.z += moveInput.z * speed * dt;
      this.playerTargetPos.copy(this.playerGroup.position);
      this.playerFacing.copy(moveInput);
      this.isWalking = true;
      this.hideClickTarget();
    } else {
      // Click-to-Move: Smooth destination arrival without overshooting or endless wandering
      const diff = new THREE.Vector3().subVectors(this.playerTargetPos, this.playerGroup.position);
      diff.y = 0;
      const dist = diff.length();

      if (dist > 0.15) {
        const step = Math.min(speed * dt, dist);
        diff.normalize();
        this.playerGroup.position.x += diff.x * step;
        this.playerGroup.position.z += diff.z * step;
        this.playerFacing.copy(diff);
        this.isWalking = true;

        // Snaps to exact target when close enough, stopping cleanly
        if (dist <= step + 0.08) {
          this.playerGroup.position.x = this.playerTargetPos.x;
          this.playerGroup.position.z = this.playerTargetPos.z;
          this.isWalking = false;
          this.hideClickTarget();
        }
      } else {
        this.playerGroup.position.x = this.playerTargetPos.x;
        this.playerGroup.position.z = this.playerTargetPos.z;
        this.isWalking = false;
        this.hideClickTarget();
      }
    }

    // Clamp player to 5x enlarged island perimeter
    const distFromCenter = Math.sqrt(
      this.playerGroup.position.x * this.playerGroup.position.x +
        this.playerGroup.position.z * this.playerGroup.position.z
    );
    if (distFromCenter > 66.0) {
      const angle = Math.atan2(this.playerGroup.position.z, this.playerGroup.position.x);
      this.playerGroup.position.x = Math.cos(angle) * 66.0;
      this.playerGroup.position.z = Math.sin(angle) * 66.0;
    }

    // Rotate player towards facing direction
    if (this.playerFacing.lengthSq() > 0) {
      const targetAngle = Math.atan2(this.playerFacing.x, this.playerFacing.z);
      this.playerGroup.rotation.y = THREE.MathUtils.damp(this.playerGroup.rotation.y, targetAngle, 12, dt);
    }

    // Waddling walk animation
    if (this.isWalking) {
      this.walkDistance += dt * 16;
      const bob = Math.sin(this.walkDistance);
      this.playerGroup.position.y = Math.abs(bob) * 0.16;

      this.leftWingMesh.rotation.z = Math.sin(this.walkDistance) * 0.38;
      this.rightWingMesh.rotation.z = -Math.sin(this.walkDistance) * 0.38;

      this.leftFootMesh.position.z = Math.sin(this.walkDistance) * 0.2;
      this.rightFootMesh.position.z = -Math.sin(this.walkDistance) * 0.2;

      if (Math.abs(bob) > 0.95 && Math.random() < 0.1) {
        sounds.playWaddle();
      }
    } else {
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
      const bobOffset = Math.sin(t * 2.2 + i * 0.8) * 0.2;
      st.marker.position.y = st.floatingY + bobOffset;
      st.marker.rotation.y += dt * 0.8;
    });

    // Bobbing Professor Barnaby Talk Indicator
    if (this.npcMarker) {
      this.npcMarker.position.y = 3.2 + Math.sin(t * 2.5) * 0.18;
      this.npcMarker.rotation.y += dt * 0.7;
    }

    // Floating ocean plastic bobbing
    this.oceanPlastics.forEach((bottle, i) => {
      bottle.position.y = -1.6 + Math.sin(t * 1.8 + i) * 0.08;
      bottle.rotation.x = Math.sin(t + i) * 0.1;
    });

    // Click target ring rotation
    if (this.clickTargetRing && this.clickTargetRing.visible) {
      this.clickTargetRing.rotation.z += dt * 3.5;
    }

    // Floating soil plot action badges
    this.soilPlotMeshes.forEach((sp, i) => {
      const bob = Math.sin(t * 2.8 + i * 0.9) * 0.12;
      sp.marker.position.y = 2.4 + bob;
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

      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      p.vel.y -= 7.5 * dt;

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
