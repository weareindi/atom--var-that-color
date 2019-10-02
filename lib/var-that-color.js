'use babel';

const ntc = require('ntc');
const config = require('./config.json');

export default {
    config: config,

    activate() {
        atom.commands.add('atom-workspace', {
            'var-that-color:convert': () => this.convert()
        });
    },

    /**
     * Replace selected lines hex, rgb and rgb colors with appropriate variables
     * for use in css pre-processors
     */
    convert() {
        this.editor = atom.workspace.getActiveTextEditor();

        const selection = this.editor.getLastSelection();
        const selectionRange = selection.getBufferRange();
        const selectedLines = selection.getText();
        const selectedLinesArray = selectedLines.match(/[^\r\n]+/g);

        if (!selectedLinesArray) {
            atom.notifications.addError(
                'Unable to var that color: Nothing selected',
                {
                    dismissable: true
                }
            );
            return;
        }

        // Clean values
        for (let i = 0; i < selectedLinesArray.length; i++) {
            selectedLinesArray[i] = selectedLinesArray[i].replace(';', '');
        }


        let convertedLinesArray = selectedLinesArray;

        selectedLinesArray.map((line, index) => {
            let newLine = line;

            if (this.isHex(line) || this.isRgb(line) || this.isRgba(line)) {
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
     * @param  {string} color A correctly formatted color value
     * @return {string}
     */
    getOutput(line) {
        const outputType = atom.config.get('var-that-color.outputType');

        let output = line;
        if (outputType === 'hex') {
            output = this.convertColorToHex(line);
        }
        if (outputType === 'rgb') {
            output = this.convertColorToRgb(line);
        }
        if (outputType === 'rgba') {
            output = this.convertColorToRgba(line);
        }

        const hex = this.convertColorToHex(line);
        const named = ntc.name(hex);
        const name = `color-${named[1].toLowerCase().replace(/\s|\//g, '-').replace(/-+/g, '-')}`;
        const prefix = this.getPrefix();
        const suffix = this.getSuffix();

        return `${prefix}${name}: ${output}${suffix}`;
    },

    /**
     * Get the appropriate variable prefix
     * @return {String} The variable declaration character
     */
    getPrefix() {
        if (this.getFiletype() === 'less') {
            return `@`;
        }

        if (this.getFiletype() === 'scss' || this.getFiletype() === 'sass') {
            return `$`;
        }

        return '';
    },

    /**
     * Get the appropriate line ending
     * @return {String}
     */
    getSuffix() {
        if (this.getFiletype() === 'scss' || this.getFiletype() === 'less') {
            return `;`;
        }

        return '';
    },

    /**
     * Get the file type of the current active document
     * @return {String}
     */
    getFiletype() {
        if (!this.editor.buffer.file) {
            return '';
        }

        return this.editor.buffer.file.path.split('.').pop();
    },

    /**
     * Test if a string is a HEX colour
     * @param  {String}  string
     * @return {Boolean}
     */
    isHex(string) {
        const regex = /^#([0-9a-f]{6}|[0-9a-f]{3})$/gi;

        if (!regex.exec(string)) {
            return false;
        }

        return true;
    },

    /**
     * Test if a string is a rgb colour
     * @param  {String}  string
     * @return {Boolean}
     */
    isRgb(string) {
        const regex = /^rgb\((\d{1,3}),[ ]{0,2}(\d{1,3}),[ ]{0,2}(\d{1,3})\)$/gi;

        if (!regex.exec(string)) {
            return false;
        }

        return true;
    },

    /**
     * Test if a string is a rgba colour
     * @param  {String}  string The string you want to test
     * @return {Boolean}
     */
    isRgba(string) {
        const regex = /^rgba\((\d{1,3}),[ ]{0,2}(\d{1,3}),[ ]{0,2}(\d{1,3}),[ ]{0,2}([\d.]{1,3})\)$/gi;

        if (!regex.exec(string)) {
            return false;
        }

        return true;
    },

    /**
     * Convert rgba() or rgb() to hex
     * @param  {[type]} color
     * @return {[type]}
     */
    convertColorToHex(color) {
        if (this.isHex(color)) {
            return color;
        }

        if (this.isRgb(color) || this.isRgba(color)) {
            return this.convertRgbToHex(color);
        }

        return color;
    },

    /**
     * Convert hex or rgba() to rgb()
     * @param  {[type]} color
     * @return {[type]}
     */
    convertColorToRgb(color) {
        if (this.isHex(color)) {
            return this.convertHexToRgb(color);
        }

        if (this.isRgb(color)) {
            return color;
        }

        if (this.isRgba(color)) {
            return this.convertRgbToRgb(color);
        }

        return color;
    },

    /**
     * Convert rgb() or rgba() to rgba()
     * @param  {[type]} color
     * @return {[type]}
     */
    convertColorToRgba(color) {
        if (this.isHex(color)) {
            return this.convertHexToRgb(color, true);
        }

        if (this.isRgb(color)) {
            return this.convertRgbToRgb(color, true);
        }

        if (this.isRgba(color)) {
            return color;
        }

        return color;
    },

    /**
     * Convert hex colour to rgb()
     * @param  {[type]} hex
     * @param  {[type]} includeAlpha Do we want to include alpha?
     * @return {[type]}
     */
    convertHexToRgb(hex, includeAlpha) {
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
        return includeAlpha ? `rgba(${red}, ${green}, ${blue}, 1)` : `rgb(${red}, ${green}, ${blue})`;
    },

    /**
     * Convert rgb() or rgba() to hex
     * @param  {[type]} rgb
     * @return {[type]}
     */
    convertRgbToHex(rgb) {
        var regex = /(\d{1,3}),[ ]{0,2}(\d{1,3}),[ ]{0,2}(\d{1,3})/g;
        var matches = regex.exec(rgb);
        const r = ('00' + Number(matches[1]).toString(16)).slice(-2);
        const g = ('00' + Number(matches[2]).toString(16)).slice(-2);
        const b = ('00' + Number(matches[3]).toString(16)).slice(-2);
        return `#${r}${g}${b}`;
    },

    /**
     * Convert rgba() to rgb() or rgba()
     * @param  {[type]} rgb
     * @param  {[type]} includeAlpha Do we want to include alpha?
     * @return {[type]}
     */
    convertRgbToRgb(rgb, includeAlpha) {
        var regex = /(\d{1,3}),[ ]{0,2}(\d{1,3}),[ ]{0,2}(\d{1,3})/g;
        var matches = regex.exec(rgb);
        const r = matches[1];
        const g = matches[2];
        const b = matches[3];
        return includeAlpha ? `rgba(${r}, ${g}, ${b}, 1)` : `rgb(${r}, ${g}, ${b})`;
    }
};
