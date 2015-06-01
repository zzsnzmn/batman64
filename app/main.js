var Sequencer = require('./Sequencer');

var sequencer = new Sequencer();

sequencer.initialize();

function refresh() {
  sequencer.update();
}

// call refresh 60 times per second
setInterval(refresh, 1000/60);

sequencer.grid.key(function (x, y, s) {
        sequencer.handle_press(x, y, s);
});

