export type AudioPosition = { x: number; z: number }
export type AudioEcho = AudioPosition & { id: number }
export type AudioFrame = {
  sessionId: number
  cycle: number
  time: number
  player: AudioPosition
  echoes: AudioEcho[]
  plateCount: number
  charge: number
  doorOpen: boolean
  plates?: readonly { id: string; active: boolean }[]
  doors?: readonly { id: string; open: boolean }[]
}

export type AudioCue =
  | 'plate-on'
  | 'plate-off'
  | 'charge'
  | 'door-open'
  | 'door-close'
  | 'step-player'
  | 'step-echo'

export type AudioEvent = { name: AudioCue; source: string }

type Foot = AudioPosition & { distance: number }

/** Derives cues only from successive, authoritative simulation frames. */
export class AudioEvents {
  private previous: AudioFrame | null = null
  private playerFoot: Foot | null = null
  private echoFeet = new Map<number, Foot>()

  reset() {
    this.previous = null
    this.playerFoot = null
    this.echoFeet.clear()
  }

  update(frame: AudioFrame): AudioEvent[] {
    const before = this.previous
    this.previous = frame
    if (
      !before ||
      frame.sessionId !== before.sessionId ||
      frame.cycle !== before.cycle ||
      frame.time <= before.time
    ) {
      this.playerFoot = { ...frame.player, distance: 0 }
      this.echoFeet = new Map(
        frame.echoes.map((echo) => [echo.id, { ...echo, distance: 0 }]),
      )
      return []
    }
    const cues: AudioEvent[] = []
    if (frame.plates && before.plates) {
      for (const plate of frame.plates) {
        const old = before.plates.find((entry) => entry.id === plate.id)
        if (old && old.active !== plate.active)
          cues.push({
            name: plate.active ? 'plate-on' : 'plate-off',
            source: `plate:${plate.id}`,
          })
      }
    } else {
      if (frame.plateCount > before.plateCount)
        cues.push({ name: 'plate-on', source: 'plates' })
      if (frame.plateCount < before.plateCount)
        cues.push({ name: 'plate-off', source: 'plates' })
    }
    if (frame.charge >= 1 && before.charge < 1)
      cues.push({ name: 'charge', source: 'charge' })
    const doors = frame.doors ?? [{ id: 'exit', open: frame.doorOpen }]
    const oldDoors = before.doors ?? [{ id: 'exit', open: before.doorOpen }]
    for (const door of doors) {
      const old = oldDoors.find((entry) => entry.id === door.id)
      if (old && old.open !== door.open)
        cues.push({
          name: door.open ? 'door-open' : 'door-close',
          source: `door:${door.id}`,
        })
    }
    this.playerFoot = this.footstep(
      this.playerFoot,
      frame.player,
      0.72,
      'step-player',
      'player',
      cues,
    )
    const active = new Set<number>()
    for (const echo of frame.echoes) {
      active.add(echo.id)
      this.echoFeet.set(
        echo.id,
        this.footstep(
          this.echoFeet.get(echo.id) ?? null,
          echo,
          0.85,
          'step-echo',
          `echo:${echo.id}`,
          cues,
        ),
      )
    }
    for (const id of this.echoFeet.keys())
      if (!active.has(id)) this.echoFeet.delete(id)
    return cues
  }

  private footstep(
    foot: Foot | null,
    current: AudioPosition,
    stride: number,
    cue: AudioCue,
    source: string,
    cues: AudioEvent[],
  ): Foot {
    if (!foot) return { ...current, distance: 0 }
    const distance = Math.hypot(current.x - foot.x, current.z - foot.z)
    // Teleports, level switches and malformed replay samples cannot create steps.
    const accumulated = distance < 0.2 ? foot.distance + distance : 0
    if (accumulated >= stride) cues.push({ name: cue, source })
    return { ...current, distance: accumulated % stride }
  }
}
