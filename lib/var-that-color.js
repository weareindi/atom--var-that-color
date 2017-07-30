'use babel';

const ntc = require('ntc');
const config = require('./config.json');

export default {
    config: config,

    activate: function() {
        atom.commands.add('atom-workspace', {
            'var-that-color:convert': () => this.convert()
        });
    },

    /**
     * Replace selected lines of hex codes with document appropriate variables
     * for use in css pre-processors
     */
    convert: function() {
        this.editor = atom.workspace.getActiveTextEditor();

        const selection = this.editor.getLastSelection();
        const selectionRange = selection.getBufferRange();
        const selectedLines = selection.getText();
        const selectedLinesArray = selectedLines.match(/[^\r\n]+/g);

        if (!selectedLinesArray) {
            atom.notifications.addError(
                'Unable to var that color: No hex color selected',
                {
                    dismissable: true
                }
            );
            return;
        }

        let convertedLinesArray = selectedLinesArray;

        selectedLinesArray.map((line, index) => {
            let newLine = line;

            if (this.isHex(line)) {
                newLine = this.getOutput(line);
            }

            convertedLinesArray[index] = newLine;
        });

        let convertedLines = '';
        convertedLinesArray.map((line) => {
            convertedLines += `${line}\n`;
        });

        this.editor.setTextInBufferRange(selectionRange, convertedLines);
    },

    /**
     * Get the line replacement output
     * @param  {string} hex A correctly formatted hex value
     * @return {string}     A complete line in the format of (prefix)(color-name): (color);
     */
    getOutput: function(hex) {
        const outputType = atom.config.get('var-that-color.outputType');
        const output = outputType === 'rgb' ? this.convertHexToRgb(hex) : hex;

        const named = ntc.name(hex);
        const name = `color-${named[1].toLowerCase().replace(/\s/g, '-')}`;
        const prefix = this.getVariableSetter();

        return `${prefix}${name}: ${output};`;
    },

    /**
     * Get the appropriate variable declaration character
     * @return {String} The variable declaration character
     */
    getVariableSetter: function() {
        if (this.getFiletype() === 'less') {
            return `@`;
        }

        if (this.getFiletype() === 'scss' || this.getFiletype() === 'sass') {
            return `$`;
        }

        return '';
    },

    /**
     * Get the file type of the current active document
     * @return {String} The file type
     */
    getFiletype: function() {
        if (!this.editor.buffer.file) {
            return '';
        }

        return this.editor.buffer.file.path.split('.').pop();
    },

    /**
     * Test if a string is a HEX colour
     * @param  {String}  string The string you want to test
     * @return {Boolean}
     */
    isHex: function(string) {
        const regex = /^#([0-9a-f]{6}|[0-9a-f]{3})$/gi;

        if (!regex.exec(string)) {
            return false;
        }

        return true;
    },

    /**
     * Convert HEX colour to RGB
     * @param  {String}  line A preformatted 3 or 6 digit hex code
     * @return {String}       The converted colour in RGB format
     */
    convertHexToRgb(hex) {
        hex = hex.replace('#','');

        // Convert 3 digit to 6 digit
        if (hex.length === 3) {
            hex = [
                hex.slice(0, 1),
                hex.slice(0, 1),
                hex.slice(1, 2),
                hex.slice(1, 2),
                hex.slice(2, 3),
                hex.slice(2, 3)
            ].join('');
        }

        red = parseInt(hex.substring(0,2), 16);
        green = parseInt(hex.substring(2,4), 16);
        blue = parseInt(hex.substring(4,6), 16);

        return `rgb(${red}, ${green}, ${blue})`;
    }

};
