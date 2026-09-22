"""Deterministic, original Time Echo sound design. Requires only Python stdlib."""

from math import cos, exp, pi, sin, tanh
from pathlib import Path
import random
import struct
import wave

RATE = 24000
OUT = Path(__file__).resolve().parents[1] / "public" / "audio"
OUT.mkdir(parents=True, exist_ok=True)


def save(name, seconds, sound):
    count = round(seconds * RATE)
    samples = bytearray()
    for index in range(count):
        value = max(-0.95, min(0.95, sound(index / RATE, index)))
        samples.extend(struct.pack("<h", round(value * 32767)))
    with wave.open(str(OUT / f"{name}.wav"), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(samples)


def pad(root, variant):
    # Frequencies and modulation are whole cycles in 12 seconds: seamless PCM loop.
    notes = (root, root * 1.5, root * 2, root * 2.5)

    def sample(t, _index):
        breath = 0.72 + 0.18 * cos(2 * pi * t / 12 + variant)
        slow = 0.82 + 0.12 * cos(2 * pi * t / 6)
        waves = sum(
            (0.7 / (number + 1))
            * sin(2 * pi * frequency * t + variant * number)
            for number, frequency in enumerate(notes)
        )
        shimmer = 0.06 * sin(2 * pi * root * 4 * t) * (1 - cos(2 * pi * t / 3))
        return tanh((waves * breath * slow + shimmer) * 0.21)

    return sample


save("empty-room", 12, pad(55, 0.2))
save("split-signal", 12, pad(50, 1.1))
save("convergence", 12, pad(45, 2.2))


def tension(t, _index):
    pulse = max(0, sin(2 * pi * t / 3)) ** 5
    motion = 0.5 + 0.5 * cos(2 * pi * t / 12)
    return 0.13 * pulse * sin(2 * pi * 165 * t) + 0.055 * motion * sin(
        2 * pi * 110 * t
    )


save("tension", 12, tension)


def tone(start, end, seconds, volume=0.32, noise=0.0, seed=0):
    rng = random.Random(seed)
    last_noise = 0.0
    phase = 0.0

    def sample(t, _index):
        nonlocal last_noise, phase
        phase += 2 * pi * (start + (end - start) * t / seconds) / RATE
        attack = min(1.0, t / 0.012)
        release = max(0.0, 1 - t / seconds) ** 2
        last_noise = last_noise * 0.82 + rng.uniform(-1, 1) * 0.18
        return volume * attack * release * (
            0.78 * sin(phase) + 0.22 * sin(phase * 2) + noise * last_noise
        )

    return sample


save("plate-on", 0.22, tone(330, 440, 0.22, seed=1))
save("plate-off", 0.18, tone(310, 220, 0.18, 0.23, seed=2))
save("charge", 0.38, tone(440, 660, 0.38, 0.25, seed=3))
save("door-open", 0.62, tone(95, 180, 0.62, 0.42, 0.5, 4))
save("door-close", 0.48, tone(150, 75, 0.48, 0.36, 0.5, 5))
save("cycle", 0.75, tone(260, 60, 0.75, 0.39, 0.35, 6))
save("echo", 0.6, tone(180, 340, 0.6, 0.22, 0.18, 7))


def victory(t, _index):
    """A restrained A-minor/add-nine resolve, with short synthetic reflections."""
    notes = (
        (0.00, 220.00, 0.18),  # A3: familiar low pulse
        (0.24, 261.63, 0.17),  # C4
        (0.48, 329.63, 0.17),  # E4
        (0.76, 493.88, 0.15),  # B4: a little unresolved air
        (1.08, 440.00, 0.17),  # A4: final resting note
    )

    def voice(age, frequency):
        if age < 0:
            return 0.0
        envelope = (1 - exp(-age * 95)) * exp(-age * 2.3)
        phase = 2 * pi * frequency * age
        return envelope * (
            0.72 * sin(phase)
            + 0.21 * sin(phase * 2 + 0.12)
            + 0.07 * sin(phase * 3 + 0.4)
        )

    phrase = sum(
        volume * (voice(t - start, frequency) + 0.22 * voice(t - start - 0.19, frequency))
        for start, frequency, volume in notes
    )
    # A quiet foundation lets the resolution feel earned without a loud fanfare.
    foundation = 0.065 * (1 - exp(-max(t - 0.36, 0) * 9)) * exp(
        -max(t - 0.7, 0) * 1.7
    ) * (sin(2 * pi * 110 * t) + 0.3 * sin(2 * pi * 165 * t))
    tail = min(1.0, max(0.0, (3.1 - t) / 0.28))
    return (phrase + foundation) * tail


save("victory", 3.1, victory)
save("step-player", 0.14, tone(115, 58, 0.14, 0.22, 1.2, 9))
save("step-echo", 0.16, tone(215, 125, 0.16, 0.13, 0.4, 10))

print(f"Generated {len(list(OUT.glob('*.wav')))} original audio files in {OUT}")
