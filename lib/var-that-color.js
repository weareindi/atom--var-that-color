'use babel';

const ntc = require('ntc');

export default {
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

        const prefix = this.getVariableSetter();

        let convertedLinesArray = selectedLinesArray;
        selectedLinesArray.map((line, index) => {
            let newLine = line;

            if (this.isHex(line)) {
                const named = ntc.name(line);
                const name = `color-${named[1].toLowerCase().replace(/\s/g, '-')}`;
                newLine = `${prefix}${name}: ${this.convertHexToRgb(named[0])}`;
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

        if (!regex.exec(line)) {
            return false;
        }

        return true;
    },

    /**
     * Convert HEX colour to RGB
     * @param  {String}  line A preformatted 6 digit hex code
     * @return {String}       The converted colour in RGB format
     */
    convertHexToRgb(hex) {
        hex = hex.replace('#','');

        red = parseInt(hex.substring(0,2), 16);
        green = parseInt(hex.substring(2,4), 16);
        blue = parseInt(hex.substring(4,6), 16);

        return `rgb(${red}, ${green}, ${blue})`;
    }

};
