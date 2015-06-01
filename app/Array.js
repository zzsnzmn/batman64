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

module.exports = {
  create2DArray: create2DArray,
  create3DArray: create3DArray
}
