extends Node3D
## The bake-off's second scene (spikes/engine/README.md): a cave lit by a bonfire, moonlight through a hole in the roof.
## Godot's own tools: SDFGI (bounce light), volumetric fog (light shafts), GPU particles (the flames), glow.

const FIRE := Vector3.ZERO

var fire: OmniLight3D
var embers: StandardMaterial3D
var t := 0.0

func _ready() -> void:
	var shot_path := ""
	var shot_at := 1.5
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--shot="):
			shot_path = arg.substr(7)
		elif arg.begins_with("--at="):
			shot_at = float(arg.substr(5))
	environment()
	add_child((load("res://assets/shared/cave.glb") as PackedScene).instantiate())
	bonfire()
	var target := soldier(Vector3(2.2, 0, -1.2), FIRE)
	var aimer := soldier(Vector3(-1.6, 0, 1.2), Vector3(-1.6, 0, 10))
	var modifier := AimModifier.new()
	modifier.target = target.get_node("Aim")
	modifier.facing = Vector3(0, 0, 1)
	aimer.find_children("*", "Skeleton3D", true, false)[0].add_child(modifier)
	var cam := Camera3D.new()
	cam.fov = 55
	add_child(cam)
	cam.position = Vector3(-3.8, 1.7, 5.2)
	cam.look_at(Vector3(0.4, 1.0, -0.2))
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

func _process(delta: float) -> void:
	t += delta
	var f := 1.0 + 0.12 * sin(t * 13.1) + 0.08 * sin(t * 7.3 + 1.3) + 0.05 * sin(t * 23.7 + 0.4)
	fire.light_energy = 4.0 * f
	fire.position = Vector3(FIRE.x + 0.04 * sin(t * 5.1), 1.3 + 0.05 * sin(t * 8.3), FIRE.z + 0.04 * cos(t * 4.7))
	embers.emission_energy_multiplier = 6.0 * f

func environment() -> void:
	var sky_material := PanoramaSkyMaterial.new()
	sky_material.panorama = load("res://assets/sky/map.webp")
	sky_material.energy_multiplier = 0.35
	var sky := Sky.new()
	sky.sky_material = sky_material
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color.BLACK
	env.reflected_light_source = Environment.REFLECTION_SOURCE_DISABLED
	env.tonemap_mode = Environment.TONE_MAPPER_AGX
	env.tonemap_exposure = 1.1
	env.ssao_enabled = true
	env.sdfgi_enabled = not OS.get_cmdline_user_args().has("--no-gi")
	env.sdfgi_use_occlusion = true
	env.glow_enabled = true
	env.glow_intensity = 0.7
	env.glow_hdr_threshold = 0.75
	env.volumetric_fog_enabled = true
	env.volumetric_fog_density = 0.03
	env.volumetric_fog_albedo = Color(0.35, 0.3, 0.27)
	var world := WorldEnvironment.new()
	world.environment = env
	add_child(world)
	var moon := DirectionalLight3D.new()
	moon.light_color = Color(0.62, 0.72, 1.0)
	moon.light_energy = 1.2
	moon.shadow_enabled = true
	moon.light_volumetric_fog_energy = 3.0
	add_child(moon)
	moon.look_at_from_position(Vector3(3.3, 12, 2.0), Vector3(1.8, 0, 1.0))

func bonfire() -> void:
	fire = OmniLight3D.new()
	fire.light_color = Color(1.0, 0.55, 0.22)
	fire.omni_range = 14.0
	fire.shadow_enabled = true
	fire.light_volumetric_fog_energy = 0.6
	add_child(fire)
	embers = StandardMaterial3D.new()
	embers.albedo_color = Color.BLACK
	embers.emission_enabled = true
	embers.emission = Color(1.0, 0.35, 0.08)
	var coals := MeshInstance3D.new()
	var sphere := SphereMesh.new()
	sphere.radius = 0.22
	sphere.height = 0.44
	coals.mesh = sphere
	coals.material_override = embers
	coals.scale = Vector3(1, 0.35, 1)
	coals.position = FIRE + Vector3(0, 0.08, 0)
	add_child(coals)
	var flames := GPUParticles3D.new()
	flames.amount = 70
	flames.lifetime = 0.9
	flames.position = FIRE + Vector3(0, 0.25, 0)
	var process := ParticleProcessMaterial.new()
	process.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
	process.emission_sphere_radius = 0.2
	process.direction = Vector3.UP
	process.spread = 12.0
	process.initial_velocity_min = 0.9
	process.initial_velocity_max = 1.4
	process.gravity = Vector3.ZERO
	process.scale_min = 0.8
	process.scale_max = 1.1
	var shrink := Curve.new()
	shrink.add_point(Vector2(0, 1))
	shrink.add_point(Vector2(1, 0.25))
	process.scale_curve = CurveTexture.new()
	(process.scale_curve as CurveTexture).curve = shrink
	var ramp := Gradient.new()
	ramp.set_color(0, Color(1.0, 0.75, 0.3, 1.0))
	ramp.set_color(1, Color(0.9, 0.18, 0.03, 0.0))
	process.color_ramp = GradientTexture1D.new()
	(process.color_ramp as GradientTexture1D).gradient = ramp
	flames.process_material = process
	var quad := QuadMesh.new()
	quad.size = Vector2(0.55, 0.55)
	var look := StandardMaterial3D.new()
	look.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	look.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	look.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	look.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	look.vertex_color_use_as_albedo = true
	look.albedo_color = Color(2.2, 2.2, 2.2)
	var glow := GradientTexture2D.new()
	glow.fill = GradientTexture2D.FILL_RADIAL
	glow.fill_from = Vector2(0.5, 0.5)
	glow.fill_to = Vector2(1.0, 0.5)
	var falloff := Gradient.new()
	falloff.set_color(0, Color(1, 1, 1, 1))
	falloff.set_color(1, Color(1, 1, 1, 0))
	glow.gradient = falloff
	look.albedo_texture = glow
	quad.material = look
	flames.draw_pass_1 = quad
	add_child(flames)

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
