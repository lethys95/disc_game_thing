extends Node3D
## The engine bake-off scene (spikes/engine/README.md): a forest clearing, sky light, a soldier aiming off to the side.

const GRASS_COUNT := 60000
const GRASS_RADIUS := 16.0
const TREES := ["tree-1", "tree-2", "tree-3", "tree-4"]
const UNDERGROWTH := ["bush-1", "bush-2", "rock-1", "rock-2"]

var shot_path := ""
var shot_at := 1.5
var view := "wide"

## The same deterministic stream as the three.js scene, so both place everything alike.
class Stream:
	var s := 0
	func _init(seed: int) -> void:
		s = seed
	func next() -> float:
		s = (s * 1664525 + 1013904223) % 4294967296
		return s / 4294967296.0

func _ready() -> void:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--shot="):
			shot_path = arg.substr(7)
		elif arg.begins_with("--at="):
			shot_at = float(arg.substr(5))
		elif arg.begins_with("--view="):
			view = arg.substr(7)
	environment()
	ground()
	grass()
	forest()
	var target := soldier(Vector3(-5.2, 0, 3.0), Vector3(0, 0, 0))
	var aimer := soldier(Vector3.ZERO, Vector3(0, 0, 10))
	var modifier := AimModifier.new()
	modifier.target = target.get_node("Aim")
	modifier.facing = Vector3(0, 0, 1)
	aimer.find_children("*", "Skeleton3D", true, false)[0].add_child(modifier)
	var cam := Camera3D.new()
	cam.fov = 50
	add_child(cam)
	if view == "close":
		cam.position = Vector3(0.6, 1.9, 3.2)
		cam.look_at(Vector3(-0.6, 1.1, 0))
	else:
		cam.position = Vector3(3.6, 3.0, 7.4)
		cam.look_at(Vector3(-1.4, 1.0, 1.0))
	if OS.get_cmdline_user_args().has("--measure"):
		await get_tree().create_timer(2.0).timeout
		var start := Time.get_ticks_msec()
		var frames := Engine.get_frames_drawn()
		await get_tree().create_timer(5.0).timeout
		print("shot: measure %.1f fps" % [(Engine.get_frames_drawn() - frames) * 1000.0 / (Time.get_ticks_msec() - start)])
		get_tree().quit()
	if shot_path != "":
		await get_tree().create_timer(shot_at).timeout
		await RenderingServer.frame_post_draw
		get_viewport().get_texture().get_image().save_png(shot_path)
		print("shot: ", shot_path)
		get_tree().quit()

func environment() -> void:
	var sky_material := PanoramaSkyMaterial.new()
	sky_material.panorama = load("res://assets/sky/map.webp")
	var sky := Sky.new()
	sky.sky_material = sky_material
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_AGX
	env.ssao_enabled = true
	var lite := OS.get_cmdline_user_args().has("--no-gi")
	env.ssil_enabled = not lite
	env.sdfgi_enabled = not lite
	env.glow_enabled = true
	env.glow_intensity = 0.4
	env.fog_enabled = true
	env.fog_light_color = Color(0.62, 0.68, 0.72)
	env.fog_density = 0.012
	env.fog_sky_affect = 0.2
	var world := WorldEnvironment.new()
	world.environment = env
	add_child(world)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-38, -35, 0)
	sun.light_energy = 1.6
	sun.light_color = Color(1.0, 0.94, 0.84)
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 40.0
	add_child(sun)

func ground() -> void:
	var plane := PlaneMesh.new()
	plane.size = Vector2(400, 400)
	var material := StandardMaterial3D.new()
	material.albedo_texture = load("res://assets/ground/forest-1.webp")
	material.uv1_scale = Vector3(80, 80, 1)
	material.roughness = 1.0
	var mesh := MeshInstance3D.new()
	mesh.mesh = plane
	mesh.material_override = material
	add_child(mesh)

func blade() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var rows := [[0.0, 0.05], [0.35, 0.04], [0.7, 0.025], [1.0, 0.0]]
	for i in rows.size() - 1:
		var a: Array = rows[i]
		var b: Array = rows[i + 1]
		var quad := [Vector3(-a[1], a[0], 0), Vector3(a[1], a[0], 0), Vector3(b[1], b[0], 0), Vector3(-b[1], b[0], 0)]
		for index in [0, 1, 2, 0, 2, 3]:
			st.set_normal(Vector3(0, 0.6, 1).normalized())
			st.set_uv(Vector2(0, quad[index].y))
			st.add_vertex(quad[index])
	return st.commit()

func grass() -> void:
	var multimesh := MultiMesh.new()
	multimesh.transform_format = MultiMesh.TRANSFORM_3D
	multimesh.use_custom_data = true
	multimesh.mesh = blade()
	multimesh.instance_count = GRASS_COUNT
	var random := Stream.new(7)
	for i in GRASS_COUNT:
		var r := GRASS_RADIUS * sqrt(random.next())
		var a := random.next() * TAU
		var p := Vector3(cos(a) * r, 0, sin(a) * r)
		var height := (0.12 + random.next() * 0.2) * (0.4 if p.length() < 1.2 else 1.0)
		var tilt := (random.next() - 0.5) * 0.4
		var basis := Basis.from_euler(Vector3(tilt, random.next() * TAU, 0), EULER_ORDER_YXZ) * Basis.from_scale(Vector3(1, height, 1))
		multimesh.set_instance_transform(i, Transform3D(basis, p))
		multimesh.set_instance_custom_data(i, Color(random.next(), 0, 0, 0))
	var material := ShaderMaterial.new()
	material.shader = load("res://grass.gdshader")
	var node := MultiMeshInstance3D.new()
	node.multimesh = multimesh
	node.material_override = material
	node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(node)

func forest() -> void:
	var random := Stream.new(11)
	for i in 34:
		place(random, TREES[i % TREES.size()], 7.0 + random.next() * 15.0, 4.0 + random.next() * 2.5)
	for i in 26:
		place(random, UNDERGROWTH[i % UNDERGROWTH.size()], 3.5 + random.next() * 10.5, 0.5 + random.next() * 0.7)

## Draws in the three.js scene's order: radius and height (the caller), then angle and turn.
func place(random: Stream, slot: String, r: float, height: float) -> void:
	var a := random.next() * TAU
	prop(slot, Vector3(cos(a) * r, 0, sin(a) * r), height, random.next() * TAU)

## A generated prop, fitted to a height, standing on the ground, swaying with the wind.
func prop(slot: String, at: Vector3, height: float, turn: float) -> void:
	var folder := "terrain"
	var scene: PackedScene = load("res://assets/models/%s/%s.glb" % [folder, slot])
	var node := scene.instantiate() as Node3D
	add_child(node)
	var meshes := node.find_children("*", "MeshInstance3D", true, false)
	var box := AABB()
	for m in meshes:
		var mesh := m as MeshInstance3D
		var local := mesh.transform * mesh.mesh.get_aabb()
		box = local if box.size == Vector3.ZERO else box.merge(local)
	var s := height / box.size.y
	node.scale = Vector3.ONE * s
	node.rotation.y = turn
	node.position = at - Vector3(0, box.position.y * s + 0.05 * height, 0)
	for m in meshes:
		var mesh := m as MeshInstance3D
		for surface in mesh.mesh.get_surface_count():
			var original := mesh.mesh.surface_get_material(surface) as BaseMaterial3D
			var sway := ShaderMaterial.new()
			sway.shader = load("res://sway.gdshader")
			sway.set_shader_parameter("albedo", original.albedo_texture if original else null)
			sway.set_shader_parameter("base_y", box.position.y)
			sway.set_shader_parameter("height", box.size.y)
			sway.set_shader_parameter("strength", 0.06 if slot.begins_with("tree") else (0.03 if slot.begins_with("bush") else 0.0))
			mesh.set_surface_override_material(surface, sway)

func soldier(at: Vector3, facing: Vector3) -> Node3D:
	var node := (load("res://assets/shared/Soldier.glb") as PackedScene).instantiate() as Node3D
	add_child(node)
	node.position = at
	var dir := facing - at
	node.rotation.y = atan2(dir.x, dir.z) + PI
	var player := node.find_children("*", "AnimationPlayer", true, false)[0] as AnimationPlayer
	player.get_animation("Idle").loop_mode = Animation.LOOP_LINEAR
	player.play("Idle")
	var aim := Marker3D.new()
	aim.name = "Aim"
	aim.position = Vector3(0, 1.4, 0)
	node.add_child(aim)
	return node
