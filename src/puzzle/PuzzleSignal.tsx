export function PuzzleSignal({
  index = 0,
  active,
}: {
  index?: number
  active: boolean
}) {
  return (
    <mesh
      rotation={[0, 0, index === 0 ? Math.PI / 2 : 0]}
      scale={active ? 1.12 : 1}
    >
      <ringGeometry
        args={[
          0.173,
          0.227,
          index === 0 ? 3 : index === 1 ? 32 : index === 2 ? 4 : 6,
        ]}
      />
      <meshBasicMaterial color={active ? '#d9fbff' : '#727d83'} />
    </mesh>
  )
}
