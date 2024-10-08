# VSCode Bevy Colour

Lets you use VSCode's built-in colour picker with Bevy's colour constructors.

Uses a simple text match, looking for either `Color::` or `Colour::` followed by one of the following constructors:

- `rgba`
- `srgba`
- `rgb`
- `srgb`
- `rgba_u8`
- `srgba_u8`
- `rgb_u8`
- `srgb_u8`
