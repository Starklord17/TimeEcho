import { describe, expect, it } from 'vitest'
import { AudioEvents, type AudioFrame } from './AudioEvents'

function namedEvents() {
  const events = new AudioEvents()
  return {
    update: (frame: AudioFrame) =>
      events.update(frame).map((event) => event.name),
  }
}

const initial: AudioFrame = {
  sessionId: 1,
  cycle: 1,
  time: 0,
  player: { x: 0, z: 0 },
  echoes: [],
  plateCount: 0,
  charge: 0,
  doorOpen: false,
}

describe('audio cues from simulation', () => {
  it('emits plate, charge and door changes once, then rebaselines on reset', () => {
    const events = namedEvents()
    expect(events.update(initial)).toEqual([])
    expect(
      events.update({ ...initial, time: 1 / 60, plateCount: 1, charge: 0.2 }),
    ).toEqual(['plate-on'])
    expect(
      events.update({
        ...initial,
        time: 2 / 60,
        plateCount: 1,
        charge: 1,
        doorOpen: true,
      }),
    ).toEqual(['charge', 'door-open'])
    expect(
      events.update({
        ...initial,
        time: 3 / 60,
        plateCount: 1,
        charge: 1,
        doorOpen: true,
      }),
    ).toEqual([])
    expect(events.update({ ...initial, cycle: 2, time: 0 })).toEqual([])
    expect(
      events.update({ ...initial, cycle: 2, time: 1 / 60, plateCount: 1 }),
    ).toEqual(['plate-on'])
  })

  it('uses actual travel for steps, including Echo, and ignores pauses and teleports', () => {
    const events = namedEvents()
    events.update({
      ...initial,
      echoes: [{ id: 1, x: 0, z: 0 }],
    })
    const seen: string[] = []
    for (let tick = 1; tick <= 20; tick++) {
      seen.push(
        ...events.update({
          ...initial,
          time: tick / 60,
          player: { x: tick * 0.05, z: 0 },
          echoes: [{ id: 1, x: tick * 0.05, z: 0 }],
        }),
      )
    }
    expect(seen).toEqual(['step-player', 'step-echo'])
    expect(
      events.update({
        ...initial,
        time: 21 / 60,
        player: { x: 1, z: 0 },
        echoes: [{ id: 1, x: 1, z: 0 }],
      }),
    ).toEqual([])
    expect(
      events.update({
        ...initial,
        time: 22 / 60,
        player: { x: 7, z: 0 },
        echoes: [{ id: 1, x: 7, z: 0 }],
      }),
    ).toEqual([])
    expect(
      events.update({
        ...initial,
        sessionId: 2,
        time: 0,
        player: { x: 0, z: 0 },
        echoes: [],
      }),
    ).toEqual([])
  })
})

it('tracks individual devices even when total occupancy stays equal', () => {
  const events = new AudioEvents()
  const plates = [
    { id: 'a', active: true },
    { id: 'b', active: false },
  ]
  const doors = [
    { id: 'one', open: false },
    { id: 'two', open: false },
  ]
  events.update({ ...initial, plates, doors, plateCount: 1 })
  const changed = {
    ...initial,
    time: 1 / 60,
    plateCount: 1,
    plates: [
      { id: 'a', active: false },
      { id: 'b', active: true },
    ],
    doors: doors.map((door) => ({ ...door, open: true })),
  }
  expect(events.update(changed)).toEqual([
    { name: 'plate-off', source: 'plate:a' },
    { name: 'plate-on', source: 'plate:b' },
    { name: 'door-open', source: 'door:one' },
    { name: 'door-open', source: 'door:two' },
  ])
  expect(events.update({ ...changed, time: 2 / 60 })).toEqual([])
  events.reset()
  expect(events.update(changed)).toEqual([])
})
