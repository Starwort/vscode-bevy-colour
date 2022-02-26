# VSCode Color Picker

A simple Color picker for vscode that lets you use vscode's css color picker in other documents

![color-picker-preview](https://i.imgur.com/dG1tnN3.png, "color-picker-preview")

* To make it work for your preferred language, just add a `vscode-color-picker.languages` entry in settings.json, with VSCode's identifier string for the language, in the list. For ex.
  ```json
    "color-picker.languages": [
        "python",
        "javascript",
        "typescript"
    ],
    ...
  ```
 and then make sure to reload the window for the service to be intialized properly.

### How do i stop it from running in languages i don't want it in?

Just remove the language entry from `vscode-color-picker.languages` in settings.json.


### What are the languages i can add to the extension?

A list of VSCode's language identifiers is available [here](https://code.visualstudio.com/docs/languages/identifiers).


### What types of strings are recognized colors?

Every valid css color should work.

 
