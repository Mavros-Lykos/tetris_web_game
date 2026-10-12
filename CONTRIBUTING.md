# Contributing

Thanks for helping improve Tetris Web.

## Before you start

1. Check existing issues before opening a new one.
2. Keep changes focused and dependency-free.
3. Preserve keyboard access and mobile usability.
4. Test the game in a current desktop browser and a narrow mobile viewport.

## Development

No install step is required. Open `index.html` directly, or serve the directory with any simple local HTTP server.

When changing gameplay, verify at least:

- A new game starts from the button and Space key.
- Left and Right move pieces.
- Up rotates clockwise and Down rotates counter-clockwise.
- Space hard drops without moving the page.
- Pause, line clearing, level progression, and game over still work.

## Pull requests

Use a clear title and explain the user-visible behavior. Include screenshots or a short recording for visual changes. Keep formatting changes separate from behavior changes where possible.

## Commit messages

Write imperative, specific commit subjects, for example:

```text
Add counter-clockwise keyboard rotation
```

A longer body is useful when the reason for a change is not obvious:

```text
Add counter-clockwise keyboard rotation

Map Down and the mobile counter-clockwise button to the inverse matrix rotation.
Keep Space reserved for hard drop.
```
