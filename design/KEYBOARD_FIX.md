# Interaction key regression

Reproduced: at Yuge Ramen, one E keydown opens the menu; an auto-repeated
keydown immediately invokes Back and returns to exploration. Dialogue repeats
could likewise reveal/advance lines without a distinct press.

Ignore auto-repeated E, Space, Enter and Escape in panel handling. A new
selection press uses the same first non-Back enabled target as the controller.
Escape still returns to exploration. Movement and text deletion retain repeat.

The local runtime also rejected JavaScript imports from public/. World data and
manifest imports now use byte-identical source copies, with tests comparing
all five copies to the untouched original assets. Shared module identity between
world rendering and dynamic restaurant placement is preserved.

Validation: typecheck; 83 tests with one worker and 30s timeout; browser regression
shows menu -> held E remains menu -> distinct E selects dish. Separate browser
checks exercise E/open/Escape for NPC, ad, cat, original restaurant and Ember &
Stone. This reproduces an accidental dismissal, not a confirmed full-scene freeze.

Real browser input exposed a separate focus condition: events did not reach the
runtime while its document was unfocused. Synthetic dispatch bypassed this.
The WebGL canvas now has an explicit tab stop and takes keyboard focus on pointer
down; cleanup restores the prior setting. The real-keyboard regression brings
the game forward, clicks its canvas, verifies canvas focus, then uses browser
E/Escape presses across all five interaction categories. It waits for the ad's
intentional intro animation. All five open, render buttons and return to explore.
