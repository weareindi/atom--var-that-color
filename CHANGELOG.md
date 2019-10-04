# Change Log
All notable changes to this project will be documented in this file.

## [0.4.0]
- Add support for custom css variables and stylus
- Use cursor scope instead of file extension to determine variable output
- Additional: Special thanks to GitHub user [mrleblanc101](https://github.com/mrleblanc101) for the feedback and requests (issues) to make this package better.

## [0.3.0]
- Allow for preserving input values
- Allow for rgba output
- Remove sass line ending semi-colon

## [0.2.3]
- Allow for closing semi-colon

## [0.2.2]
- Update this changelog

## [0.2.1]
- Fix 'Uncaught TypeError: Cannot read property 'map' of null' raised by user 'xperiments'.
    Trying to convert nothing fired the error.
    I've added an more reasonable error notification. If users would rather this failed silently let me know.

## [0.2.0]
- Add config to allow user to define output type (HEX or RGB)

## [0.1.2]
- Add support for 3 digit hex codes

## [0.1.1]
- Change colour output to use input value rather than 'Name That Color (NTC)' closest match value.

## [0.1.0]
- Initial release
