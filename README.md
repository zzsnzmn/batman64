# batman64
monome 64 step sequencer based on the drum rack mode for ableton push

### setup

install monome-grid and easymidi:

```
npm install
```

**note** i had trouble getting monome-grid running on node version 0.12. if you find you're having issue with the uvrun package, i recommend installing nvm and using node version 0.11 or 0.10.

### usage

batman uses a virtual midi device and responds to midi clock. in order to use your DAW/midi sequencer will need to receive note messages from midi device named `batman out` and send clock messages to a device called `batman in`.

![midi_setup](/midi_setup.png?raw=true "midi_setup")

the top 4 rows are used as a step editor.
the bottom left quadrant is a 4x4 drum pad style midi trigger.
the bottom right quadrant selects the currently playing track.

hitting a pad on the bottom left will show the sequence for that given pad.

