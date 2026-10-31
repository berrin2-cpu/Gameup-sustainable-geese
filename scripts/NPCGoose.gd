# NPCGoose.gd - Professor Barnaby (Elder Goose)
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
	
	# Add to interactable group so player input detects us
	add_to_group("interactables")
	add_to_group("npcs")

func _on_body_entered(body: Node2D) -> void:
	if body is CharacterBody2D or body.name == "Player":
		is_player_nearby = true
		player_approached.emit()
		_show_talk_prompt(true)

func _on_body_exited(body: Node2D) -> void:
	if body is CharacterBody2D or body.name == "Player":
		is_player_nearby = false
		player_exited.emit()
		_show_talk_prompt(false)

func _show_talk_prompt(visible: bool) -> void:
	if has_node("TalkPrompt"):
		get_node("TalkPrompt").visible = visible

func interact() -> void:
	if not is_player_nearby:
		return
	
	dialogue_opened.emit(conversation_topics)
	
	if not has_boost_been_granted:
		has_boost_been_granted = true
		efficiency_boost_granted.emit(efficiency_multiplier)
		print("[Professor Barnaby] Granted +25% efficiency bonus to Player!")

func get_all_topics() -> Array[Dictionary]:
	return conversation_topics

func get_efficiency_advice(topic_id: String) -> Dictionary:
	for t in conversation_topics:
		if t["id"] == topic_id:
			return t
	return conversation_topics[0]
