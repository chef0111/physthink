# Three.js Cameras and Controls

## PerspectiveCamera (default)

The default camera in the PhysThink canvas. Provides perspective projection.
Properties: `fov` (field of view), `aspect`, `near`, `far`.
Default position: `[5, 5, 5]` looking at origin.

## OrbitControls (default)

Built into the scene environment. Allows user to:

- Left-click drag: rotate camera around the target
- Right-click drag: pan camera
- Scroll wheel: zoom in/out
- Double-click: focus on clicked point
  No need to configure — always available in the workspace.

## Camera Tips for Physics Scenes

- For 2D-style problems (inclined plane, projectile): position camera at `[0, 5, 15]` looking at `[0, 2, 0]` for a front view showing the XY plane clearly.
- For 3D problems (magnetic fields, orbital motion): use the default diagonal view `[5, 5, 5]`.
- For top-down views (circular motion, field maps): position camera at `[0, 15, 0]` looking down.
- The student can freely rotate/zoom with OrbitControls after scene creation.

## Grid and Axes

- Grid: displayed on the XZ plane (horizontal ground plane). Toggle with `setSceneSettings({ gridVisible: true/false })`.
- Axes Helper: shows X (red), Y (green), Z (blue) axis lines from origin. Toggle with `setSceneSettings({ axesVisible: true/false })`.
- Always enable axes when discussing coordinate decomposition or vector components.
