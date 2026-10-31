# Original Krillion vs Sidequest: measured visual parity repair

Date: 31 October 2026. Status: source geometry/motion corrections implemented,
not certified pixel-perfect 1:1 equivalence.

## Method

Using Chromium at matching 1440x900 and 390x844 device-scale-one viewports,
compared original live krillion.io/party and krillion.io to the independently
implemented Sidequest client. Inspected public DOM/CSS/browser-delivered
runtime code, computed element rectangles, running CSS animations, and
screen RGB difference.

A QA trap was found: directly hosting Sidequest as a static site without
a JSON Party API response caused an extra 90px error banner, shifting the
whole Party page. The tests were repeated with a valid mocked empty-room
response, equivalent in format to the independent production backend.

## Puffer Party geometry

| Element | Original desktop | Recreated desktop | Original mobile | Recreated mobile |
| --- | --- | --- | --- | --- |
| Sleeping mascot X | 640 | 640 | 144 | 144 |
| Sleeping mascot Y | 379 | 379 | 186 | 186 |
| Name input X | 210 | 212 | 30 | 30 |
| Name input Y | 384 | 384 | 453 | 452 |
| Name input width | 328 | 328 | 330 | 330 |
| CSS animations active | 11 | 11 | 11 | 11 |

The source publicly delivered reef assets are 1536x1024 desktop and
1024x1536 mobile, displayed at ~1512x1008 x-36/y-190, and
~608x912 x-109/y-158. Sidequest now matches those crops.
The original Party navigation button and subtitle font were also
measured and aligned.

Unsynchronized full-frame RGB MAE improved from approximately
26.9 to 10.9/255 on desktop and 38.9 to 18.1/255 on mobile.
The original public room list showed live publisher rooms while the
Sidequest backend correctly showed its own rooms. These cannot be identical.

## Original mascot physics

The publisher's public browser runtime uses a separate parent motion
independent of the 2.6s swimming sprite animation:

- Desktop stage at 1440x900: x180,width1080,height810.
- Mobile stage at 390x844: x0,width390,height794.
- Initial parent center (-120,300), rotation 0.
- Intro target X = stageWidth * 0.72; target Y = stageHeight/2+195.
- Frame smoothing = 1-exp(-2.6 * deltaTime).
- Vertical offset = 6*sin(1.7*time); rotation = 4*sin(1.1*time).
- The child sprite retains the publicly observed 2.6s ds-swim animation.

Previously the recreation only animated a fixed image. A new
frame-based parent layer now copies the original motion model.

Nine-sample position averages from asynchronous sessions:

| Viewport/mode | Original avg X | Sidequest corrected avg X |
| --- | --- | --- |
| Desktop Daily | 912 | 918 |
| Desktop Unlimited | 905 | 916 |
| Mobile Daily | 242 | 245 |
| Mobile Unlimited | 237 | 244 |

## Limits on exactness

The original and Sidequest do not share the same random seeds, initial
animation clocks or identical source/backend state. Publisher multiplayer
rooms, account records, server distribution numbers and purchases are
independent from Sidequest by design. Deterministic image-frame identity
was not achieved; therefore, exact 1:1 certification is not justified.
