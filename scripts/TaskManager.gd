extends Node

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
