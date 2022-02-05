'use strict';

const Homey = require('homey');
const linear = require('everpolate').linear;

class Colormapping {
    setColorMap() {
        try {
            let colormap = Homey.ManagerSettings.get('huecolormap');
            if (colormap != null && colormap != "") {
                let maps = colormap.split(',');
                this.colormapinput = [];
                this.colormapoutput = [];
                maps.forEach((map) => {
                    let maparray = map.split(':');
                    if (maparray.length === 2) {
                        this.colormapinput.push(parseFloat(maparray[0]));
                        this.colormapoutput.push(parseFloat(maparray[1]));
                    }
                });
            }
        }
        catch (ex) {
            this.logToHomey(ex);
        }
    }

    getColorMap(input) {
        if (this.colormapinput != null) {
            return linear(input, this.colormapinput, this.colormapoutput);
        }
        return input;
    }

    getReverseColorMap(input) {
        if (this.colormapinput != null) {
            return linear(input, this.colormapoutput, this.colormapinput);
        }
        return input;
    }

    interpolateArray(x, input, output) {
        let value = x;
        var index = input.findIndex(n => n > x); // first value bigger then desired value
        if (index > 1) {
            value = this.interpolate(
                x,
                parseFloat(input[index - 1]),
                parseFloat(input[index]),
                parseFloat(output[index - 1]),
                parseFloat(output[index]));
        }
        return value;
    }

    interpolate(x, x0, x1, y0, y1) {
        let yrange = y1 - y0;
        let xrange = x1 - x0;
        let xoffset = x = x0;

        let value = y0 + xoffset * yrange / xrange;
        return value;
    }

    // Array check.
    _isArray(a) {
        return !!a && a.constructor === Array;
    }
}

module.exports = Colormapping;