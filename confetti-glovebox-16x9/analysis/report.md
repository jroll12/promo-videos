# Phase 0 report: timing and alignment confidence

## Tempo and grid

- Measured tempo: **140.001 BPM** (brief says 140; deviation 0.000 %, limit 1.0 %).
- Beat fit residual: 9.34 ms RMS, worst kept beat 36.39 ms. Mean residual first quarter -0.47 ms, last quarter -0.88 ms: no drift.
- Grid: beat 0.428570 s, bar 1.7143 s, bar 0 downbeat at 0.458 s. 381 beats, 95 bars, 4897 frames.

## Sections

| section | bars | start bar | start s | end s | frames |
|---|---|---|---|---|---|
| intro | 4 | 0 | 0.00 | 7.32 | 0..219 |
| verse1 | 16 | 4 | 7.32 | 34.74 | 219..1042 |
| hook1 | 10 | 20 | 34.74 | 51.89 | 1042..1557 |
| verse2 | 16 | 30 | 51.89 | 79.32 | 1557..2379 |
| prehook | 4 | 46 | 79.32 | 86.17 | 2379..2585 |
| hook2 | 10 | 50 | 86.17 | 103.32 | 2585..3099 |
| bridge | 8 | 60 | 103.32 | 117.03 | 3099..3511 |
| verse3 | 12 | 68 | 117.03 | 137.60 | 3511..4128 |
| hook3 | 8 | 80 | 137.60 | 151.31 | 4128..4539 |
| outro | 7 | 88 | 151.31 | 163.24 | 4539..4897 |

## Lines

Threshold: word probability >= 0.6, words confirmed by the lyric-free pass >= 70 %, start within 1.0 beat of its bars, length <= 1.5x its bars.
**77 of 89 lines pass. 12 fall back to bar-grid timing.**

| id | prob | heard | start s | grid s | beat in bar | passes A-B | source | flags | text |
|---|---|---|---|---|---|---|---|---|---|
| **in.01** | 0.17 | 100 % | 0.34 | 0.46 | 4.72 | +0.00 | grid | low-probability | Okay. |
| **in.02** | 0.41 | 100 % | 2.38 | 2.17 | 1.48 | -1.06 | grid | low-probability, passes-disagree | Yeah. |
| in.03 | 0.83 | 100 % | 3.92 | 3.89 | 1.08 | +0.00 | aligned | ok | Where do I even put this? |
| in.04 | 0.84 | 100 % | 4.86 | 4.74 | 3.27 | +0.04 | aligned | ok | Right here? |
| **in.05** | 0.45 | 100 % | 5.90 | 6.03 | 1.70 | +0.14 | grid | low-probability | Cool. |
| v1.01 | 0.69 | 100 % | 7.02 | 7.32 | 4.31 | -0.45 | aligned | passes-disagree | I got confetti in the glovebox, waffles in a windstorm, |
| v1.02 | 0.67 | 90 % | 9.12 | 9.03 | 1.21 | +0.00 | aligned | ok | Left shoe talking like it’s asking what the socks for, |
| **v1.03** | 0.84 | 67 % | 10.82 | 10.74 | 1.18 | -0.02 | grid | not-heard-by-free-pass | Microwave beeped and it sounded like a trap door, |
| v1.04 | 0.75 | 78 % | 12.50 | 12.46 | 1.10 | +0.02 | aligned | ok | Opened up the fridge, saw a pickle doing parkour. |
| v1.05 | 0.76 | 89 % | 14.16 | 14.17 | 4.97 | +0.00 | aligned | ok | Hold up, wait, I’m not done with the nonsense, |
| v1.06 | 0.73 | 86 % | 15.96 | 15.89 | 1.17 | -0.06 | aligned | ok | Brain got tabs like a discount conference, |
| v1.07 | 0.70 | 100 % | 17.70 | 17.60 | 1.23 | -0.02 | aligned | ok | One says taxes, one says tacos, |
| v1.08 | 0.87 | 100 % | 19.22 | 19.32 | 4.78 | +0.00 | aligned | ok | One says build a little boat out of Costco boxes. |
| v1.09 | 0.82 | 100 % | 21.30 | 21.03 | 1.63 | +0.00 | aligned | ok | I don’t need a cape, I got cargo shorts, |
| v1.10 | 0.77 | 100 % | 23.00 | 22.74 | 1.60 | +0.00 | aligned | ok | I don’t play golf, but I’m yelling “fore” |
| v1.11 | 0.61 | 75 % | 24.46 | 24.46 | 1.00 | +0.00 | aligned | ok | At a shopping cart drifting through aisle four, |
| v1.12 | 0.78 | 100 % | 25.98 | 26.17 | 4.55 | +0.02 | aligned | ok | Like it’s Formula One at the grocery store. |
| v1.13 | 0.74 | 86 % | 27.88 | 27.89 | 4.98 | +0.00 | aligned | ok | Wallet got receipts from a month ago, |
| v1.14 | 0.79 | 100 % | 29.44 | 29.60 | 4.62 | -0.04 | aligned | ok | Crumbs in the car doing dominoes, |
| v1.15 | 0.66 | 88 % | 31.22 | 31.32 | 4.78 | -0.04 | aligned | ok | Dog in the window with a judgmental face, |
| **v1.16** | 0.55 | 100 % | 32.94 | 33.03 | 4.79 | +0.02 | grid | low-probability | Like, “Man, even I know you’re running late.” |
| h1.01 | 0.89 | 100 % | 34.76 | 34.74 | 1.04 | -0.66 | aligned | passes-disagree | Too much sauce in the backpack, |
| h1.02 | 0.97 | 100 % | 37.42 | 36.46 | 3.24 | -0.01 | aligned | ok | Too much fizz in the cup, |
| h1.03 | 0.98 | 100 % | 38.66 | 38.17 | 2.14 | -0.01 | aligned | ok | Too many tabs in my brain right now, |
| h1.04 | 0.83 | 100 % | 40.70 | 39.89 | 2.90 | -0.01 | aligned | ok | But I’m still showing up. |
| h1.05 | 0.92 | 100 % | 42.26 | 41.60 | 2.54 | +0.01 | aligned | ok | Confetti in the glovebox, |
| h1.06 | 0.91 | 100 % | 44.32 | 43.32 | 3.34 | -0.03 | aligned | ok | Keys in the wrong spot, |
| h1.07 | 0.98 | 100 % | 45.94 | 45.03 | 3.12 | -0.01 | aligned | ok | Life got weird by lunch, |
| h1.08 | 0.76 | 100 % | 47.20 | 46.74 | 2.06 | +0.03 | aligned | ok | But I’m still not lost. |
| v2.01 | 0.87 | 100 % | 51.19 | 51.89 | 3.37 | -0.01 | aligned | ok | Okay, who put a spoon in the pencil drawer? |
| v2.02 | 0.86 | 100 % | 53.26 | 53.60 | 4.20 | +0.01 | aligned | ok | Who made a plan, then planned twelve more? |
| v2.03 | 0.97 | 100 % | 54.94 | 55.32 | 4.12 | +0.01 | aligned | ok | Who had one job, then ignored that job |
| v2.04 | 0.81 | 100 % | 56.44 | 57.03 | 3.62 | -0.01 | aligned | ok | For a deep-dive video on dinosaur chores? |
| **v2.05** | 0.55 | 100 % | 58.68 | 58.74 | 4.85 | -0.01 | grid | low-probability | Me. |
| v2.06 | 0.73 | 100 % | 59.32 | 59.17 | 2.34 | -0.05 | aligned | ok | Probably me. |
| v2.07 | 0.78 | 100 % | 59.86 | 59.60 | 3.60 | -0.01 | aligned | ok | But I move like a sneeze through a library. |
| v2.08 | 0.80 | 86 % | 61.82 | 62.17 | 4.18 | -0.05 | aligned | ok | Quiet for a second, then suddenly alarming, |
| v2.09 | 0.88 | 78 % | 63.48 | 63.89 | 4.05 | +0.01 | aligned | ok | Trying to be normal, but the weird keeps farming. |
| **v2.10** | 0.57 | 89 % | 65.18 | 65.60 | 4.02 | +0.01 | grid | low-probability | Got a backpack snack and a half-charged phone, |
| v2.11 | 0.79 | 100 % | 67.20 | 67.32 | 4.73 | +0.01 | aligned | ok | Three missed calls from an unknown zone, |
| v2.12 | 0.91 | 100 % | 68.98 | 69.03 | 4.88 | -0.01 | aligned | ok | Calendar looking like a boss fight screen, |
| v2.13 | 0.76 | 100 % | 70.60 | 70.74 | 4.66 | +0.01 | aligned | ok | And I’m underprepared with a tangerine. |
| v2.14 | 0.91 | 100 % | 72.16 | 72.46 | 4.30 | +0.01 | aligned | ok | I’m not flexing, I’m stretching the chaos, |
| **v2.15** | 0.84 | 60 % | 74.00 | 74.17 | 4.60 | -0.01 | grid | not-heard-by-free-pass | Trying to make art out of stuff that fell off, |
| v2.16 | 0.90 | 100 % | 75.72 | 75.89 | 4.61 | +0.01 | aligned | ok | Paint on the floor, little dots on the ceiling, |
| v2.17 | 0.92 | 100 % | 77.58 | 77.60 | 4.95 | -0.11 | aligned | ok | Somehow still got a pretty good feeling. |
| ph.01 | 0.81 | 100 % | 79.30 | 79.32 | 4.96 | -0.27 | aligned | passes-disagree | Maybe I’m a little all over the map, |
| ph.02 | 0.80 | 100 % | 81.16 | 81.03 | 1.30 | +0.00 | aligned | ok | Maybe every straight line takes a nap, |
| ph.03 | 0.96 | 100 % | 82.90 | 82.74 | 1.36 | +0.00 | aligned | ok | Maybe the mess has a rhythm in it, |
| ph.04 | 0.78 | 100 % | 84.50 | 84.46 | 1.10 | -0.04 | aligned | ok | Maybe I’m late, but I’m still in it. |
| h2.01 | 0.95 | 100 % | 86.32 | 86.17 | 1.34 | -1.09 | aligned | passes-disagree | Too much sauce in the backpack, |
| h2.02 | 0.95 | 100 % | 88.82 | 87.89 | 3.18 | -0.00 | aligned | ok | Too much fizz in the cup, |
| h2.03 | 0.99 | 100 % | 90.00 | 89.60 | 1.93 | +0.02 | aligned | ok | Too many tabs in my brain right now, |
| h2.04 | 0.86 | 100 % | 92.14 | 91.32 | 2.92 | -0.00 | aligned | ok | But I’m still showing up. |
| h2.05 | 0.92 | 100 % | 93.68 | 93.03 | 2.52 | -0.00 | aligned | ok | Confetti in the glovebox, |
| h2.06 | 0.91 | 100 % | 95.72 | 94.74 | 3.28 | -0.04 | aligned | ok | Keys in the wrong spot, |
| h2.07 | 0.99 | 100 % | 97.36 | 96.46 | 3.10 | -0.00 | aligned | ok | Life got weird by lunch, |
| h2.08 | 0.73 | 100 % | 98.62 | 98.17 | 2.04 | +0.02 | aligned | ok | But I’m still not lost. |
| **br.01** | 0.57 | 100 % | 101.36 | 101.60 | 4.44 | +0.63 | grid | low-probability, passes-disagree | I got left-turn energy, |
| br.02 | 0.69 | 100 % | 105.12 | 105.03 | 1.21 | -0.06 | aligned | ok | Snack-pack chemistry, |
| br.03 | 0.79 | 100 % | 107.26 | 106.74 | 2.20 | +0.00 | aligned | ok | Calendar enemies, |
| br.04 | 0.88 | 100 % | 108.44 | 108.03 | 4.96 | -0.04 | aligned | ok | Laundry like a dynasty. |
| **br.05** | 0.57 | 60 % | 109.90 | 110.17 | 4.36 | +0.00 | grid | low-probability, not-heard-by-free-pass | I got “wait, what?” memory, |
| br.06 | 0.88 | 100 % | 112.12 | 111.89 | 1.54 | +0.00 | aligned | ok | Half-done symmetry, |
| br.07 | 0.90 | 100 % | 114.12 | 113.60 | 2.21 | -0.02 | aligned | ok | Tiny victories |
| **br.08** | 0.52 | 100 % | 115.22 | 114.89 | 4.78 | +0.00 | grid | low-probability | Stacked up mentally. |
| v3.01 | 0.92 | 100 % | 116.88 | 117.03 | 4.65 | -0.16 | aligned | ok | Let me land this plane on a tennis court, |
| v3.02 | 0.98 | 100 % | 118.56 | 118.74 | 4.57 | +0.02 | aligned | ok | Let me file these thoughts in a blanket fort, |
| v3.03 | 0.88 | 88 % | 120.22 | 120.46 | 4.44 | +0.06 | aligned | ok | Let me turn this glitch into airport art, |
| v3.04 | 0.86 | 100 % | 121.96 | 122.17 | 4.50 | +0.04 | aligned | ok | Let me restart twice and still play my part. |
| v3.05 | 0.67 | 100 % | 123.72 | 123.89 | 4.61 | -0.00 | aligned | ok | I’m a houseplant thriving in a thunderstorm, |
| v3.06 | 0.84 | 100 % | 125.54 | 125.60 | 4.86 | -0.03 | aligned | ok | A notebook page with a dragon drawn, |
| v3.07 | 0.91 | 100 % | 127.28 | 127.32 | 4.92 | -0.00 | aligned | ok | A lemonade stand in a hurricane, |
| v3.08 | 0.93 | 100 % | 129.12 | 129.03 | 1.21 | -0.06 | aligned | ok | Selling good vibes from a paper plane. |
| v3.09 | 0.74 | 86 % | 130.62 | 130.74 | 4.71 | -0.03 | aligned | ok | Not polished, not perfect, still moving though, |
| v3.10 | 0.83 | 100 % | 132.28 | 132.46 | 4.58 | +0.01 | aligned | ok | Little bit of static in the stereo, |
| v3.11 | 0.63 | 78 % | 134.02 | 134.17 | 4.64 | +0.01 | aligned | ok | If the day throws paint, let it splatter nonstop, |
| v3.12 | 0.90 | 100 % | 135.80 | 135.89 | 4.80 | -0.01 | aligned | ok | I’ll call it confetti in the glovebox. |
| h3.01 | 0.74 | 100 % | 137.78 | 137.60 | 1.42 | -1.35 | aligned | passes-disagree | Too much sauce in the backpack, |
| h3.02 | 0.71 | 100 % | 140.26 | 139.32 | 3.20 | +0.01 | aligned | ok | Too much fizz in the cup, |
| h3.03 | 0.95 | 100 % | 141.52 | 141.03 | 2.14 | +0.03 | aligned | ok | Too many tabs in my brain right now, |
| h3.04 | 0.70 | 100 % | 143.54 | 142.74 | 2.86 | +0.01 | aligned | ok | But I’m still showing up. |
| h3.05 | 0.91 | 100 % | 145.08 | 144.46 | 2.45 | -0.01 | aligned | ok | Confetti in the glovebox, |
| h3.06 | 0.91 | 100 % | 147.12 | 146.17 | 3.21 | +0.01 | aligned | ok | Keys in the wrong spot, |
| h3.07 | 0.98 | 100 % | 148.78 | 147.89 | 3.08 | +0.01 | aligned | ok | Life got weird by lunch, |
| h3.08 | 0.91 | 100 % | 150.10 | 149.60 | 2.16 | -0.01 | aligned | ok | But I’m still not lost. |
| **out.01** | 0.85 | 67 % | 153.74 | 153.46 | 2.66 | -3.02 | grid | not-heard-by-free-pass, passes-disagree | Still not lost. |
| out.02 | 0.89 | 100 % | 156.50 | 156.46 | 1.10 | -0.02 | aligned | ok | Just creatively delayed. |
| out.03 | 0.74 | 100 % | 159.62 | 159.46 | 4.38 | +0.00 | aligned | ok | With snacks. |

## Under threshold

- **in.01** "Okay.": low-probability. Aligner said 0.34..0.68 s; using grid 0.46..2.17 s. Words: Okay.(0.17)
- **in.02** "Yeah.": low-probability. Aligner said 2.38..3.38 s; using grid 2.17..3.89 s. Words: Yeah.(0.41)
- **in.05** "Cool.": low-probability. Aligner said 5.90..6.90 s; using grid 6.03..7.32 s. Words: Cool.(0.45)
- **v1.03** "Microwave beeped and it sounded like a trap door,": not-heard-by-free-pass. Aligner said 10.82..12.38 s; using grid 10.74..12.46 s. Words: Microwave(0.93) beeped(0.45) and(0.73) it(0.84) sounded(0.97) like(1.00) a(0.99) trap(0.99) door,(0.65)
- **v1.16** "Like, “Man, even I know you’re running late.”": low-probability. Aligner said 32.94..34.76 s; using grid 33.03..34.74 s. Words: Like,(0.38) “Man,(0.23) even(0.73) I(0.54) know(0.98) you’re(0.25) running(0.93) late.”(0.32)
- **v2.05** "Me.": low-probability. Aligner said 58.68..59.24 s; using grid 58.74..59.17 s. Words: Me.(0.55)
- **v2.10** "Got a backpack snack and a half-charged phone,": low-probability. Aligner said 65.18..67.14 s; using grid 65.60..67.32 s. Words: Got(0.94) a(0.99) backpack(0.51) snack(0.26) and(0.08) a(0.59) half-charged(0.70) phone,(0.52)
- **v2.15** "Trying to make art out of stuff that fell off,": not-heard-by-free-pass. Aligner said 74.00..75.68 s; using grid 74.17..75.89 s. Words: Trying(0.84) to(0.99) make(0.99) art(0.16) out(0.89) of(0.94) stuff(0.98) that(0.99) fell(0.98) off,(0.62)
- **br.01** "I got left-turn energy,": low-probability. Aligner said 101.36..104.76 s; using grid 101.60..105.03 s. Words: I(0.61) got(0.57) left-turn(0.47) energy,(0.65)
- **br.05** "I got “wait, what?” memory,": low-probability, not-heard-by-free-pass. Aligner said 109.90..111.62 s; using grid 110.17..111.89 s. Words: I(0.96) got(0.97) “wait,(0.13) what?”(0.09) memory,(0.72)
- **br.08** "Stacked up mentally.": low-probability. Aligner said 115.22..116.88 s; using grid 114.89..117.03 s. Words: Stacked(0.70) up(0.09) mentally.(0.76)
- **out.01** "Still not lost.": not-heard-by-free-pass. Aligner said 153.74..155.62 s; using grid 153.46..156.03 s. Words: Still(0.75) not(0.96) lost.(0.86)

## What the lyric-free pass heard

- whole 30.00..31.08: Doing dominoes,
- whole 31.08..32.70: dog in a window with a judgemental face
- whole 32.70..34.34: like man even I know you're running late
- whole 34.34..36.96: Too much sauce in the backpack,
- whole 37.24..38.30: too much fizz in the cup
- whole 38.30..41.82: Too many tabs in my brain right now but I'm still showing up
- whole 42.30..43.98: Confetti in the glove box,
- whole 44.20..45.66: keys in the wrong spot
- whole 45.66..48.68: Life got weird by lunch but I'm still not lost
- whole 79.30..80.88: Maybe I'm a little all over the map
- whole 80.88..82.54: Maybe every straight line takes a nap
- whole 82.78..84.24: Maybe the mess has a rhythm in it
- whole 84.44..85.96: Maybe I'm late but I'm still in it
- whole 86.12..88.34: Too much sauce in the backpack
- whole 88.72..89.72: Too much fizz in the cup
- whole 89.98..91.90: Too many tabs in my brain right now
- whole 91.90..93.20: But I'm still showing up
- whole 93.72..95.38: Confetti in the glove box
- whole 95.68..97.06: Keys in the wrong spot
- whole 97.30..98.36: Life got weird by lunch
- whole 98.36..100.18: But I'm still not lost
- whole 101.08..103.42: I got left
- whole 103.42..104.48: Turn energy
- whole 105.16..106.20: Snack pack chemistry
- whole 106.20..107.82: Calendar enemies
- whole 108.36..110.40: Laundry like a dynasty, I got weight,
- whole 111.08..111.16: memory,
- whole 112.06..113.08: half-done symmetry,
- whole 113.66..115.54: tiny victories stacked
- whole 115.54..118.38: up mentally Let me land this plane on a tennis court,
- whole 118.46..118.58: let
- whole 118.58..120.12: me file these thoughts in a blanket fort
- whole 120.12..121.86: Let me turn this glitch in the airport art,
- whole 121.92..123.62: let me restart twice and still play my part
- whole 123.62..125.22: I'm a houseplant prevalent in a thunderstorm,
- whole 125.36..128.70: a notebook page with a dragon drawn A lemonade stand in a hurricane,
- whole 128.76..129.62: selling good vibes
- whole 129.62..130.80: from a paper plane I fall,
- whole 130.80..131.30: it's not perfect,
- whole 131.34..131.84: still moving,
- whole 131.86..132.12: no
- whole 132.22..134.72: little bit of static in the stereo If the day throws pain,
- whole 134.76..135.50: let us fight or nonstop
- whole 135.74..137.36: I'll call it confetti in the glove box.
- whole 137.74..139.70: Too much sauce in the backpack.
- whole 140.14..141.14: Too much fizz in the cup.
- whole 141.46..143.32: Too many tabs in my brain right now,
- whole 143.34..144.60: but I'm still showing up.
- whole 145.08..146.84: Confetti in the glove box.
- whole 147.12..148.48: Key's in the wrong spot.
- whole 148.74..151.22: Life got weird by lunch, but I'm still not lost.
- whole 153.02..158.10: Still not lost, just creatively delayed.
- whole 159.60..160.14: With Snacks.
- intro 0.00..0.10: Okay.
- intro 2.78..4.66: Okay, yeah, where do I even put this?
- intro 4.86..5.14: Right here?
- intro 5.98..6.00: Cool!
- intro 6.96..8.06: I got confetti in the glove box,
- intro 8.16..8.90: waffles in the windstorm!
- verse1 6.42..8.08: I got confetti in the glove box,
- verse1 8.16..8.92: waffles in a windstorm,
- verse1 8.98..10.64: left chute talking like it's asking what the socks for,
- verse1 10.68..12.34: microwave beaked and it sounded like a trapdoor,
- verse1 12.38..14.06: opened up the fridge so we'll pickle doing parkour.
- verse1 14.18..15.66: Pull up, wait, I'm not done with the nonsense,
- verse1 15.82..17.46: brain got tapped like a discount conference,
- verse1 17.56..18.96: one says taxes, one says tacos,
- verse1 19.08..21.03: one says build a little boat out of Costco boxes.
- verse1 21.26..22.62: I don't need a cape, I got cargo shorts.
- verse1 22.92..24.24: I don't play golf but I'm yelling for.
- verse1 24.46..25.86: Had a shopping cart drifting throughout for,
- verse1 25.92..27.68: like it's Formula One at the grocery store,
- verse1 27.86..28.96: while I got receipts from a month ago,
- verse1 29.34..30.80: crumbs in the car doing dominoes,
- verse1 31.08..32.94: dog in a window with a judgmental face like,
- verse1 32.96..34.30: man, even I know you're running late.
- verse1 34.58..35.28: Too much
- hook1 50.57..52.87: even I know you're running late.
- verse2 51.04..52.88: Okay, who put a spoon in the pencil drawer?
- verse2 53.25..54.67: Who made a plan then planned twelve more?
- verse2 54.85..56.29: Who had one job then ignored that job
- verse2 56.29..58.05: for a deep dive video on dinosaur chores?
- verse2 58.69..58.87: Me,
- verse2 59.11..59.67: probably me,
- verse2 59.71..61.20: but I move like a sneeze through a library
- verse2 61.25..63.23: Why for a second then suddenly alarming?
- verse2 63.43..65.01: Tryna be normal but the weird keeps farming
- verse2 65.01..66.83: Got a back back snack and a half charge phone
- verse2 67.09..68.55: Three missed calls from an unknown zone
- verse2 68.55..70.31: Calendar looking like a boss fight screen
- verse2 70.31..72.05: And I'm underprepared with a tangerine
- verse2 72.05..73.69: I'm not flexing, I'm stretching the chaos
- verse2 73.99..75.57: Tryna make all that other stuff that fell off
- verse2 75.71..77.15: Pain on the floor, little dots on the ceiling
- verse2 77.45..78.83: Somehow still got a pretty good feeling
- verse2 79.21..80.09: Maybe I'm a little all over
- prehook 77.60..78.98: Still got a pretty good feeling.
- prehook 79.30..80.90: Maybe I'm a little all over the map.
- prehook 81.16..82.52: Maybe every straight line takes a nap
- prehook 82.52..84.24: Maybe the mess has a rhythm in it.
- prehook 84.42..85.98: Maybe I'm late, but I'm still in it.
- prehook 86.18..87.86: Too much sauce in the back
- hook2 84.46..85.98: Maybe I'm late but I'm still in it
- hook2 86.10..88.42: Too much sauce in the backpack
- hook2 88.70..89.74: Too much fizz in the cup
- hook2 89.98..91.90: Too many tabs in my brain right now
- hook2 91.90..93.24: But I'm still showing up
- hook2 93.66..95.38: Confetti in the glove box
- hook2 95.60..97.08: Key's in the wrong spot
- hook2 97.08..98.34: Life got weird by lunch
- hook2 98.34..100.06: But I'm still not lost
- hook2 101.58..104.48: I got left turn energy
- bridge 101.60..104.50: I got left turn energy,
- bridge 104.88..106.22: snack pack chemistry,
- bridge 106.66..107.94: calendar enemies,
- bridge 108.36..109.56: laundry like a dynasty
- bridge 109.56..110.42: I got weight,
- bridge 111.28..111.28: memory,
- bridge 112.04..113.06: half-done symmetry,
- bridge 114.10..116.54: tiny victories, stacked up mentally
- bridge 116.54..118.34: Let me land this plane on a tennis court
- verse3 116.22..118.38: Let me land this plane on a tennis court
- verse3 118.38..120.14: Let me file these thoughts in a blanket fort
- verse3 120.14..121.86: Let me turn this glitch in the airport art
- verse3 121.86..123.62: Let me restart twice and still play my part
- verse3 123.62..124.14: On my houseplant,
- verse3 124.30..127.08: thriving in a thunderstorm A notebook page with a dragon drawn
- verse3 127.08..130.46: A lemonade stand in a hurricane Selling good vibes from a paper plane
- verse3 130.46..130.86: Not polished,
- verse3 130.98..131.86: not perfect Still moving,
- verse3 132.10..132.12: no,
- verse3 132.22..132.90: little bit of static
- verse3 132.90..133.74: In the stereo,
- verse3 133.98..135.60: if the day throws pain Let us fight our non-stop,
- verse3 135.60..136.47: I'll call it confetti
- verse3 136.50..137.40: in the glove box
- verse3 137.68..139.30: Too much sauce in the back
- hook3 135.89..137.29: Call it confetti in the glove box
- hook3 137.53..139.77: Too much sauce in the backpack
- hook3 139.77..141.17: Too much fizz in the cup
- hook3 141.45..143.33: Too many tabs in my brain right now
- hook3 143.33..144.61: But I'm still showing up
- hook3 145.11..146.89: Confetti in the glove box
- hook3 147.11..148.49: Keys in the wrong spot
- hook3 148.49..149.79: Life got weird by lunch
- hook3 149.79..151.49: But I'm still not lost
- outro 149.60..151.60: But I'm still not lost
- outro 153.07..155.08: Still not lost
- outro 156.56..158.08: Just creatively delayed
- outro 159.60..160.00: With snacks
