# R Alpha — optional Rive animation integration

R Alpha remains a responsive website and continues to work on phones, tablets and desktop browsers. The current mascot SVG, CSS motion and the existing preview behavior remain the fallback; Rive is only activated when `assets/ember.riv` is present and the browser can load the Rive Canvas runtime.

## R Alpha mascot asset contract

Place a compiled Rive file at:

`assets/ember.riv`

The app expects a state machine named `Ember` with boolean inputs named:

- `thinking`
- `writing`
- `error`

The canvas is sized from its containing element and observes resize changes for responsive/mobile layouts. If the asset, runtime, artboard or state machine is unavailable, the existing SVG mascot remains visible. Do not remove the SVG fallback.

## Building the asset

A `.riv` file is a compiled runtime asset. An `.rml` source file is not directly playable by the browser runtime. Use the official Rive CLI in a local or CI build workspace to create and verify a Rive scene, then publish/build the `.riv` file and copy it to `assets/ember.riv`. The CLI can scaffold a project with `rive create`, preview it with `rive <project>`, and verify a scene with `rive <project> --verify`. Publishing a web-ready file that contains scripts may require signing in and building with `--publish`.

Rive CLI documentation: https://rive.app/cli
Rive agent workflow: https://rive.app/agents
Web runtime: https://www.npmjs.com/package/@rive-app/canvas

## For model-generated websites

Models may use the Rive web runtime to play an existing `.riv` file and connect its state-machine inputs to application state. For new custom Rive art, include the text source (`scene.rml`), project config (`rive.yaml`) and build instructions in the project ZIP. The browser preview sandbox can display a compiled `.riv` asset but cannot run the native Rive CLI or compile `.rml` itself. When no compiled asset is available, retain a functional CSS/SVG/Canvas/Motion fallback rather than claiming a custom `.riv` was built.
