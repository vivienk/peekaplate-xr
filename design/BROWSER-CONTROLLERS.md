# Browser controllers

Connect an Xbox, DualShock 4 or DualSense controller over USB or pair it with the computer over Bluetooth. Open the game in a browser that exposes the controller with the [W3C standard Gamepad mapping](https://www.w3.org/TR/gamepad/#remapping). Focus the game, press a controller button to let the browser detect it, then release the controls. The title shows “Controller ready”. Press A / Cross to start.

| Control | Action |
| --- | --- |
| Left stick / D-pad | Walk; choose menu buttons |
| A / Cross | Interact nearby; activate highlighted button |
| B / Circle | Back |
| Menu / Options | Pause / resume; view controller guide |
| X / Square | Order tray while walking; delete a save-code character on the keypad |
| Y / Triangle | Passport while walking; reset 3D dish view |
| View / Share | Map while walking |
| Right stick | Rotate dish in AR Portal |
| LT / L2, RT / R2 | Zoom out / in in AR Portal |
| LB / L1, RB / R1 | Previous / next dish in AR Portal |

The on-screen keypad supports save-code entry using the D-pad and A / Cross, so no keyboard is required. Menus show a light outline on the selected button and skip disabled choices. A browser may require one mouse click before allowing sound; controller gameplay does not depend on audio permission.

Stick dead zones prevent drift. Confirmation is edge-triggered, and menu navigation has a delayed repeat. Disconnecting or leaving the tab releases movement. Controls must return to neutral after reconnection or focus recovery. Browser gamepads are disabled during immersive XR; Quest uses its existing controller rays and left thumbstick.

Only browser-provided standard mappings are accepted; unrecognized/raw mappings are not guessed. Hardware pairing, drivers and browser recognition remain platform-dependent. Physical Xbox/PlayStation hardware acceptance is still required.

Validation: unit tests cover standard Xbox/PlayStation mapping, movement, dead zones, menu repeat, single-press selection, shortcuts, save keypad, 3D controls, disconnect/focus recovery and disabled menu choices.

Managed-browser acceptance passed with a simulated standard controller through the live polling path: title → walk → pause/back → tray/passport/map → nearby restaurant interaction → dish → AR Portal rotation → disconnect. This is simulated input, not physical hardware certification. To repeat, start the managed server with `--allow-browser-automation`, then run `npx @iwsdk/cli browser run scripts/test-browser-gamepad.mjs`. The script saves the controller guide screenshot under ignored `artifacts/`.
