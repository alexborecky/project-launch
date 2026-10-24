# Rocket construction layers — four lighting versions

This set contains **48 transparent PNGs**: the same 12 construction layers in **day**, **dusk**, **night**, and **near-black night** lighting. Each theme is in its own folder.

Every layer is **256 × 1536 px**. To assemble a rocket, place the 12 PNGs from one theme at **x=0, y=0** and alpha-composite them in numeric order. Do not mix lighting themes in one stack.

| Layers | Construction phase |
| --- | --- |
| 01–06 | Primary truss, propellant tanks, upper-stage tanks, feed lines, avionics/payload bay, thrust frame |
| 07–12 | Engine cluster, aft skirt, lower booster shell, main booster shell, upper stage/interstage shell, fairing and final outer surface |

Each theme folder also contains a `construction-preview.png` showing cumulative progress at layers 1, 3, 6, 9 and 12, plus an `assembled-preview.png` of the finished stack. These two previews are not part of the 48 construction PNGs.

The internal structures use the approved daytime construction geometry, lit to suit each version. Each theme's outer modules use its matching extracted rocket surface. `manifest.json` lists the files and stack order.
