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
        const editor = this.getEditor();
        const lines = this.getSelectedLinesArray(editor);
        const linesConverted = this.processSelectedLinesArray(editor, lines);
        this.replaceLines(editor, linesConverted);
    },

    /**
     * Replace selected lines
     * @param  {object} editor
     * @param  {[array]} lines An array of strings to replace the current selection
     */
    replaceLines(editor, lines) {
        const selection = editor.getLastSelection();
        const selectionRange = selection.getBufferRange();
        editor.setTextInBufferRange(selectionRange, lines.join(`\n`));
    },

    /**
     * Get the current Atom editor instance
     * @return {object}
     */
    getEditor() {
        return atom.workspace.getActiveTextEditor();
    },

    /**
     * Get current highlighted selection split into an array of lines
     * @param  {object} editor
     * @return {[array]}
     */
    getSelectedLinesArray(editor) {
        const selection = editor.getLastSelection();
        const selectionRange = selection.getBufferRange();
        const selectedLines = selection.getText();
        const selectedLinesArray = selectedLines.split('\n');

        if (!selectedLinesArray) {
            atom.notifications.addError(
                'Var That Color: Nothing selected',
                { dismissable: true}
            );
            throw new Error('Nothing selected');
        }

        // Clean values
        for (let i = 0; i < selectedLinesArray.length; i++) {
            selectedLinesArray[i] = selectedLinesArray[i].replace(';', '');
        }

        return selectedLinesArray;
    },

    /**
     * Process selected lines and convert if required
     * @param  {object} editor
     * @param  {[array]}  lines  An array of lines
     * @return {[array]}         An array of lines
     */
    processSelectedLinesArray(editor, lines) {

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (this.isHex(line) || this.isRgb(line) || this.isRgba(line)) {
                lines[i] = this.convertLine(editor, line);
                continue;
            }
        }

        return lines;
    },

    /**
     * Convert a color string into a variable
     * @param  {object} editor
     * @param  {string} line   A color
     * @return {string}
     */
    convertLine(editor, line) {
        // Convert color to hex for htc
        const hex = this.convertColorToHex(line);

        // Get color name
        const colorName = this.convertHexToName(hex);

        // Convert line to requested output type
        const outputType = atom.config.get('var-that-color.outputType');
        if (outputType === 'hex') {
            line = hex;
        }
        if (outputType === 'rgb') {
            line = this.convertColorToRgb(line);
        }
        if (outputType === 'rgba') {
            line = this.convertColorToRgba(line);
        }

        const prefex = this.getPrefix(editor);
        const seperator = this.getSeperator(editor);
        const suffix = this.getSuffix(editor);

        return `${prefex}${colorName}${seperator}${line}${suffix}`;
    },

    /**
     * Convert hex to a name using the ntc package
     * @param  {string} hex A valid hex color code
     * @return {string}
     */
    convertHexToName(hex) {
        let nameData = ntc.name(hex);

        return `color-${nameData[1].toLowerCase().replace(/\s|\//g, '-').replace(/-+/g, '-')}`;
    },

    /**
     * Get the appropriate variable prefix
     * @param  {object} editor
     * @return {string} The variable declaration character
     */
    getPrefix(editor) {
        // Get cursor scope
        let cursorScope = this.getCursorScope(editor);

        if (cursorScope === 'less') {
            return `@`;
        }

        if (cursorScope === 'scss' || cursorScope === 'sass') {
            return `$`;
        }

        if (cursorScope === 'css') {
            return `--`;
        }

        return '';
    },

    /**
     * Get the appropriate key/value seperator
     * @param  {object} editor
     * @return {string}
     */
    getSeperator(editor) {
        // Get cursor scope
        let cursorScope = this.getCursorScope(editor);

        if (cursorScope === 'stylus') {
            return ` = `;
        }

        return ': ';
    },

    /**
     * Get the appropriate line ending
     * @param  {object} editor
     * @return {string}
     */
    getSuffix(editor) {
        // Get cursor scope
        let cursorScope = this.getCursorScope(editor);

        if (cursorScope === 'scss' || cursorScope === 'less' || cursorScope === 'css') {
            return `;`;
        }

        return '';
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
     * Test if a string is a HEX colour
     * @param  {string}  string
     * @return {boolean}
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
     * @param  {string}  string
     * @return {boolean}
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
     * @param  {string}  string
     * @return {boolean}
     */
    isRgba(string) {
        const regex = /^rgba\((\d{1,3}),[ ]{0,2}(\d{1,3}),[ ]{0,2}(\d{1,3}),[ ]{0,2}([\d.]{1,3})\)$/gi;

        if (!regex.exec(string)) {
            return false;
        }

        return true;
    },

    /**
     * Get cursor scope
     * @param  {object} editor
     * @return {string}
     */
    getCursorScope(editor) {
        const scopeDescriptor = editor.getLastCursor().getScopeDescriptor();

        if (typeof scopeDescriptor.scopes === 'undefined') {
            return [];
        }

        const allowedScopes = ['scss', 'sass', 'less', 'stylus'];

        for (let s = 0; s < scopeDescriptor.scopes.length; s++) {
            const scope = scopeDescriptor.scopes[s];

            for (var as = 0; as < allowedScopes.length; as++) {

                const allowedScope = allowedScopes[as];

                if (scope.includes(allowedScope)) {
                    return allowedScope;
                }
            }
        }

        return 'css';
    },

    /**
     * Get the file type of the current active document
     * @return {string}
     */
    getFiletype() {
        if (!this.editor.buffer.file) {
            return '';
        }

        return this.editor.buffer.file.path.split('.').pop();
    },

    /**
     * Convert rgba() or rgb() to hex
     * @param  {string} color
     * @return {string}
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
     * @param  {string} color
     * @return {string}
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
     * @param  {string} color
     * @return {string}
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
     * @param  {string} hex
     * @param  {boolean} includeAlpha Do we want to include alpha?
     * @return {string}
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
     * @param  {string} rgb
     * @return {string}
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
     * @param  {string} rgb
     * @param  {boolean} includeAlpha Do we want to include alpha?
     * @return {string}
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
