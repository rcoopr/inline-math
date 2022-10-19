<p align="center">
    <img width="128" alt="icon" src="https://raw.githubusercontent.com/Froskk/inline-math/main/assets/icon.png">
</p>

<h2 align="center"> Inline Math - VSCode Extension </h2>

Inline Math for VS Code provides instant math evaluation, anywhere you type! Incredibly useful for quick arithmetic, trigonometry, even unit conversion!

Inline Math follows your cursor and tries to find a valid math expression within the current line. If you highlight some text, it looks within the selection (and works accross multiple lines, too!)

<p align="center">
<img width="700" alt="preview" src="https://raw.githubusercontent.com/Froskk/inline-math/main/assets/preview.png">
<img width="700" alt="preview multicursor example" src="https://raw.githubusercontent.com/Froskk/inline-math/main/assets/preview-multicursor.png">
</p>

The inlay message can be configured with a custom template, and the hover message can be toggled on/off

<br />

## Commands

| Command            | Description                                           |
| ------------------ | ----------------------------------------------------- |
| Toggle Inline Math | Disable/Enable inline math                            |
| Copy Math Result   | Copy the currently shown evaluations to the clipboard |

<br />

## Settings

| Setting           | Default             | Description                                                                                                                                             |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`         | `true`              | Enables the extension                                                                                                                                   |
| `delay`           | `500`               | Delay, in milliseconds, after cusor stops moving until calculation starts - 0 will be instant but try a higher value if you run into performance issues |
| `messageTemplate` | `$source = $result` | Template used for all inline messages. Interpolates `$source`, `$result`                                                                                |
| `messageMaxChars` | `30`                | Max length of `$source` replacement in `messageTemplate`. Result will never be truncated                                                                |
| `hoverMessage`    | `true`              | Toggle showing the hover message or not                                                                                                                 |
| `margin`          | `2ch`               | Distance between the end of current line and the start of inline message (Supports CSS sizes like `ch`)                                                 |
| `padding`         | `2px 1ch`           | [Inner padding](https://developer.mozilla.org/en-US/docs/Web/CSS/padding) of the inline message                                                         |
| `borderRadius`    | `5px`               | [Border radius](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius) of the inline message                                                   |
| `fontFamily`      | `''`                | [Font family](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family) of inline message                                                           |
| `fontSize`        | `0.85em`            | [Font size](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size) of inline message                                                               |
| `fontWeight`      | `normal`            | [Font weight](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight) of inline message                                                           |
| `fontStyleItalic` | `true`              | Makes inline message italic                                                                                                                             |

<br />

## Colors

| Color                        | Default     | Description                             |
| ---------------------------- | ----------- | --------------------------------------- |
| `inlineMath.background`      | `#00b7e420` | Background color                        |
| `inlineMath.backgroundLight` | `#00b7e420` | Background color (Only in light themes) |
| `inlineMath.foreground`      | `#00b7e4`   | Text color                              |
| `inlineMath.foregroundLight` | `#00b7e4`   | Text color (Only in light themes)       |

<br />

### Technical details

Inline Math works by searching subsets of your current line, split on every space. This is to limit the complexity of parsing every possible expression within the current line, but allows you to see results that are in the middle of unrelated code. Each subset, from largest to smallest, is parsed by `mathjs` and if successful, shows a result. Results are cached to prevent unnecessary calculations (although subset results are not cached right now, pending some profiling...).

<br />

### Acknowledgements

- Inline Math borrows heavily, in code structure and style, from [Error Lens](https://github.com/usernamehw/vscode-error-lens)

- Under the hood, all evaluation is done with [mathjs](https://mathjs.org/)

<br />

### Other bits

- Please report any bugs or make suggestions via [Github Issues](https://github.com/Froskk/inline-math/issues)

- Contributions are welcome and this extension is in active development

- Released under the MIT License, free to do whatever you like with it
