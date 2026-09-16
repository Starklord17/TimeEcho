# Test fixtures

`door-contract.glb` is a minimal generated asset used to test the real GLB loader
and the expected hierarchy and scale. It is neither a Blender source nor a
production asset, and the game never serves it during normal play. Its frame and
light geometry do not represent final art. Tests load it with the real GLTFLoader,
without decoders or network access.
