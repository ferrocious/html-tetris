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

protoWell.calculatedScore = function(func) {
    func = func || function (maxHeight, aggrHeight, holes, bumps, fullRows) {
        return 20 * maxHeight + 1.2 * aggrHeight + 25 * holes + bumps - 120 * fullRows;
    }
    return func(this.maxHeight(), this.aggregateHeight(), this.holes(), this.bumpiness(), this.fullRowsCount());
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
