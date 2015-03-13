var grid = require('monome-grid')();
var easymidi = require('easymidi');

function Sequencer() {
    this.current_pad = 0;
    this.output = new easymidi.Output('batman out', true);
    this.input = new easymidi.Input('batman in', true);
    this.steps = create3DArray(16, 16, 32);
    this.current_loop = 0;
    this.ticks = 0;
    this.play_position = 0;
    this.next_position = 0;
    this.loop_start = 0;
    this.loop_end = 7;
    this.cutting = false;
    this.keys_held = 0;
    this.key_last = 0;
    this.dirty = true;
}

Sequencer.prototype = {
    reset: function() {
        this.dirty = true;
        this.ticks = 0;
        this.play_position = 0;

        if (this.loop_start) {
            this.play_position = this.loop_start;
        }
    },
    row_on: function(position) {
        for (var y=0; y < 15; y++) {
            if(this.steps[this.current_loop][y][position] == 1) {
                this.trigger('noteon', y);
            }
        }
    },
    row_off: function(position) {
        for (var y=0; y < 15; y++) {
            if(this.steps[this.current_loop][y][position] == 1) {
                this.trigger('noteoff', y);
            }
        }
    },
    trigger: function(type, i) {
        this.output.send(type, {
            note: 36 + i,
            velocity: 100,
            channel: 0
        });
    },
    handle_press: function(x, y, s) {
        if(s === 1 && y < 4) {
            this.steps[this.current_loop][this.current_pad][this.press_to_index(x, y)] ^= 1;
            this.dirty = true;
        } else if (y > 3 && x < 4) {
            if (s == 1) {
                this.current_pad = this.get_4x4_press((y-4), x);
                this.trigger('noteon', this.current_pad);
                this.dirty = true;
            } else {
                this.trigger('noteoff', this.get_4x4_press(y-4, x))
            }
        } else if (y > 3 && x > 3) {
            if (s == 1) {
                this.current_loop = this.get_4x4_press(y-4, x-4)
            }
        }
    },
    get_4x4_press: function(row, col) {
       // row ^= 3;
       return ((row^3) * 4) + col;
    },
    get_4x4_display_row: function(index, offset) {
        // Turn 0/1/2/3 -> 0, 4/5/6/7 -> 1, 8/9/10/11 -> 2, 12/13/14/15 -> 3
        // switch 0 -> 3; 1 -> 2 ; 2 -> 1; 3 -> 0;
        // then add 4 as an offset
        return (Math.floor(index/4) ^ 3) + offset;
    },
    get_4x4_display_col: function(index, offset) {
        return (index % 4) + offset;
    },
    draw_sequence: function(display, sequence) {
        for (var i = 0; i < 32; i++) {
            var row = Math.floor(i/8);
            display[row][i%8] = sequence[i] * 15;
        }
    },
    draw_play_position: function(display, position) {
        var row = Math.floor(position/8);
        display[row][position%8] = 15;
    },
    draw_4x4: function(display) {
        // var row = Math.floor(this.current_pad/4) + 4;
        // draw active notes
        var x_offset = 0;
        var y_offset = 4;
        var row = this.get_4x4_display_row(this.current_pad, y_offset);
        var col = this.get_4x4_display_col(this.current_pad, x_offset);
        display[row][col] = 14;

        for (var i = 0; i < 16; i++) {
            if (this.steps[this.current_loop][i][this.play_position] == 1) {
                row = this.get_4x4_display_row(i, y_offset);
                col = this.get_4x4_display_col(i, x_offset);
                display[row][col] = 8
            }
        }

        // draw current loop
        x_offset = 4;
        row = this.get_4x4_display_row(this.current_loop, y_offset);
        col = this.get_4x4_display_col(this.current_loop, x_offset);
        display[row][col] = 14;
    },
    update_display: function() {
        var led = create2DArray(8, 8);
        var highlight = 0;
        
        this.draw_sequence(led, this.steps[this.current_loop][this.current_pad]);
        this.draw_play_position(led, this.play_position);

        this.draw_4x4(led);

        grid.refresh(led);
        this.dirty = false;

    },
    handle_pulse: function() {
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
    },
    press_to_index: function(x, y) {
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

function create3DArray(sizeZ, sizeY, sizeX) {
    var arr = [];
    for (var z=0; z<sizeZ;z++) {
        arr[z] = create2DArray(sizeY, sizeX);
    }
    return arr;
}
