class_name AimModifier
extends SkeletonModifier3D
## Turns the upper body toward a target after the animation has posed it: the yaw is shared along the spine, so the
## hips and feet keep the animation's pose.

@export var target: Node3D
## Where the body faces at rest, in world space.
@export var facing := Vector3.FORWARD
const CHAIN := ["mixamorig_Spine", "mixamorig_Spine1", "mixamorig_Spine2", "mixamorig_Neck", "mixamorig_Head"]
const SHARE := [0.2, 0.25, 0.25, 0.15, 0.15]

func _process_modification() -> void:
	var skeleton := get_skeleton()
	if skeleton == null or target == null:
		return
	var to_target := target.global_position - skeleton.global_position
	to_target.y = 0
	var yaw := Vector3(facing.x, 0, facing.z).signed_angle_to(to_target, Vector3.UP)
	var up := (skeleton.global_basis.inverse() * Vector3.UP).normalized()
	for i in CHAIN.size():
		var bone := skeleton.find_bone(CHAIN[i])
		var pose := skeleton.get_bone_global_pose(bone)
		skeleton.set_bone_global_pose(bone, Transform3D(Basis(up, yaw * SHARE[i]) * pose.basis, pose.origin))
