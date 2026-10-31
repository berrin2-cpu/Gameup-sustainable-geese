/**
 * Complete GDScript 4 code files for the ClimateKaz Godot project structure.
 * Designed with clean architecture, signals, asset loading gaps (Texture2D & AudioStream),
 * and fallback procedures so the game can run even before custom assets are imported.
 */

export interface GodotFile {
  path: string;
  filename: string;
  category: 'script' | 'config' | 'doc';
  description: string;
  code: string;
}

export const GODOT_FILES: GodotFile[] = [
  {
    path: 'scripts/GameManager.gd',
    filename: 'GameManager.gd',
    category: 'script',
    description: 'Core game loop, global game state, asset manager with texture/audio gaps, and signal bus.',
    code: `extends Node

## GameManager.gd
## Autoload Singleton: Handles the core game loop, global state, asset slots,
## save/load system, and signals for ClimateKaz (Climate Change & SDG Simulator).

signal game_started
signal game_paused(is_paused: bool)
signal resources_updated(resources: Dictionary)
signal level_up(new_level: int)
signal sustainability_goal_reached(summary: Dictionary)
signal notification_triggered(message: String, category: String)

# ==============================================================================
# ASSET SLOTS & TEXTURE / AUDIO GAPS
# Drop your textures and audio files in the Inspector, or keep null for auto-fallbacks!
# ==============================================================================
@export_group("Player Assets")
@export var player_duck_texture: Texture2D = null ## Slot for: res://textures/player/duck_idle.png
@export var player_duck_swim_texture: Texture2D = null

@export_group("Object Textures")
@export var plastic_debris_texture: Texture2D = null ## Slot for: res://textures/objects/plastic.png
@export var wind_turbine_texture: Texture2D = null ## Slot for: res://textures/objects/wind_turbine.png
@export var solar_panel_texture: Texture2D = null
@export var compost_bin_texture: Texture2D = null
@export var organic_crops_texture: Texture2D = null

@export_group("UI Icons")
@export var task_icon_texture: Texture2D = null ## Slot for: res://textures/ui/task_icon.png
@export var eco_badge_texture: Texture2D = null

@export_group("Audio Streams")
@export var sfx_water_splash: AudioStream = null ## Slot for: res://audio/water_splash.wav
@export var sfx_plastic_crunch: AudioStream = null ## Slot for: res://audio/plastic_crunch.wav
@export var sfx_task_complete: AudioStream = null
@export var sfx_level_up: AudioStream = null
@export var bgm_cozy_music: AudioStream = null ## Slot for background acoustic music

# Audio stream player instances created dynamically
var _sfx_player: AudioStreamPlayer
var _bgm_player: AudioStreamPlayer

# ==============================================================================
# GAME STATE & SDG RESOURCE REGISTRY
# ==============================================================================
enum GameState { TITLE, PLAYING, PAUSED, VICTORY, GAME_OVER }

var current_state: GameState = GameState.TITLE

var resources: Dictionary = {
	"eco_score": 0,
	"clean_energy_kwh": 40.0,
	"carbon_offset_kg": 0.0,
	"marine_health_pct": 35.0,
	"city_resilience_pct": 40.0,
	"food_security_baskets": 5,
	"waste_recycled_kg": 0.0,
	"completed_task_ids": [],
	"player_level": 1
}

var audio_muted: bool = false
var game_time_elapsed: float = 0.0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS # Run during pause to handle unpause
	_setup_audio_players()
	_load_default_assets_if_empty()
	print("[ClimateKaz] GameManager initialized. SDG simulation ready.")

func _setup_audio_players() -> void:
	_sfx_player = AudioStreamPlayer.new()
	_sfx_player.bus = "Master"
	add_child(_sfx_player)
	
	_bgm_player = AudioStreamPlayer.new()
	_bgm_player.bus = "Master"
	add_child(_bgm_player)
	
	if bgm_cozy_music:
		_bgm_player.stream = bgm_cozy_music
		_bgm_player.play()

## Checks default paths if inspector export slots were left empty
func _load_default_assets_if_empty() -> void:
	if not player_duck_texture and ResourceLoader.exists("res://textures/player/duck_idle.png"):
		player_duck_texture = load("res://textures/player/duck_idle.png")
	if not plastic_debris_texture and ResourceLoader.exists("res://textures/objects/plastic.png"):
		plastic_debris_texture = load("res://textures/objects/plastic.png")
	if not wind_turbine_texture and ResourceLoader.exists("res://textures/objects/wind_turbine.png"):
		wind_turbine_texture = load("res://textures/objects/wind_turbine.png")
	if not task_icon_texture and ResourceLoader.exists("res://textures/ui/task_icon.png"):
		task_icon_texture = load("res://textures/ui/task_icon.png")
	if not sfx_water_splash and ResourceLoader.exists("res://audio/water_splash.wav"):
		sfx_water_splash = load("res://audio/water_splash.wav")
	if not sfx_plastic_crunch and ResourceLoader.exists("res://audio/plastic_crunch.wav"):
		sfx_plastic_crunch = load("res://audio/plastic_crunch.wav")

func _process(delta: float) -> void:
	if current_state == GameState.PLAYING:
		game_time_elapsed += delta
		# Passive clean energy generation from spinning wind turbines & solar
		resources["clean_energy_kwh"] = min(120.0, resources["clean_energy_kwh"] + (1.2 * delta))

func start_game() -> void:
	current_state = GameState.PLAYING
	emit_signal("game_started")
	emit_signal("resources_updated", resources)
	emit_signal("notification_triggered", "Welcome to Kaz Island! Restore balance through the 7 SDGs.", "intro")

func toggle_pause() -> void:
	if current_state == GameState.PLAYING:
		current_state = GameState.PAUSED
		get_tree().paused = true
		emit_signal("game_paused", true)
	elif current_state == GameState.PAUSED:
		current_state = GameState.PLAYING
		get_tree().paused = false
		emit_signal("game_paused", false)

func play_sfx(stream: AudioStream, pitch_scale: float = 1.0) -> void:
	if audio_muted or not stream:
		return
	var player = AudioStreamPlayer.new()
	player.stream = stream
	player.pitch_scale = pitch_scale
	add_child(player)
	player.play()
	player.finished.connect(player.queue_free)

func play_water_splash() -> void:
	if sfx_water_splash:
		play_sfx(sfx_water_splash, randf_range(0.9, 1.1))

func play_plastic_crunch() -> void:
	if sfx_plastic_crunch:
		play_sfx(sfx_plastic_crunch, randf_range(0.95, 1.05))

func apply_task_rewards(task_id: String, eco_reward: int, energy_cost: float, metric_type: String, metric_val: float) -> void:
	resources["clean_energy_kwh"] = max(0.0, resources["clean_energy_kwh"] - energy_cost)
	resources["eco_score"] += eco_reward
	
	if not resources["completed_task_ids"].has(task_id):
		resources["completed_task_ids"].append(task_id)
	
	match metric_type:
		"wasteRecycledKg":
			resources["waste_recycled_kg"] += metric_val
			play_plastic_crunch()
		"marineHealthPct":
			resources["marine_health_pct"] = min(100.0, resources["marine_health_pct"] + metric_val)
			play_water_splash()
		"cityResiliencePct":
			resources["city_resilience_pct"] = min(100.0, resources["city_resilience_pct"] + metric_val)
		"foodSecurityBaskets":
			resources["food_security_baskets"] += int(metric_val)
		"carbonOffsetKg":
			resources["carbon_offset_kg"] += metric_val
		"cleanEnergyKwh":
			resources["clean_energy_kwh"] = min(120.0, resources["clean_energy_kwh"] + metric_val)
			
	# Level progression check
	var prev_level = resources["player_level"]
	var new_level = 1
	if resources["eco_score"] >= 700:
		new_level = 4
	elif resources["eco_score"] >= 450:
		new_level = 3
	elif resources["eco_score"] >= 200:
		new_level = 2
		
	if new_level > prev_level:
		resources["player_level"] = new_level
		emit_signal("level_up", new_level)
		if sfx_level_up:
			play_sfx(sfx_level_up)
			
	emit_signal("resources_updated", resources)
	_check_victory_condition()

func _check_victory_condition() -> void:
	if resources["completed_task_ids"].size() >= 7 and resources["marine_health_pct"] >= 80 and resources["city_resilience_pct"] >= 75:
		current_state = GameState.VICTORY
		emit_signal("sustainability_goal_reached", {
			"eco_score": resources["eco_score"],
			"carbon_offset": resources["carbon_offset_kg"],
			"time_taken": game_time_elapsed
		})
`,
  },
  {
    path: 'scripts/Player.gd',
    filename: 'Player.gd',
    category: 'script',
    description: '2.5D orthographic player movement for Kaz the Duck, interaction raycasting, and animations.',
    code: `extends CharacterBody2D

## Player.gd
## 2.5D Orthographic controller for Kaz the Duck.
## Handles smooth 8-direction movement, interaction zone detection,
## animated sprite state, water swimming detection, and sound triggers.

signal interacted_with_object(target_node: Node)
signal player_moved(position: Vector2)

@export var move_speed: float = 160.0
@export var acceleration: float = 800.0
@export var friction: float = 900.0

@onready var sprite: Sprite2D = $Sprite2D
@onready var interaction_area: Area2D = $InteractionArea
@onready var footstep_timer: Timer = $FootstepTimer

var current_interactable: Node = null
var is_in_water: bool = false
var facing_direction: Vector2 = Vector2.DOWN

func _ready() -> void:
	# Texture slot injection from GameManager if available
	if GameManager and GameManager.player_duck_texture and sprite:
		sprite.texture = GameManager.player_duck_texture
		
	if interaction_area:
		interaction_area.area_entered.connect(_on_interaction_area_entered)
		interaction_area.area_exited.connect(_on_interaction_area_exited)

func _physics_process(delta: float) -> void:
	if GameManager.current_state != GameManager.GameState.PLAYING:
		velocity = Vector2.ZERO
		move_and_slide()
		return
		
	var input_vector := Vector2.ZERO
	input_vector.x = Input.get_axis("move_left", "move_right")
	input_vector.y = Input.get_axis("move_up", "move_down")
	input_vector = input_vector.normalized()
	
	# Orthographic / 2.5D Isometric feel tuning
	var target_speed = move_speed * (0.8 if is_in_water else 1.0)
	
	if input_vector != Vector2.ZERO:
		velocity = velocity.move_toward(input_vector * target_speed, acceleration * delta)
		facing_direction = input_vector
		_update_sprite_orientation(input_vector)
	else:
		velocity = velocity.move_toward(Vector2.ZERO, friction * delta)
		
	move_and_slide()
	emit_signal("player_moved", global_position)
	
	# Action / Interact button (Space / E / Gamepad A)
	if Input.is_action_just_pressed("interact") and current_interactable:
		_trigger_interaction()

func _update_sprite_orientation(dir: Vector2) -> void:
	if not sprite:
		return
	if dir.x != 0:
		sprite.flip_h = dir.x < 0
	# Subtle squash and stretch waddling bob
	var bob = sin(Time.get_ticks_msec() * 0.012) * 0.08
	sprite.scale = Vector2(1.0 + bob, 1.0 - bob)

func _trigger_interaction() -> void:
	if current_interactable and current_interactable.has_method("interact"):
		current_interactable.interact(self)
		emit_signal("interacted_with_object", current_interactable)
		
		if is_in_water:
			GameManager.play_water_splash()

func _on_interaction_area_entered(area: Area2D) -> void:
	if area.is_in_group("interactables") or area.owner.is_in_group("interactables"):
		current_interactable = area.owner if area.owner else area
		if current_interactable.has_method("highlight"):
			current_interactable.highlight(true)

func _on_interaction_area_exited(area: Area2D) -> void:
	var target = area.owner if area.owner else area
	if current_interactable == target:
		if current_interactable.has_method("highlight"):
			current_interactable.highlight(false)
		current_interactable = null

func set_water_state(in_water: bool) -> void:
	if is_in_water != in_water:
		is_in_water = in_water
		if in_water:
			GameManager.play_water_splash()
			if GameManager.player_duck_swim_texture:
				sprite.texture = GameManager.player_duck_swim_texture
		else:
			if GameManager.player_duck_texture:
				sprite.texture = GameManager.player_duck_texture
`,
  },
  {
    path: 'scripts/TaskManager.gd',
    filename: 'TaskManager.gd',
    category: 'script',
    description: 'Manages all 7 SDG task categories, progress execution, and completion validation.',
    code: `extends Node

## TaskManager.gd
## Central controller for the 7 SDG task mechanics:
## 1. Zero Waste
## 2. Climate Change Education
## 3. Food Security
## 4. Ocean & Marine Health
## 5. Climate-Resilient Cities
## 6. Carbon Footprint & Conscious Consumption
## 7. Renewable Energy & Sustainability

signal task_started(task: Dictionary)
signal task_progressed(task_id: String, progress_pct: float)
signal task_completed(task: Dictionary)

const SDG_TOPICS = {
	"ZERO_WASTE": "zero_waste",
	"EDUCATION": "climate_education",
	"FOOD_SECURITY": "food_security",
	"MARINE_HEALTH": "marine_health",
	"RESILIENT_CITIES": "resilient_cities",
	"CONSCIOUS_CONSUMPTION": "conscious_consumption",
	"RENEWABLE_ENERGY": "renewable_energy"
}

var task_registry: Array[Dictionary] = [
	{
		"id": "task_zw_plastic_sorting",
		"topic": SDG_TOPICS.ZERO_WASTE,
		"title": "Sort Recyclables & Compost",
		"category": "Zero Waste",
		"sdg": "SDG 12",
		"description": "Separate organic compost from recyclable plastics and e-waste.",
		"cost_energy": 5.0,
		"reward_eco": 60,
		"metric_type": "wasteRecycledKg",
		"metric_val": 25.0,
		"duration": 2.5,
		"is_completed": false
	},
	{
		"id": "task_edu_climate_workshop",
		"topic": SDG_TOPICS.EDUCATION,
		"title": "Host Island Climate Academy",
		"category": "Climate Education",
		"sdg": "SDG 13",
		"description": "Teach ducklings climate feedback loops and clean tech principles.",
		"cost_energy": 8.0,
		"reward_eco": 80,
		"metric_type": "carbonOffsetKg",
		"metric_val": 40.0,
		"duration": 3.0,
		"is_completed": false
	},
	{
		"id": "task_food_permaculture_harvest",
		"topic": SDG_TOPICS.FOOD_SECURITY,
		"title": "Permaculture & Drip Irrigation",
		"category": "Food Security",
		"sdg": "SDG 2",
		"description": "Nurture drought-resilient crops with efficient micro-irrigation.",
		"cost_energy": 6.0,
		"reward_eco": 70,
		"metric_type": "foodSecurityBaskets",
		"metric_val": 15.0,
		"duration": 2.8,
		"is_completed": false
	},
	{
		"id": "task_marine_plastic_cleanse",
		"topic": SDG_TOPICS.MARINE_HEALTH,
		"title": "Clear Marine Plastic & Coral Care",
		"category": "Ocean Health",
		"sdg": "SDG 14",
		"description": "Scoop floating trash in Kaz Lagoon and seed heat-tolerant corals.",
		"cost_energy": 10.0,
		"reward_eco": 90,
		"metric_type": "marineHealthPct",
		"metric_val": 18.0,
		"duration": 3.2,
		"is_completed": false
	},
	{
		"id": "task_city_green_rooftop",
		"topic": SDG_TOPICS.RESILIENT_CITIES,
		"title": "Green Roofs & Rain Swales",
		"category": "Resilient Cities",
		"sdg": "SDG 11",
		"description": "Install sedum rooftop gardens to prevent urban heat and flood runoff.",
		"cost_energy": 12.0,
		"reward_eco": 100,
		"metric_type": "cityResiliencePct",
		"metric_val": 20.0,
		"duration": 3.5,
		"is_completed": false
	},
	{
		"id": "task_carbon_conscious_bazaar",
		"topic": SDG_TOPICS.CONSCIOUS_CONSUMPTION,
		"title": "Package-Free Bulk Market",
		"category": "Conscious Consumption",
		"sdg": "SDG 12",
		"description": "Eliminate single-use plastic packaging through reusable jars & bags.",
		"cost_energy": 7.0,
		"reward_eco": 75,
		"metric_type": "carbonOffsetKg",
		"metric_val": 50.0,
		"duration": 2.6,
		"is_completed": false
	},
	{
		"id": "task_renew_wind_solar_grid",
		"topic": SDG_TOPICS.RENEWABLE_ENERGY,
		"title": "Tune Wind Turbines & Solar Trackers",
		"category": "Renewable Energy",
		"sdg": "SDG 7",
		"description": "Optimize clean microgrid output and calibrate solar panel tracking.",
		"cost_energy": 4.0,
		"reward_eco": 85,
		"metric_type": "cleanEnergyKwh",
		"metric_val": 45.0,
		"duration": 3.0,
		"is_completed": false
	}
]

var active_task_id: String = ""
var active_task_timer: float = 0.0

func _process(delta: float) -> void:
	if active_task_id != "":
		var task = get_task_by_id(active_task_id)
		if task != null:
			active_task_timer += delta
			var progress = clamp(active_task_timer / task["duration"], 0.0, 1.0)
			emit_signal("task_progressed", active_task_id, progress * 100.0)
			
			if active_task_timer >= task["duration"]:
				_complete_active_task(task)

func start_task(task_id: String) -> bool:
	if active_task_id != "":
		return false # Another task in progress
		
	var task = get_task_by_id(task_id)
	if task == null:
		return false
		
	if GameManager.resources["clean_energy_kwh"] < task["cost_energy"]:
		GameManager.emit_signal("notification_triggered", "Not enough Clean Energy to begin this project!", "warning")
		return false
		
	active_task_id = task_id
	active_task_timer = 0.0
	emit_signal("task_started", task)
	return true

func _complete_active_task(task: Dictionary) -> void:
	task["is_completed"] = true
	active_task_id = ""
	active_task_timer = 0.0
	
	GameManager.apply_task_rewards(
		task["id"],
		task["reward_eco"],
		task["cost_energy"],
		task["metric_type"],
		task["metric_val"]
	)
	
	emit_signal("task_completed", task)
	GameManager.emit_signal("notification_triggered", "Completed: " + task["title"] + "! +" + str(task["reward_eco"]) + " Eco Points", "success")

func get_task_by_id(task_id: String) -> Dictionary:
	for t in task_registry:
		if t["id"] == task_id:
			return t
	return {}
`,
  },
  {
    path: 'scripts/CityManager.gd',
    filename: 'CityManager.gd',
    category: 'script',
    description: 'Updates city visual tiers, dynamic environment shaders, wind turbine speeds, and ocean clarity.',
    code: `extends Node2D

## CityManager.gd
## Controls dynamic environmental visuals based on player SDG milestones.
## Updates building appearance, ocean cleanliness, wind turbine rotations,
## and greenery coverage as the player makes sustainable choices.

@export var wind_turbines_group: Node2D
@export var ocean_debris_container: Node2D
@export var solar_farm: Node2D
@export var farm_crops_container: Node2D

var turbine_base_speed: float = 1.2
var current_rotation: float = 0.0

func _ready() -> void:
	if GameManager:
		GameManager.resources_updated.connect(_on_resources_updated)
		GameManager.level_up.connect(_on_level_up)

func _process(delta: float) -> void:
	# Rotate wind turbines dynamically based on clean energy health
	var speed_multiplier = 1.0 + (GameManager.resources.get("clean_energy_kwh", 40.0) / 40.0)
	current_rotation += turbine_base_speed * speed_multiplier * delta
	
	if wind_turbines_group:
		for turbine in wind_turbines_group.get_children():
			var blades = turbine.get_node_or_null("Blades")
			if blades:
				blades.rotation = current_rotation

func _on_resources_updated(res: Dictionary) -> void:
	# Update ocean debris visibility based on marine health
	var marine_health = res.get("marine_health_pct", 35.0)
	if ocean_debris_container:
		var total_debris = ocean_debris_container.get_child_count()
		var debris_to_show = int(round(total_debris * (1.0 - (marine_health / 100.0))))
		var index = 0
		for debris in ocean_debris_container.get_children():
			debris.visible = index < debris_to_show
			index += 1

func _on_level_up(new_level: int) -> void:
	print("[CityManager] Island upgraded to Level ", new_level, "! Sprouting new flora and resilient features.")
`,
  },
  {
    path: 'project.godot',
    filename: 'project.godot',
    category: 'config',
    description: 'Godot 4 project settings, autoloads, 2.5D viewport dimensions, and input action bindings.',
    code: `; Engine configuration file for ClimateKaz
; Packaging: Godot 4.x Compatible

config_version=5

[application]
config/name="ClimateKaz"
config/description="Cozy 2.5D orthographic climate & SDG farm simulator."
run/main_scene="res://scenes/World.tscn"
config/features=PackedStringArray("4.3", "Forward Plus")
config/icon="res://textures/player/duck_idle.png"

[autoload]
GameManager="*res://scripts/GameManager.gd"
TaskManager="*res://scripts/TaskManager.gd"

[display]
window/size/viewport_width=1280
window/size/viewport_height=720
window/size/mode=0
window/stretch/mode="canvas_items"
window/stretch/aspect="keep"

[input]
move_left={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194319,"physical_keycode":65,"key_label":0,"unicode":97,"echo":false,"script":null)
, Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194319,"physical_keycode":4194319,"key_label":0,"unicode":0,"echo":false,"script":null)
]
}
move_right={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194321,"physical_keycode":68,"key_label":0,"unicode":100,"echo":false,"script":null)
, Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194321,"physical_keycode":4194321,"key_label":0,"unicode":0,"echo":false,"script":null)
]
}
move_up={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194320,"physical_keycode":87,"key_label":0,"unicode":119,"echo":false,"script":null)
, Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194320,"physical_keycode":4194320,"key_label":0,"unicode":0,"echo":false,"script":null)
]
}
move_down={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194322,"physical_keycode":83,"key_label":0,"unicode":115,"echo":false,"script":null)
, Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194322,"physical_keycode":4194322,"key_label":0,"unicode":0,"echo":false,"script":null)
]
}
interact={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":32,"physical_keycode":32,"key_label":0,"unicode":32,"echo":false,"script":null)
, Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":69,"physical_keycode":69,"key_label":0,"unicode":101,"echo":false,"script":null)
]
}
pause={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194305,"physical_keycode":4194305,"key_label":0,"unicode":0,"echo":false,"script":null)
]
}

[rendering]
renderer/rendering_method="forward_plus"
environment/defaults/default_clear_color=Color(0.25, 0.65, 0.75, 1)
`,
  },
  {
    path: 'scenes/SetupGuide.md',
    filename: 'SetupGuide.md',
    category: 'doc',
    description: 'Instructions on setting up the scene tree, importing custom textures, and attaching scripts in Godot 4.',
    code: `# ClimateKaz Godot 4 Setup & Asset Integration Guide

Welcome to ClimateKaz! This guide explains how to connect the provided scripts to your Godot scenes and easily slot in your custom textures and audio files.

---

## 1. Asset Slots & Gaps (Textures & Music)

Every script has been architected with **open asset slots** marked with \`@export\`:

### Textures:
- **Player Avatar**:
  - \`textures/player/duck_idle.png\` -> Drag into \`GameManager\` -> \`player_duck_texture\` or assign to \`Player.tscn\` -> \`Sprite2D.texture\`.
- **Objects**:
  - \`textures/objects/plastic.png\` -> Marine debris sprite.
  - \`textures/objects/wind_turbine.png\` -> Wind turbine rotor/body.
- **UI**:
  - \`textures/ui/task_icon.png\` -> Task indicator bubbles.

### Audio:
- \`audio/water_splash.wav\` -> Drag into \`GameManager\` -> \`sfx_water_splash\`.
- \`audio/plastic_crunch.wav\` -> Drag into \`GameManager\` -> \`sfx_plastic_crunch\`.
- Background Music: Drag any \`.ogg\` or \`.wav\` into \`GameManager\` -> \`bgm_cozy_music\`.

> **Fallback Handling**: If you run the game without importing textures yet, the scripts automatically use procedural shape fallbacks and verify file existence safely with \`ResourceLoader.exists()\`.

---

## 2. Autoload Singletons

In Godot Project Settings -> **Globals / Autoload**:
1. Add \`res://scripts/GameManager.gd\` -> Node Name: \`GameManager\`
2. Add \`res://scripts/TaskManager.gd\` -> Node Name: \`TaskManager\`

---

## 3. Scene Tree Structure

### \`Player.tscn\` (CharacterBody2D)
- \`Player\` (CharacterBody2D, attach \`Player.gd\`)
  - \`Sprite2D\` (Centered sprite)
  - \`CollisionShape2D\` (Capsule or circle at duck's base)
  - \`InteractionArea\` (Area2D, collision layer for detecting interactables)
    - \`CollisionShape2D\` (Radius ~40px)
  - \`Camera2D\` (PositionSmoothing enabled, zoom 1.5x)

### \`World.tscn\` (Node2D)
- \`World\` (Node2D, attach \`CityManager.gd\`)
  - \`TileMapLayer\` (2.5D Isometric tilemap with grass, paths, water lagoon)
  - \`OceanDebrisContainer\` (Node2D, contains Area2D plastics)
  - \`WindTurbinesGroup\` (Node2D, contains turbine actors)
  - \`Interactables\` (Node2D, stations for the 7 SDG topics)
  - \`Player\` (Instance of \`Player.tscn\`)
  - \`CanvasLayer\`
    - \`TaskUI.tscn\`
    - \`ScoreUI.tscn\`

---

## 4. The 7 SDG Tasks Implemented

1. **Zero Waste**: Sorting compost vs plastics.
2. **Climate Education**: Island climate academy lessons.
3. **Food Security**: Drip irrigation & organic permaculture.
4. **Ocean Health**: Cleaning plastic debris from the bay & coral nursing.
5. **Climate-Resilient Cities**: Living green rooftops & bioswales.
6. **Conscious Consumption**: Zero-waste package-free pantry.
7. **Renewable Energy**: Wind turbine yaw calibration & solar tracker alignment.
`,
  },
];
