/**
 * Complete Godot 4 project architecture files for Sustainable Geese (ClimateKaz).
 * Includes all .tscn scenes, GDScript files, project configs, and embedded PNG textures.
 */

export interface GodotFile {
  path: string;
  filename: string;
  category: 'scene' | 'script' | 'texture' | 'config' | 'doc';
  description: string;
  code?: string;
  isBinary?: boolean;
  base64Data?: string;
}

export const GODOT_FILES: GodotFile[] = [
  // ================= SCENES (.tscn) =================
  {
    path: 'scenes/World.tscn',
    filename: 'World.tscn',
    category: 'scene',
    description: 'Main Godot 4 world scene: 5x expanded 2.5D island, CityRoads network, NPC Goose, Player, interactables, turbines, and UI.',
    code: `[gd_scene load_steps=9 format=3 uid="uid://c7k2a8b41m5x9"]

[ext_resource type="Script" path="res://scripts/CityManager.gd" id="1_city_mgr"]
[ext_resource type="PackedScene" path="res://scenes/Player.tscn" id="2_player_scn"]
[ext_resource type="PackedScene" path="res://scenes/UI/TaskUI.tscn" id="3_task_ui"]
[ext_resource type="PackedScene" path="res://scenes/UI/ScoreUI.tscn" id="4_score_ui"]
[ext_resource type="Texture2D" path="res://textures/objects/wind_turbine.png" id="5_turbine_tex"]
[ext_resource type="Texture2D" path="res://textures/objects/plastic.png" id="6_plastic_tex"]
[ext_resource type="PackedScene" path="res://scenes/CityRoads.tscn" id="7_roads_scn"]
[ext_resource type="PackedScene" path="res://scenes/NPCGoose.tscn" id="8_npc_goose_scn"]

[node name="World" type="Node2D" node_paths=PackedStringArray("wind_turbines_group", "ocean_debris_container")]
y_sort_enabled = true
script = ExtResource("1_city_mgr")
wind_turbines_group = NodePath("WindTurbinesGroup")
ocean_debris_container = NodePath("OceanDebrisContainer")

[node name="IslandBackground" type="Node2D" parent="."]
z_index = -10

[node name="OceanWater" type="ColorRect" parent="IslandBackground"]
offset_left = -8000.0
offset_top = -6000.0
offset_right = 8000.0
offset_bottom = 6000.0
color = Color(0.133333, 0.603922, 0.666667, 1)

[node name="BeachShoreline" type="Polygon2D" parent="IslandBackground"]
color = Color(0.945098, 0.768627, 0.32549, 1)
polygon = PackedVector2Array(-3000, -1900, -2250, -2400, 0, -2700, 2400, -2300, 3100, -1600, 3300, 0, 3000, 1800, 2200, 2400, 0, 2600, -2300, 2300, -3100, 1500, -3300, 0)

[node name="MainGrassIsland" type="Polygon2D" parent="IslandBackground"]
color = Color(0.282353, 0.658824, 0.219608, 1)
polygon = PackedVector2Array(-2700, -1650, -2000, -2100, 0, -2350, 2100, -2000, 2700, -1350, 2900, 0, 2650, 1550, 1900, 2100, 0, 2250, -2000, 2000, -2700, 1300, -2850, 0)

[node name="CityRoads" parent="." instance=ExtResource("7_roads_scn")]

[node name="WindTurbinesGroup" type="Node2D" parent="."]
y_sort_enabled = true
position = Vector2(1700, -1800)

[node name="Turbine1" type="Node2D" parent="WindTurbinesGroup"]
position = Vector2(0, -60)

[node name="TowerSprite" type="Sprite2D" parent="WindTurbinesGroup/Turbine1"]
scale = Vector2(1.5, 1.5)
texture = ExtResource("5_turbine_tex")
offset = Vector2(0, -32)

[node name="Blades" type="Node2D" parent="WindTurbinesGroup/Turbine1"]
position = Vector2(0, -84)

[node name="Turbine2" type="Node2D" parent="WindTurbinesGroup"]
position = Vector2(180, 80)

[node name="TowerSprite" type="Sprite2D" parent="WindTurbinesGroup/Turbine2"]
scale = Vector2(1.5, 1.5)
texture = ExtResource("5_turbine_tex")
offset = Vector2(0, -32)

[node name="Blades" type="Node2D" parent="WindTurbinesGroup/Turbine2"]
position = Vector2(0, -84)

[node name="OceanDebrisContainer" type="Node2D" parent="."]
position = Vector2(-1750, -1500)

[node name="Debris1" type="Sprite2D" parent="OceanDebrisContainer"]
position = Vector2(0, 0)
scale = Vector2(1.4, 1.4)
texture = ExtResource("6_plastic_tex")

[node name="Debris2" type="Sprite2D" parent="OceanDebrisContainer"]
position = Vector2(90, -70)
scale = Vector2(1.4, 1.4)
texture = ExtResource("6_plastic_tex")

[node name="Debris3" type="Sprite2D" parent="OceanDebrisContainer"]
position = Vector2(-110, 80)
scale = Vector2(1.4, 1.4)
texture = ExtResource("6_plastic_tex")

[node name="InteractableStations" type="Node2D" parent="."]
y_sort_enabled = true

[node name="ZeroWasteStation" type="Area2D" parent="InteractableStations" groups=["interactables"]]
position = Vector2(-1500, 1000)

[node name="CollisionPolygon2D" type="CollisionPolygon2D" parent="InteractableStations/ZeroWasteStation"]
polygon = PackedVector2Array(-80, -60, 80, -60, 80, 60, -80, 60)

[node name="EducationStation" type="Area2D" parent="InteractableStations" groups=["interactables"]]
position = Vector2(1250, 1500)

[node name="CollisionPolygon2D" type="CollisionPolygon2D" parent="InteractableStations/EducationStation"]
polygon = PackedVector2Array(-80, -60, 80, -60, 80, 60, -80, 60)

[node name="FarmStation" type="Area2D" parent="InteractableStations" groups=["interactables"]]
position = Vector2(1750, -1000)

[node name="CollisionPolygon2D" type="CollisionPolygon2D" parent="InteractableStations/FarmStation"]
polygon = PackedVector2Array(-90, -70, 90, -70, 90, 70, -90, 70)

[node name="MarineStation" type="Area2D" parent="InteractableStations" groups=["interactables"]]
position = Vector2(-1750, -1500)

[node name="CollisionPolygon2D" type="CollisionPolygon2D" parent="InteractableStations/MarineStation"]
polygon = PackedVector2Array(-80, -60, 80, -60, 80, 60, -80, 60)

[node name="ResilientCityStation" type="Area2D" parent="InteractableStations" groups=["interactables"]]
position = Vector2(0, 2000)

[node name="CollisionPolygon2D" type="CollisionPolygon2D" parent="InteractableStations/ResilientCityStation"]
polygon = PackedVector2Array(-90, -70, 90, -70, 90, 70, -90, 70)

[node name="ConsciousBazaarStation" type="Area2D" parent="InteractableStations" groups=["interactables"]]
position = Vector2(-1000, -500)

[node name="CollisionPolygon2D" type="CollisionPolygon2D" parent="InteractableStations/ConsciousBazaarStation"]
polygon = PackedVector2Array(-80, -60, 80, -60, 80, 60, -80, 60)

[node name="RenewableEnergyStation" type="Area2D" parent="InteractableStations" groups=["interactables"]]
position = Vector2(1500, 0)

[node name="CollisionPolygon2D" type="CollisionPolygon2D" parent="InteractableStations/RenewableEnergyStation"]
polygon = PackedVector2Array(-90, -70, 90, -70, 90, 70, -90, 70)

[node name="NPCGoose" parent="." instance=ExtResource("8_npc_goose_scn")]
position = Vector2(0, -180)

[node name="Player" parent="." instance=ExtResource("2_player_scn")]
position = Vector2(0, 0)

[node name="HUD" type="CanvasLayer" parent="."]

[node name="ScoreUI" parent="HUD" instance=ExtResource("4_score_ui")]

[node name="TaskUI" parent="HUD" instance=ExtResource("3_task_ui")]
`,
  },
  {
    path: 'scenes/CityRoads.tscn',
    filename: 'CityRoads.tscn',
    category: 'scene',
    description: 'City road network scene with main avenues, roundabout, crosswalks, bioswales, and bike lanes.',
    code: `[gd_scene format=3 uid="uid://b8m3k2v91q4p7"]

[node name="CityRoads" type="Node2D"]
z_index = -5

[node name="AsphaltPavements" type="Node2D" parent="."]

[node name="MainAvenueNorthSouth" type="Polygon2D" parent="AsphaltPavements"]
color = Color(0.24, 0.26, 0.28, 1)
polygon = PackedVector2Array(-90, -2200, 90, -2200, 90, 2200, -90, 2200)

[node name="EastWestAvenue" type="Polygon2D" parent="AsphaltPavements"]
color = Color(0.24, 0.26, 0.28, 1)
polygon = PackedVector2Array(-2200, -70, 2200, -70, 2200, 70, -2200, 70)

[node name="CentralRoundaboutRing" type="Polygon2D" parent="AsphaltPavements"]
color = Color(0.24, 0.26, 0.28, 1)
polygon = PackedVector2Array(-260, 0, -240, -100, -180, -180, -100, -240, 0, -260, 100, -240, 180, -180, 240, -100, 260, 0, 240, 100, 180, 180, 100, 240, 0, 260, -100, 240, -180, 180, -240, 100)

[node name="CentralPlazaIsland" type="Polygon2D" parent="."]
color = Color(0.38, 0.72, 0.32, 1)
polygon = PackedVector2Array(-110, 0, -90, -60, -60, -90, 0, -110, 60, -90, 90, -60, 110, 0, 90, 60, 60, 90, 0, 110, -60, 90, -90, 60)

[node name="BikeLanes" type="Node2D" parent="."]

[node name="NorthBikeLane" type="Line2D" parent="BikeLanes"]
points = PackedVector2Array(-75, -2200, -75, -280)
width = 12.0
default_color = Color(0.2, 0.65, 0.45, 0.9)

[node name="SouthBikeLane" type="Line2D" parent="BikeLanes"]
points = PackedVector2Array(75, 280, 75, 2200)
width = 12.0
default_color = Color(0.2, 0.65, 0.45, 0.9)

[node name="PedestrianCrosswalks" type="Node2D" parent="."]

[node name="NorthCrosswalkBar1" type="Line2D" parent="PedestrianCrosswalks"]
points = PackedVector2Array(-80, -320, 80, -320)
width = 8.0
default_color = Color(1, 1, 1, 0.9)

[node name="BioswalesAndCurbs" type="Node2D" parent="."]

[node name="WestCurvedBioswale" type="Line2D" parent="BioswalesAndCurbs"]
points = PackedVector2Array(-105, -2000, -105, 2000)
width = 16.0
default_color = Color(0.42, 0.74, 0.38, 1)
`,
  },
  {
    path: 'scenes/NPCGoose.tscn',
    filename: 'NPCGoose.tscn',
    category: 'scene',
    description: 'Elder Goose NPC (Professor Barnaby) scene with interaction Area2D and dialogue speech bubble.',
    code: `[gd_scene load_steps=5 format=3 uid="uid://c6y8m1n43p7q2"]

[ext_resource type="Script" path="res://scripts/NPCGoose.gd" id="1_npc_script"]
[ext_resource type="Texture2D" path="res://textures/player/duck_idle.png" id="2_duck_tex"]

[sub_resource type="CircleShape2D" id="CircleShape2D_7xk2q"]
radius = 48.0

[node name="NPCGoose" type="Area2D" groups=["interactables", "npcs"]]
collision_layer = 4
collision_mask = 2
script = ExtResource("1_npc_script")

[node name="CollisionShape2D" type="CollisionShape2D" parent="."]
shape = SubResource("CircleShape2D_7xk2q")

[node name="GooseSprite" type="Sprite2D" parent="."]
modulate = Color(0.92, 0.95, 1.0, 1.0)
texture = ExtResource("2_duck_tex")
offset = Vector2(0, -8)

[node name="SpectaclesBowIndicator" type="Polygon2D" parent="."]
    polygon = PackedVector2Array(-8, 4, 8, 4, 6, 8, -6, 8)
`,
  },
  {
    path: 'scenes/Player.tscn',
    filename: 'Player.tscn',
    category: 'scene',
    description: 'Player CharacterBody2D scene with Sprite2D, collision capsules, and interaction area.',
    code: `[gd_scene load_steps=5 format=3 uid="uid://b5e7d9x1a2q4k"]

[ext_resource type="Script" path="res://scripts/Player.gd" id="1_player_script"]
[ext_resource type="Texture2D" path="res://textures/player/duck_idle.png" id="2_duck_texture"]

[sub_resource type="CapsuleShape2D" id="CapsuleShape2D_body"]
radius = 14.0
height = 28.0

[sub_resource type="CircleShape2D" id="CircleShape2D_interact"]
radius = 48.0

[node name="Player" type="CharacterBody2D"]
y_sort_enabled = true
collision_mask = 3
script = ExtResource("1_player_script")

[node name="Sprite2D" type="Sprite2D" parent="."]
position = Vector2(0, -20)
texture = ExtResource("2_duck_texture")

[node name="CollisionShape2D" type="CollisionShape2D" parent="."]
position = Vector2(0, -6)
rotation = 1.5708
shape = SubResource("CapsuleShape2D_body")

[node name="InteractionArea" type="Area2D" parent="."]
collision_layer = 2
collision_mask = 2

[node name="CollisionShape2D" type="CollisionShape2D" parent="InteractionArea"]
position = Vector2(0, -10)
shape = SubResource("CircleShape2D_interact")

[node name="Camera2D" type="Camera2D" parent="."]
zoom = Vector2(1.2, 1.2)
position_smoothing_enabled = true
position_smoothing_speed = 5.0
`,
  },
  {
    path: 'scenes/TaskManager.tscn',
    filename: 'TaskManager.tscn',
    category: 'scene',
    description: 'Task manager node and lifecycle coordinator.',
    code: `[gd_scene load_steps=2 format=3 uid="uid://d3m7p8a9q2r1x"]

[ext_resource type="Script" path="res://scripts/TaskManager.gd" id="1_task_mgr_script"]

[node name="TaskManager" type="Node"]
script = ExtResource("1_task_mgr_script")
`,
  },
  {
    path: 'scenes/UI/TaskUI.tscn',
    filename: 'TaskUI.tscn',
    category: 'scene',
    description: 'Active tasks indicator, circular/linear progress bars, and interaction prompt HUD.',
    code: `[gd_scene load_steps=2 format=3 uid="uid://e4x8m2a1b9q5t"]

[ext_resource type="Texture2D" path="res://textures/ui/task_icon.png" id="1_task_icon"]

[node name="TaskUI" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
mouse_filter = 2

[node name="BottomDock" type="PanelContainer" parent="."]
layout_mode = 1
anchors_preset = 7
anchor_left = 0.5
anchor_top = 1.0
anchor_right = 0.5
anchor_bottom = 1.0
offset_left = -300.0
offset_top = -100.0
offset_right = 300.0
offset_bottom = -16.0
grow_horizontal = 2
grow_vertical = 0

[node name="Margin" type="MarginContainer" parent="BottomDock"]
layout_mode = 2
theme_override_constants/margin_left = 16
theme_override_constants/margin_top = 12
theme_override_constants/margin_right = 16
theme_override_constants/margin_bottom = 12

[node name="HBox" type="HBoxContainer" parent="BottomDock/Margin"]
layout_mode = 2
theme_override_constants/separation = 14

[node name="TaskIcon" type="TextureRect" parent="BottomDock/Margin/HBox"]
custom_minimum_size = Vector2(48, 48)
layout_mode = 2
texture = ExtResource("1_task_icon")
expand_mode = 1
stretch_mode = 5

[node name="VBox" type="VBoxContainer" parent="BottomDock/Margin/HBox"]
layout_mode = 2
size_flags_horizontal = 3

[node name="TaskTitle" type="Label" parent="BottomDock/Margin/HBox/VBox"]
layout_mode = 2
text = "SDG Task: Sort Recyclables & Compost"
theme_override_font_sizes/font_size = 14

[node name="TaskProgressBar" type="ProgressBar" parent="BottomDock/Margin/HBox/VBox"]
custom_minimum_size = Vector2(0, 16)
layout_mode = 2
value = 25.0
show_percentage = false

[node name="PromptLabel" type="Label" parent="BottomDock/Margin/HBox/VBox"]
layout_mode = 2
text = "Press [Space] or [E] to Complete Project"
theme_override_colors/font_color = Color(0.7, 0.7, 0.7, 1)
theme_override_font_sizes/font_size = 11
`,
  },
  {
    path: 'scenes/UI/ScoreUI.tscn',
    filename: 'ScoreUI.tscn',
    category: 'scene',
    description: 'Score display, Clean Energy meter, and SDG vitality status cluster HUD.',
    code: `[gd_scene load_steps=1 format=3 uid="uid://f5y9n3b2c8r6w"]

[node name="ScoreUI" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
mouse_filter = 2

[node name="TopLeftCluster" type="PanelContainer" parent="."]
layout_mode = 0
offset_left = 16.0
offset_top = 16.0
offset_right = 320.0
offset_bottom = 96.0

[node name="Margin" type="MarginContainer" parent="TopLeftCluster"]
layout_mode = 2
theme_override_constants/margin_left = 14
theme_override_constants/margin_top = 10
theme_override_constants/margin_right = 14
theme_override_constants/margin_bottom = 10

[node name="HBox" type="HBoxContainer" parent="TopLeftCluster/Margin"]
layout_mode = 2
theme_override_constants/separation = 12

[node name="LevelBadge" type="ColorRect" parent="TopLeftCluster/Margin/HBox"]
custom_minimum_size = Vector2(40, 40)
layout_mode = 2
size_flags_vertical = 4
color = Color(0.960784, 0.658824, 0.137255, 1)

[node name="LevelLabel" type="Label" parent="TopLeftCluster/Margin/HBox/LevelBadge"]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
text = "L1"
horizontal_alignment = 1
vertical_alignment = 1
theme_override_colors/font_color = Color(0.08, 0.08, 0.08, 1)
theme_override_font_sizes/font_size = 16

[node name="StatsVBox" type="VBoxContainer" parent="TopLeftCluster/Margin/HBox"]
layout_mode = 2
size_flags_horizontal = 3

[node name="EcoScoreLabel" type="Label" parent="TopLeftCluster/Margin/HBox/StatsVBox"]
layout_mode = 2
text = "Island Eco Score: 0"
theme_override_font_sizes/font_size = 14

[node name="EnergyLabel" type="Label" parent="TopLeftCluster/Margin/HBox/StatsVBox"]
layout_mode = 2
text = "Clean Energy: 40 kWh"
theme_override_colors/font_color = Color(0.96, 0.85, 0.4, 1)
theme_override_font_sizes/font_size = 12

[node name="SDGPillsCluster" type="HBoxContainer" parent="."]
layout_mode = 0
offset_left = 16.0
offset_top = 108.0
offset_right = 440.0
offset_bottom = 138.0
theme_override_constants/separation = 8

[node name="OceanPill" type="Label" parent="SDGPillsCluster"]
layout_mode = 2
text = "🌊 Ocean: 35%"
theme_override_font_sizes/font_size = 11

[node name="ResiliencePill" type="Label" parent="SDGPillsCluster"]
layout_mode = 2
text = "🏙️ Resilience: 40%"
theme_override_font_sizes/font_size = 11

[node name="OffsetPill" type="Label" parent="SDGPillsCluster"]
layout_mode = 2
text = "🌲 CO₂ Offset: 0kg"
theme_override_font_sizes/font_size = 11
`,
  },

  // ================= SCRIPTS (.gd) =================
  {
    path: 'scripts/GameManager.gd',
    filename: 'GameManager.gd',
    category: 'script',
    description: 'Core game loop, global game state, asset manager with texture/audio gaps, and signal bus.',
    code: `extends Node

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
    description: '2.5D orthographic player movement for protagonist, interaction detection, and animations.',
    code: `extends CharacterBody2D

## Player.gd
## 2.5D Orthographic controller for Sustainable Geese protagonist.
## Handles smooth 8-direction movement, interaction zone detection,
## animated sprite state, water swimming detection, and sound triggers.

signal interacted_with_object(target_node: Node)
signal player_moved(position: Vector2)

@export var move_speed: float = 160.0
@export var acceleration: float = 800.0
@export var friction: float = 900.0

@onready var sprite: Sprite2D = $Sprite2D
@onready var interaction_area: Area2D = $InteractionArea

var current_interactable: Node = null
var is_in_water: bool = false
var facing_direction: Vector2 = Vector2.DOWN

func _ready() -> void:
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
	
	var target_speed = move_speed * (0.8 if is_in_water else 1.0)
	
	if input_vector != Vector2.ZERO:
		velocity = velocity.move_toward(input_vector * target_speed, acceleration * delta)
		facing_direction = input_vector
		_update_sprite_orientation(input_vector)
	else:
		velocity = velocity.move_toward(Vector2.ZERO, friction * delta)
		
	move_and_slide()
	emit_signal("player_moved", global_position)
	
	if Input.is_action_just_pressed("interact") and current_interactable:
		_trigger_interaction()

func _update_sprite_orientation(dir: Vector2) -> void:
	if not sprite:
		return
	if dir.x != 0:
		sprite.flip_h = dir.x < 0
	var bob = sin(Time.get_ticks_msec() * 0.012) * 0.08
	sprite.scale = Vector2(1.0 + bob, 1.0 - bob)

func _trigger_interaction() -> void:
	if current_interactable and current_interactable.has_method("interact"):
		current_interactable.interact(self)
		emit_signal("interacted_with_object", current_interactable)
		
		if is_in_water:
			GameManager.play_water_splash()

func _on_interaction_area_entered(area: Area2D) -> void:
	if area.is_in_group("interactables") or (area.owner and area.owner.is_in_group("interactables")):
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
		"description": "Teach ducklings and geese climate feedback loops and clean tech principles.",
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
		"description": "Scoop floating trash in the Lagoon and seed heat-tolerant corals.",
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
		return false
		
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
	var speed_multiplier = 1.0 + (GameManager.resources.get("clean_energy_kwh", 40.0) / 40.0)
	current_rotation += turbine_base_speed * speed_multiplier * delta
	
	if wind_turbines_group:
		for turbine in wind_turbines_group.get_children():
			var blades = turbine.get_node_or_null("Blades")
			if blades:
				blades.rotation = current_rotation

func _on_resources_updated(res: Dictionary) -> void:
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
    path: 'scripts/NPCGoose.gd',
    filename: 'NPCGoose.gd',
    category: 'script',
    description: 'Elder Goose NPC (Professor Barnaby) dialogue controller, providing efficiency strategies for all 7 SDGs and efficiency bonus buff.',
    code: `# NPCGoose.gd - Professor Barnaby (Elder Goose)
# Handles interactive conversations, advice on completing SDG tasks in the most efficient sequence,
# and granting an efficiency bonus multiplier.

extends Area2D
class_name NPCGoose

signal player_approached()
signal player_exited()
signal dialogue_opened(topics: Array)
signal efficiency_boost_granted(multiplier: float)

@export var npc_name: String = "Professor Barnaby"
@export var title: String = "Elder Climate Goose & Chief Strategist"
@export var efficiency_multiplier: float = 1.25

var is_player_nearby: bool = false
var has_boost_been_granted: bool = false

# Efficiency strategies for all 7 SDG topics
var conversation_topics: Array[Dictionary] = [
	{
		"id": "strategy_golden_order",
		"topic": "The Golden Task Loop",
		"dialogue": "Honk! Young flyer, to manage this island effortlessly, calibrate the Wind Turbines and Solar Array first. That refills your clean energy reserves to 120 kWh, letting you breeze through demanding civic and ocean works!",
		"tip": "Always tune Renewables (+45 kWh) early to fund high-cost City and Marine projects."
	},
	{
		"id": "strategy_zero_waste_compost",
		"topic": "Compost-to-Permaculture Cascade",
		"dialogue": "When you sort organics at the Zero Waste station before visiting the Farmstead, the nutrient balance is optimal. Closed loops beat wasteful linear disposal every single day!",
		"tip": "Execute Zero Waste sorting right before Food Permaculture to mirror circular agriculture."
	},
	{
		"id": "strategy_urban_bioswales",
		"topic": "Bioswales & Flood Protection",
		"dialogue": "Our paved city avenues channel torrential storm runoff. Constructing green sedum roofs and roadside bioswales sponges water before it can overwhelm the Kaz Lagoon coral sanctuary!",
		"tip": "Keep City Resilience above 75% to prevent environmental cascade failures in the lagoon."
	},
	{
		"id": "strategy_marine_currents",
		"topic": "Lagoon Surface Cleanup Timing",
		"dialogue": "Sunlight breaks ocean plastics into toxic microplastics. Sweep Kaz Bay before midday UV peaks to retrieve buoyant bottles intact before they contaminate the nursery reefs!",
		"tip": "Restore coral and scoop debris early to push Marine Health above the 80% victory threshold."
	},
	{
		"id": "strategy_education_multiplier",
		"topic": "Climate Academy Ripple Effect",
		"dialogue": "Teaching ducklings creates a multiplier! Once flock members comprehend greenhouse metrics, they willingly adopt packaging-free groceries at the Conscious Bazaar.",
		"tip": "Educate the flock at the Gazebo to unlock public enthusiasm across the island."
	},
	{
		"id": "strategy_conscious_pantry",
		"topic": "Supply Chain Proximity",
		"dialogue": "Long freight routes account for heavy transport emissions. Buying bulk dry goods in reusable burlap bags cuts supply chain footprints down to practically zero!",
		"tip": "Bazaar audits eliminate hidden supply chain carbon miles."
	},
	{
		"id": "strategy_wind_solar_baseload",
		"topic": "Grid Battery Balancing",
		"dialogue": "Our central battery caps at 120 kWh. Never calibrate turbines if energy is already full, or pristine green power is spilled. Discharge first, then recharge!",
		"tip": "Spend down energy on tasks, then recharge with Renewables to maximize battery headroom."
	}
]

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	add_to_group("interactables")
	add_to_group("npcs")

func _on_body_entered(body: Node2D) -> void:
	if body is CharacterBody2D or body.name == "Player":
		is_player_nearby = true
		player_approached.emit()

func _on_body_exited(body: Node2D) -> void:
	if body is CharacterBody2D or body.name == "Player":
		is_player_nearby = false
		player_exited.emit()

func interact() -> void:
	if not is_player_nearby:
		return
	dialogue_opened.emit(conversation_topics)
	if not has_boost_been_granted:
		has_boost_been_granted = true
		efficiency_boost_granted.emit(efficiency_multiplier)
`,
  },

  // ================= TEXTURES (.png) =================
  {
    path: 'textures/player/duck_idle.png',
    filename: 'duck_idle.png',
    category: 'texture',
    isBinary: true,
    description: 'Character sprite: Cozy goose / duck avatar with green gardener sprout hat.',
    base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAByUlEQVR4nO3ZPVLDMBCGYR8iNW2oOAs1FVdI50OkTs0JOEl6DpEmjWsxCpHG1p+9SPa3lnYz2yQZovexyTBD18nIyMjI8J/j96dCnwEyOtxd9Jk2m1B8UwhNA6TiBaGFeDV8Ja++fh19xtVGx+l9u56i8WbRZy0+4zgNYNYNrxLBDRsDjJ8/HF7qQ4hdXXd1vNkqENT9rB5LjA8hoFvIY+MXAlR1B0ziCQDB74C+m11072Ry4oO7e4BchD0BBOMFQAAEIBcB3ZUcNVzUY1PxOQj3M08AGz7e0gi7il8KsBTh+V50qzfReApACCTyGrp3Msn4HIDEopvtzMavgIButhOLHX4+2gLQwXNbCgHdbIcSXwzh1vMCoMRnI9x6XgD/iZ8gLP4D6WLj2SDkxHsI7hdl6PlmAGLbPICDgO5v+w4oEU9GcACqQNjtHSAAArAxALfffzOoq88C4PX974GIN5/NAkAfaMt4dgAUhJLxUIDxIQyA3WcAOXhBvAsAQ3APEUNYO54VgIdAhUiEx+LZAQQRYv+4JLwv9XnsADyETIC5z2IX70GsDMAfobY7gAqQujtK/JzdApR6CIAAgAYdDo0XAAHAI+Se/RdJJcMlYtM2GAAAAABJRU5ErkJggg==',
  },
  {
    path: 'textures/objects/plastic.png',
    filename: 'plastic.png',
    category: 'texture',
    isBinary: true,
    description: 'Object sprite: Discarded single-use plastic bottle for marine cleanups.',
    base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAoUlEQVR4nO3YMQqDQBCGUa+TW+ZQ2+QGOYT11mmsJ1ikEVkisqw478HfWUw+0CLTBAAAQF+P5yv+2eg7uxFAgOQBVqVGbW30fd0JIIAAuQKUGvNmzQDb50fff9pOgEMbff9pvx8yL/E5MgEEEEAAAQQQ4D4BIuLdmgAC3DxA+m+AAAIIIMC6iCh7EyBLgPSvgAACJA2Q/m/xtAEAAACAy/kC+2/W5yx1DcwAAAAASUVORK5CYII=',
  },
  {
    path: 'textures/objects/wind_turbine.png',
    filename: 'wind_turbine.png',
    category: 'texture',
    isBinary: true,
    description: 'Object sprite: Clean energy wind turbine tower with 3 aerofoil blades.',
    base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAA9ElEQVR4nO3RsQ6CMBCAYd7/yZidmZlZXFhKmljTGAvXYnut9/9JIzEKdx/TRESklHulPYdaAAAAAAAAAAAAANpzqAUAAAAAAAAARgGWZQ37O3/tj/ZMzQoLfwKYQTANEC+77+59zCHEy8cI2rNVL/XW4++1Z6xWavm/R/i22LY9nT9+cf959fthSy0TAMKR/m+ozha4ApDco9skb08KIL1fN0mHzQHIua9auQPmApQ+p0klQ5UClD6vaiWD3AG489xu+gXA0AEAAAAAAAAAAAAAAAAAAAAAAAAAaM/TPAAAAMAmwDw/3NnRnq96AABgHIA66wAlVTRLhvvF+AAAAABJRU5ErkJggg==',
  },
  {
    path: 'textures/ui/task_icon.png',
    filename: 'task_icon.png',
    category: 'texture',
    isBinary: true,
    description: 'UI Icon sprite: Sustainable Development Goals circular leaf badge.',
    base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABhUlEQVR4nO3YybHCQAxFUYdBFIRBPmRAgOQE5R1F9aDhaWi3VOXlt/ueFpt/HDU1NTWBc38/P9FnMJ8zUvpEn108muilMbhRt9fjGhCzSOmzBIRFOBXi8uFpIbzDKRBh8Z7hM4it4t0RMsa7IWSOd0HIHt9C2C7eBMF69c9J/VNAxnMmxRagbl8zoVsQHY9ECLn9XswsFIWg2gJ0PGUrOO8w3wINADdsFKhFEAFYxnMBQhBQANQgStgSANIb5QJwEUIAODHUqKUArKcACsAIYIX4QqifwAIAEijU+wsgA8DotBIALlYIAPWWtADcM4UB9A7LBdDcvgjAGoEDEBKvBZgdnAqgjYcBbPk/QcQWjGI5I/22Kh61BVoERLwYALUFEgjttyDxyC0YoaDfCbt9iy3weKDxqyGYxP8DZEWAr/5KCObxmRHc4jMiuMf3ELwhWt93ix8hWEP0vuke7w2RMvx3egfUQozeG93cnNGBezjcv4luJA036jLhrdkymjpbRNbU5J0v6RyyIGxfa8EAAAAASUVORK5CYII=',
  },
  {
    path: 'textures/world/grass_tile.png',
    filename: 'grass_tile.png',
    category: 'texture',
    isBinary: true,
    description: 'World Tile: Lush 64x64 meadow grass texture with organic specks.',
    base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABPklEQVR4nO2asQ1CMQxEMxYFI1AwAAUDUDAJqzAEG7AQ9KGILDt5drjimi/x7zjpRV922uV1/Zye52Xy+h0ex1C/tvLPZ5QK8L7g9r4vDRzt5y6gZ8zKqNcPL6C6VED/oDrTVr+fArJ9F0SfKb2fEKAD0AovgGZ6eQE9o9nOkFFeIUAHoDUsoBrT4QVkZ3p6AbtLBcw2yH6GmAuInslFyzqfEAJ0AFrmArIzPb2AaKZHjM4+Q4QAHYBW241pq1+jZ3LRss4nhAAdgJZ2g94XeGdys/2mF1BdKqB/UJ1pq1/63eBI3vmEEKAD0NJuMDpQtTtDQoAOQEu7QXomZ/WLPlOEAB2AlnaD0QGq3RkSAnQAWtoNWn+QnenpBewmFbAb01a/4W5wpOp3hoQAHYCWdoPeF1S/MyQE6AC0/r6AL7dQsVwpFVSBAAAAAElFTkSuQmCC',
  },
  {
    path: 'textures/world/water_tile.png',
    filename: 'water_tile.png',
    category: 'texture',
    isBinary: true,
    description: 'World Tile: Shimmering 64x64 tropical lagoon water with wave ripples.',
    base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABJ0lEQVR4nO2WsQ3CQBAEvxq6oUEiIgqgElogJkE0ACKw9EJr7MP3txKaYBNL+7t/tnzT9pfrfdLodHiuVe873x7HtyL+yfOWM7+pIp9DUc97XyT4WxlHfpt7K30p9XzrpZe+iqr8tqbUiMtGhjLy/MUB/LsYQOZh6mc1pxGX+SU/ZQDqz7ykzGFsyW9wAByg3woc0JUacdnIUEaezxp0F3ALDsgMhgMCfjhAlIED4ID6fNagu4BbcEBmMBwQ8MMBogwcAAfU57MG3QXcggMyg+GAgB8OEGXgADigPp816C7gFhyQGQwHBPxwgCgDB8AB9fmsQXcBt+CAzGA4IOCHA0QZOAAOqM9nDboLuAUHZAbDAQE/HCDKwAFwQH0+a9BdwC0G4C7g1gusTdZmifQTDgAAAABJRU5ErkJggg==',
  },

  // ================= CONFIG & GUIDES =================
  {
    path: 'project.godot',
    filename: 'project.godot',
    category: 'config',
    description: 'Godot 4 project settings, autoloads, 2.5D viewport dimensions, and input action bindings.',
    code: `; Engine configuration file for Sustainable Geese (ClimateKaz)
; Packaging: Godot 4.x Compatible

config_version=5

[application]
config/name="Sustainable Geese"
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
environment/defaults/default_clear_color=Color(0.2, 0.6, 0.7, 1)
`,
  },
  {
    path: 'export_presets.cfg',
    filename: 'export_presets.cfg',
    category: 'config',
    description: 'Godot 4 export templates configured for Web HTML5, Linux, and Windows.',
    code: `[preset.0]

name="Web"
platform="Web"
runnable=true
advanced_options=false
dedicated_server=false
custom_features=""
export_filter="all_resources"
include_filter=""
exclude_filter=""
export_path="./build/web/index.html"
encryption_include_filters=""
encryption_exclude_filters=""
encrypt_pck=false
encrypt_directory=false

[preset.0.options]

custom_template/debug=""
custom_template/release=""
variant/extensions_support=false
variant/thread_support=false
vram_texture_compression/for_desktop=true
vram_texture_compression/for_mobile=false
html/export_icon=true
html/custom_html_shell=""
html/head_include=""
html/canvas_resize_policy=2
html/focus_canvas_on_start=true
html/experimental_virtual_keyboard=false
progressive_web_app/enabled=false
`,
  },
  {
    path: 'scenes/SetupGuide.md',
    filename: 'SetupGuide.md',
    category: 'doc',
    description: 'Instructions on setting up scenes, attaching scripts, and using the generated textures.',
    code: `# Sustainable Geese (ClimateKaz) Godot 4 Complete Guide

All requested files are included:
- **World Scene**: \`scenes/World.tscn\`
- **Player Scene**: \`scenes/Player.tscn\`
- **Task Manager**: \`scenes/TaskManager.tscn\`
- **UI Scenes**: \`scenes/UI/TaskUI.tscn\`, \`scenes/UI/ScoreUI.tscn\`
- **Textures**: \`textures/player/duck_idle.png\`, \`textures/objects/plastic.png\`, \`textures/objects/wind_turbine.png\`, \`textures/world/grass_tile.png\`, \`textures/world/water_tile.png\`
- **Scripts**: \`GameManager.gd\`, \`Player.gd\`, \`TaskManager.gd\`, \`CityManager.gd\`

### 1. Opening in Godot 4
1. Open Godot Engine 4.x
2. Click **Import** and select the folder containing \`project.godot\`
3. Press **F5** to run! \`scenes/World.tscn\` is configured as the main scene.
`,
  },
];
