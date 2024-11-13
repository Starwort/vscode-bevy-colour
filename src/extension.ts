import * as vscode from 'vscode';

// https://stackoverflow.com/a/60027277
//build regexes without worrying about
// - double-backslashing
// - adding whitespace for readability
// - adding in comments
const clean = (piece: string) => (piece
    .replace(/((^|\n)(?:[^\/\\]|\/[^*\/]|\\.)*?)\s*\/\*(?:[^*]|\*[^\/])*(\*\/|)/g, '$1')
    .replace(/((^|\n)(?:[^\/\\]|\/[^\/]|\\.)*?)\s*\/\/[^\n]*/g, '$1')
    .replace(/\n\s*/g, '')
);
const regex = ({raw}, ...interpolations: any[]) => (
    new RegExp(interpolations.reduce(
        (regex, insert, index) => (regex + insert + clean(raw[index + 1])),
        clean(raw[0])
    ))
);

interface Match {
    colour: vscode.Color;
    type: string;
    length: number;
    range: vscode.Range;
}

function charToPosition(document: string, char: number): vscode.Position {
    const lines = document.slice(0, char).split("\n");

    const line = lines.length - 1;

    const character = lines[line].length;

    return new vscode.Position(line, character);
}

const COLOUR = regex`
    Colo(u?)r::(?:
        // s?rgba?
        s?rgba\(\s*(\d*.\d*)\s*,\s*(\d*.\d*)\s*,\s*(\d*.\d*)\s*,\s*(\d*.\d*)\s*,?\s*\)
        |s?rgb\(\s*(\d*.\d*)\s*,\s*(\d*.\d*)\s*,\s*(\d*.\d*)\s*,?\s*\)
        // s?rgba?_u8
        |s?rgba_u8\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?\s*\)
        |s?rgb_u8\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?\s*\)
    )
`;

function identifyColour(colour: string) {
    const match = COLOUR.exec(colour);
    if (match === null) {
        throw new Error("!! match was null for " + colour);
    }
    const isColour = match[1] != '';
    switch (true) {
        case match[2] !== undefined:
            return {
                type: "rgba",
                colour: new vscode.Color(+match[2], +match[3], +match[4], +match[5]),
                isColour,
            };
        case match[6] !== undefined:
            return {
                type: "rgb",
                colour: new vscode.Color(+match[6], +match[7], +match[8], 1),
                isColour,
            };
        case match[9] !== undefined:
            return {
                type: "rgba_u8",
                colour: new vscode.Color(+match[9] / 255, +match[10] / 255, +match[11] / 255, +match[12] / 255),
                isColour,
            };
        case match[13] !== undefined:
            return {
                type: "rgb_u8",
                colour: new vscode.Color(+match[13] / 255, +match[14] / 255, +match[15] / 255, 1),
                isColour,
            };
    }
}

function getMatches(document: string): Match[] {
    const matches = document.matchAll(new RegExp(COLOUR.source, "g"));
    return Array.from(matches).map(match => {
        const length = match[0].length;

        const range = new vscode.Range(
            charToPosition(document, match.index),
            charToPosition(document, match.index + length)
        );

        let colour = identifyColour(match[0]);
        console.log("colour:", match[0], colour, "range:", range);

        return {
            ...colour, range, length
        };
    });
}

function r(c: vscode.Color) {
    return c.red.toFixed(3).replace(/0+$/, "");
}
function r8(c: vscode.Color) {
    return Math.round(c.red * 255);
}

function g(c: vscode.Color) {
    return c.green.toFixed(3).replace(/0+$/, "");
}
function g8(c: vscode.Color) {
    return Math.round(c.green * 255);
}

function b(c: vscode.Color) {
    return c.blue.toFixed(3).replace(/0+$/, "");
}
function b8(c: vscode.Color) {
    return Math.round(c.blue * 255);
}

function a(c: vscode.Color) {
    return c.alpha.toFixed(3).replace(/0+$/, "");
}
function a8(c: vscode.Color) {
    return Math.round(c.alpha * 255);
}


class Picker {
    constructor() {
        this.register();
    }

    private register() {
        vscode.languages.registerColorProvider("rust", {
            provideDocumentColors(document: vscode.TextDocument, _: vscode.CancellationToken) {
                const matches = getMatches(document.getText());
                if (matches.length === 0) {
                    console.log("No matches");
                    return [];
                }
                let matched = matches.map((match) => new vscode.ColorInformation(
                    match.range,
                    match.colour,
                ));
                console.log("found", matched);
                return matched;
            },
            provideColorPresentations(c, context, _) {
                const colString = context.document.getText(context.range);
                let kind = identifyColour(colString);
                let prefix = kind.isColour ? "Colour::" : "Color::";
                const config = vscode.workspace.getConfiguration('bevy-colour');
                switch (config.get("preferredNumberType")) {
                    case "preserve":
                        break;
                    case "f32":
                        kind.type = kind.type.replace("_u8", "");
                        break;
                    case "u8":
                        kind.type = kind.type.replace("_u8", "") + "_u8";
                        break;
                }
                switch (config.get("alphaConversion")) {
                    case "auto":
                        kind.type = kind.type.replace(/rgba?/, c.alpha === 1 ? "rgb" : "rgba");
                        break;
                    case "always":
                        kind.type = kind.type.replace(/rgba?/, "rgba");
                        break;
                    case "never":
                        break;
                }
                switch (kind.type) {
                    case "rgba":
                        return [new vscode.ColorPresentation(
                            `${prefix}srgba(${r(c)}, ${g(c)}, ${b(c)}, ${a(c)})`
                        )];
                    case "rgb":
                        return [new vscode.ColorPresentation(
                            `${prefix}srgb(${r(c)}, ${g(c)}, ${b(c)})`
                        )];
                    case "rgba_u8":
                        return [new vscode.ColorPresentation(
                            `${prefix}srgba_u8(${r8(c)}, ${g8(c)}, ${b8(c)}, ${a8(c)})`
                        )];
                    case "rgb_u8":
                        return [new vscode.ColorPresentation(
                            `${prefix}srgb_u8(${r8(c)}, ${g8(c)}, ${b8(c)})`
                        )];
                }
            }
        });
    }

    dispose() {}
}



export function activate(context: vscode.ExtensionContext) {
    const picker = new Picker();
    context.subscriptions.push(picker);
}

// this method is called when your extension is deactivated
export function deactivate() {}
