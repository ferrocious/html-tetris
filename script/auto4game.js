protoWell.columnTop = function() {
    var result = new Array(this.width).fill(this.depth), x, y;
    for (x = 0; x < this.width; x++) 
        for (y = 0; y < this.depth; y++) {
            if ( !( this.freeAt(x, y) ) ) {
                result [x] = y;
                break;
            }
        }
    return result;
}
    
protoWell.maxHeight = function() {
    return this.depth - Math.min.apply(this, this.columnTop());
}
    
protoWell.aggregateHeight = function() {
    var depth = this.depth,
        columnTop = this.columnTop();
    return columnTop.reduce(function (a,b) {
        return a + depth - b;
    }, 0);
}
    
protoWell.fullRowsCount = function() {
    var result = 0;
    for (var y=0; y < this.depth; y++)
        result += this.isRowFull(this.wellArray[y]) ? 1 : 0;
    return result;
}

protoWell.holes = function() {
    var result = 0, x, y;
    for (x = 0; x< this.width; x++)
        for (y = 1; y < this.depth; y++)
            if (this.freeAt (x, y) && !(this.freeAt(x, y-1)) )
                result++;
    return result;
}

protoWell.bumpiness = function() {
    var heightArray = this.columnTop(), sum = 0, x;
    for (x = 0; x < this.width - 1; x++)
        sum += Math.abs(heightArray[x+1] - heightArray[x]);
    return sum;
}

/*protoWell.calculatedScore = function(func) {
    var a = performance.now(), b;
    func = func || function (maxHeight, aggrHeight, holes, bumps, fullRows) {
        return 20 * maxHeight + 1.2 * aggrHeight + 25 * holes + bumps - 120 * fullRows;
    }
    var result = func(this.maxHeight(), this.aggregateHeight(), this.holes(), this.bumpiness(), this.fullRowsCount());
    b = performance.now();
    console.log("The function needed " + (b-a) + "ms.");
    return result;
} */

/*
function transposeArray(array){
        arrayLength = array[0].length;
        var newArray = [];
        for(var i = 0; i < arrayLength; i++){
            newArray.push([]);
        };

        for(i = 0; i < array.length; i++){
            for(var j = 0; j < arrayLength; j++){
                newArray[j].push(array[i][j]);
            };
        };
        return newArray;
}



*/

protoWell.calculatedScore = function(func) {
    var a = performance.now(), b;
    function transposeArray(array){
        arrayLength = array[0].length;
        var newArray = [];
        for(var i = 0; i < arrayLength; i++){
            newArray.push([]);
        };

        for(i = 0; i < array.length; i++){
            for(var j = 0; j < arrayLength; j++){
                newArray[j].push(array[i][j]);
            };
        };
        return newArray;
    }
    func = func || 
        function (maxHeight, aggrHeight, holes, bumps, fullRows) {
            return 20 * maxHeight + 1.2 * aggrHeight + 25 * holes + bumps - 120 * fullRows;
        }
    function analyzeColumn(columnNumber) {
        var column = transposedWell[columnNumber];
        thisColHeight = depth;
        for ( var y = depth - 1; y > 0; y--) {
            if ( (column[y]) && (!(column[y-1])) )
                holes++;
            if (!(column[y]))
                thisColHeight = y;
            if (columnNumber > 0)
                column[y] = column [y] || transposedWell[columnNumber - 1][y];
        }
        thisColHeight = depth - thisColHeight;
    }
    
    var transposedWell = transposeArray(this.wellArray),
        width = transposedWell.length,
        depth = transposedWell[0].length,
        holes = 0, bumps = 0, aHeight = 0, maxHeight = 0, fullRows = 0,
        leftColHeight, thisColHeight,
        x, y;
    analyzeColumn(0);
    for (x = 1; x < width; x++)
        {
            leftColHeight = thisColHeight;
            aHeight += thisColHeight;
            maxHeight = Math.max(maxHeight, thisColHeight);
            analyzeColumn(x);
            bumps += Math.abs(thisColHeight - leftColHeight);
        }
    aHeight += thisColHeight;
    maxHeight = Math.max(maxHeight, thisColHeight);
    for (y = 0; y < depth; y++)
        if (!(transposedWell[width - 1][y]))
            fullRows++;
    var result = func(maxHeight, aHeight, holes, bumps, fullRows);
    b = performance.now();
    console.log("The function needed " + (b-a) + "ms.");
    return result;
    
}

protoBrick.findBestPlace = function(func) {
    var oldWell = this.myWorld,
        oldPos = this.pos.slice(),
        y = this.pos[1],
        well = this.myWorld.clone(),
        bestScore = Infinity,
        bestPlace,
        score;
    this.myWorld = well;
// testing all four possible orientations...
    for (var a = 0; a < 4; a++) {
// and all possible positions...
        for (var x = 0; x < well.width; x++) {
            this.pos = [x, y];
            if (!(this.collision(this.xy, this.pos))) {
                    this.drop();
                    this.myWorld.update(this);
                    score = this.myWorld.calculatedScore(func);
                    this.myWorld.remove(this);
                    if (score < bestScore) {
                        bestScore = score;
                        bestPlace = {
                            position: [x, y],
                            angle: a
                        }
                    }
                }
        }
        this.pos = [this.myWorld.startPosition[0], y];
        this.rotate();
    }
    this.myWorld = oldWell;
    this.pos = oldPos;
    return bestPlace; 
}
