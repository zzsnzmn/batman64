var fs = require('fs');

function get(name) {
  var file = './presets/' + name + '.json';
  try {
    return JSON.parse(fs.readFileSync(file).toString());
  }
  catch (e) {
    console.log("whoops, doesn't exist");
    return create3DArray(16, 16, 32);
  }
}
function set(name, data) {
  fs.writeFile('./presets/'+name+'.json', JSON.stringify(data));
}

// set(1, create3DArray(16, 16, 32));
// set(2, create3DArray(16, 16, 32));
// set(3, create3DArray(16, 16, 32));
// set(4, create3DArray(16, 16, 32));

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

module.exports = {get: get,
                  set: set}
