extends Node2D

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
