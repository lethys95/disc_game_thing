shader_type spatial;
render_mode cull_disabled;

uniform vec3 base_color : source_color = vec3(0.10, 0.20, 0.05);
uniform vec3 tip_color : source_color = vec3(0.45, 0.58, 0.22);

varying float tip;
varying float variety;

void vertex() {
	vec3 world = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	tip = UV.y;
	variety = INSTANCE_CUSTOM.r;
	float gust = sin(TIME * 1.7 + world.x * 0.35 + world.z * 0.2) * 0.5 + 0.5;
	float flutter = sin(TIME * 4.3 + INSTANCE_CUSTOM.r * 6.28);
	float bend = (gust * 0.18 + flutter * 0.03) * tip * tip;
	VERTEX += (inverse(mat3(MODEL_MATRIX)) * vec3(bend, 0.0, bend * 0.4));
}

void fragment() {
	ALBEDO = mix(base_color, tip_color, tip) * (0.8 + 0.4 * fract(variety * 13.0));
	ROUGHNESS = 0.85;
	SPECULAR = 0.2;
	BACKLIGHT = vec3(0.25, 0.35, 0.1);
}
