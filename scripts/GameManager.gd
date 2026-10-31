extends Node

## GameManager.gd
## Autoload Singleton: Handles the core game loop, global state, asset slots,
## save/load system, and signals for Sustainable Geese (Climate Change & SDG Simulator).

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

@export_group("World Textures")
@export var grass_tile_texture: Texture2D = null ## Slot for: res://textures/world/grass_tile.png
@export var water_tile_texture: Texture2D = null ## Slot for: res://textures/world/water_tile.png

@export_group("UI Icons")
@export var task_icon_texture: Texture2D = null ## Slot for: res://textures/ui/task_icon.png
@export var eco_badge_texture: Texture2D = null

@export_group("Audio Streams (Optional)")
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
	print("[Sustainable Geese] GameManager initialized. SDG simulation ready.")

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
	if not grass_tile_texture and ResourceLoader.exists("res://textures/world/grass_tile.png"):
		grass_tile_texture = load("res://textures/world/grass_tile.png")
	if not water_tile_texture and ResourceLoader.exists("res://textures/world/water_tile.png"):
		water_tile_texture = load("res://textures/world/water_tile.png")
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
	emit_signal("notification_triggered", "Welcome to the Island! Restore balance through the 7 SDGs.", "intro")

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
