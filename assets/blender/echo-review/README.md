# Echo inspection assets

Run `pnpm dev` and open `/echo-review.html` for the puzzle fixture and the
side-by-side Idle/Walk comparison. Controls include pause, restart, animation time,
look orientation, light/dark backgrounds and procedural comparison.

Current Blender views: `glasses-{light|dark}-{front|three-quarter|profile|back}.png`.
`walk-three-quarter.png` shows a Walk pose. Current browser captures use the
`runtime-motion-` prefix. Unprefixed images show the previous static model.

`metrics.json` contains source measurements. Commands and the character contract
are in [ECHO_SPEC.md](../ECHO_SPEC.md). The real GLB is checked by
`src/echo/echoAsset.test.ts`; fixture captures do not replace a complete manual
acceptance playthrough.

Generic room schemas are retained for workflow compatibility. Room gates are
not certified for this character: floor plans and room layouts do not apply.
Artistic acceptance of this revision remains pending.

Neck correction: `neck-before-*` and `neck-after-*` use identical Blender cameras
and poses. `runtime-neck-before.png` and `runtime-neck-after.png` show the same
runtime view at replay time 0.2 s. Use **Neck close-up** in the comparison scene.

The final collar and lower-head opacity revision uses `neck-sealed-*` Blender
renders and `runtime-neck-v2-*` browser captures. Earlier neck images retain
the intermediate versions for comparison.
