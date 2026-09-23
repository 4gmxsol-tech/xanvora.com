# Xanvora

Xanvora is an experimental AI-native 3D world designed to run in the browser.

## v0.1

The first prototype contains:

- Browser-based 3D world
- Player movement
- Simple NPC/guardian
- Interactive world commands
- First world mutation: building a house
- Architecture ready for later AI command integration

## Controls

- **WASD / Arrow keys** to move
- Click the robot
- Try: `Build a house near the tree`
- Try: `Make the robot my guardian`
- Try: `Clear world`

## Direction

`Player intent → AI planner → validated game command → world state → 3D renderer`

The AI layer is deliberately separated from the renderer so model providers can be replaced later.

## License

MIT
