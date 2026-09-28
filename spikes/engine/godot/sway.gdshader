shader_type spatial;

uniform sampler2D albedo : source_color;
uniform float base_y = 0.0;
uniform float height = 1.0;
uniform float strength = 0.05;

void vertex() {
	vec3 world = (MODEL_MATRIX * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
	float h = clamp((VERTEX.y - base_y) / height, 0.0, 1.0);
	float s = sin(TIME * 1.2 + world.x * 0.3 + world.z * 0.2) * strength * height * h * h;
	VERTEX.x += s;
	VERTEX.z += s * 0.5;
}

void fragment() {
	ALBEDO = texture(albedo, UV).rgb;
	ROUGHNESS = 0.9;
}
