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
}

export type AudioCue =
  | 'plate-on'
  | 'plate-off'
  | 'charge'
  | 'door-open'
  | 'door-close'
  | 'step-player'
  | 'step-echo'

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

  update(frame: AudioFrame): AudioCue[] {
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
    const cues: AudioCue[] = []
    if (frame.plateCount > before.plateCount) cues.push('plate-on')
    if (frame.plateCount < before.plateCount) cues.push('plate-off')
    if (frame.charge >= 1 && before.charge < 1) cues.push('charge')
    if (frame.doorOpen && !before.doorOpen) cues.push('door-open')
    if (!frame.doorOpen && before.doorOpen) cues.push('door-close')
    this.playerFoot = this.footstep(
      this.playerFoot,
      frame.player,
      0.72,
      'step-player',
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
    cues: AudioCue[],
  ): Foot {
    if (!foot) return { ...current, distance: 0 }
    const distance = Math.hypot(current.x - foot.x, current.z - foot.z)
    // Teleports, level switches and malformed replay samples cannot create steps.
    const accumulated = distance < 0.2 ? foot.distance + distance : 0
    if (accumulated >= stride) cues.push(cue)
    return { ...current, distance: accumulated % stride }
  }
}
