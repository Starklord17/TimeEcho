"""Export the approved room geometry and reusable props without physics or lights.

Run build_environment.py first, then this script using Blender --background.
The source scenes remain editable; only selected mesh hierarchies are exported.
"""
import bpy
import json
import argparse
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[2]
OUT = BASE / 'public/models/environment'
parser = argparse.ArgumentParser()
parser.add_argument('--level', choices=['empty-room', 'split-signal', 'convergence', 'reversal'])
args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
if args.level == 'reversal':
    review = BASE/'docs/phase-11-review/art/milestone-reviews.json'
    if not review.exists() or json.loads(review.read_text())['form']['status'] != 'approved':
        raise SystemExit('Reversal requires explicit Form approval before export.')
OUT.mkdir(parents=True, exist_ok=True)


def export(scene_name, names, target):
    scene = bpy.data.scenes[scene_name]
    bpy.context.window.scene = scene
    bpy.ops.object.select_all(action='DESELECT')
    for name in names:
        matches = [o for o in scene.objects if o.name == name or o.name.startswith(name+'.')]
        assert len(matches) == 1, (scene_name, name, matches)
        obj = matches[0]
        obj.name = name
        for child in [obj, *obj.children_recursive]:
            child.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT / target), export_format='GLB',
        use_selection=True, use_active_scene=True, export_yup=True, export_animations=False,
        export_cameras=False, export_lights=False, export_texcoords=False,
        export_extras=False, export_apply=True)


if args.level is None:
    bpy.ops.wm.open_mainfile(filepath=str(BASE/'assets/blender/door.blend'))
    export('Asset_Door', ['Door_Root'], 'door.glb')
    bpy.ops.wm.open_mainfile(filepath=str(BASE/'assets/blender/environment-kit.blend'))
    export('Asset_Plate', ['Plate_Root'], 'plate.glb')
for level in ([args.level] if args.level else ['empty-room', 'split-signal', 'convergence']):
    phase = 'phase-11-review' if level == 'reversal' else 'phase-9-review'
    bpy.ops.wm.open_mainfile(filepath=str(BASE/f'docs/{phase}/form/{level}.blend'))
    export('Level_'+level, ['Environment_Static'], level+'.glb')
print(json.dumps({p.name:p.stat().st_size for p in OUT.glob('*.glb')}, indent=2))
