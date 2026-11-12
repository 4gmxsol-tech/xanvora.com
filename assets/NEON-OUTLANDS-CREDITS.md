# NEON OUTLANDS — Asset Credits

NEON OUTLANDS is a separate game page from NEON FRONTIER.

## Third-party 3D assets

The following models are from Kenney asset packs. The Kenney packs are published under CC0 1.0 (verify the individual pack page if replacing or adding assets):

- Car Kit — player vehicle: `packs/car-kit/race-future.glb`
  - https://kenney.nl/assets/car-kit
- City Kit (Roads) — road modules: `packs/city-kit-roads/road-straight.glb`
  - https://kenney.nl/assets/city-kit-roads
- Nature Kit — oak and pine trees, rocks:
  - https://kenney.nl/assets/nature-kit
- City Kit (Commercial) — building modules:
  - https://kenney.nl/assets/city-kit-commercial
- Space Kit — alien creatures and energy crystals:
  - https://kenney.nl/assets/space-kit

## Delivery

The game currently loads GLB files from the public asset mirror at:
https://hidencod.github.io/tge-assets/

The models are not bundled into this repository yet. The game therefore requires an internet connection and the mirror to remain available. The asset loader has a simple fallback for the player vehicle, but not for every environment prop.

## Game implementation

- Three.js r166.1
- GLTFLoader for GLB models
- Original gameplay code, UI, driving, chase camera, pickups, combat, and world layout are part of this repository.
- Kenney models are third-party assets; no ownership claim is made over them.
