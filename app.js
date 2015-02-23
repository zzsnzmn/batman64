var grid = require('monome-grid')();
var easymidi = require('easymidi');

function Sequencer() {
    this.current_pad = 0;
    this.output = new easymidi.Output('grid out', true);
    this.input = new easymidi.Input('grid in', true);
    this.steps = create2DArray(16, 32);
    this.ticks = 0;
    this.play_position = 0;
    this.next_position = 0;
    this.loop_start = 0;
    this.loop_end = 7;
    this.cutting = false;
    this.keys_held = 0;
    this.key_last = 0;
    this.dirty = true;

    this.reset = function () {
        this.dirty = true;
        this.ticks = 0;
        this.play_position = 0;

        if (this.loop_start) {
            this.play_position = this.loop_start;
        }
    };

    this.row_on = function (position) {
        for (var y=0; y < 15; y++) {
            if(sequencer.steps[y][position] == 1) {
                this.trigger('noteon', y);
            }
        }
    };

    this.row_off = function (position) {
        for (var y=0; y < 15; y++) {
            if(sequencer.steps[y][position] == 1) {
                this.trigger('noteoff', y);
            }
        }
    };

    this.trigger = function (type, i) {
        this.output.send(type, {
            note: 36 + i,
            velocity: 100,
            channel: 0
        });
    };

    this.handle_press = function(x, y, s) {
        if(s === 1 && y < 4) {
            this.steps[this.current_pad][this.press_to_index(x, y)] ^= 1;
            this.dirty = true;
        } else if (y > 3 && x < 4) {
            if (s == 1) {
                this.current_pad = this.get_4x4_press(y-4, x);
                this.trigger('noteon', this.current_pad);
                this.dirty = true;
            } else {
                this.trigger('noteoff', this.get_4x4_press(y-4, x))
            }
        }
    };

    this.get_4x4_press = function (row, col) {
       return (row * 4) + col;
    };
    
    this.draw_sequence = function(display, sequence) {
        for (var i = 0; i < 32; i++) {
            var row = Math.floor(i/8);
            display[row][i%8] = sequence[i] * 15;
        }
    };
    
    this.draw_play_position = function(display, position) {
        var row = Math.floor(position/8);
        display[row][position%8] = 15;
    }


    this.draw_4x4 = function(display) {
        var row = Math.floor(this.current_pad/4) + 4;
        display[row][this.current_pad%4] = 14;

        for (var i = 0; i < 16; i++) {
            if (this.steps[i][this.play_position] == 1) {
                var row = Math.floor(i/4) + 4;
                display[row][i%4] = 8
            }
        }
    }

    this.update_display = function() {
        var led = create2DArray(8, 8);
        var highlight = 0;

        this.draw_sequence(led, this.steps[this.current_pad]);
        this.draw_play_position(led, this.play_position);

        this.draw_4x4(led);

        grid.refresh(led);
        this.dirty = false;

    };

    this.handle_pulse = function() {
        this.ticks++;
        if (this.ticks % 6 != 0) {
            return;
        }

        if (this.play_position === 31) {
            this.play_position = 0;
        } else {
            this.play_position++;
        }

        // TRIGGER THE BUSINESS
        var last_play_position = this.play_position - 1;
        if(last_play_position === -1) {
            last_play_position = 31;
        }
        for(var y = 0; y < 15; y++){
            this.row_off(last_play_position);
            this.row_on(this.play_position);
        }

        this.cutting = false;
        this.dirty = true;
    }

    this.press_to_index = function (x, y) {
        return x + (y * 8)
    }

};

var sequencer = new Sequencer();

sequencer.input.on('start', function () {
    sequencer.reset();
    sequencer.row_on(sequencer.play_position);
});

sequencer.input.on('position', function (data) {
    if(data.value != 0)
        return;
    sequencer.reset();
});

sequencer.input.on('clock', function() {
    sequencer.handle_pulse();
});


function refresh() {
    if (sequencer.dirty) {
        sequencer.update_display()
    }
}

// call refresh 60 times per second
setInterval(refresh, 1000/60);

grid.key(function (x, y, s) {
    sequencer.handle_press(x, y, s);
});

function create2DArray(sizeY, sizeX) {
    var arr = [];
    for (var y=0;y<sizeY;y++) {
        arr[y] = [];
        for (var x=0;x<sizeX;x++) {
            arr[y][x] = 0;
        }
    }
    return arr;
}

