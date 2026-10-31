extends CharacterBody2D

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
