protoWell.calculatedScore = function(func) {
    var width = this.width,
        depth = this.depth,
        auxColumn = new Array(depth).fill(0),
        holes = 0, bumps = 0, aHeight = 0, maxHeight = 0, fullRows = 0,
        leftColHeight, thisColHeight,
        x, y;
        func = func || 
        function (maxHeight, aggrHeight, holes, bumps, fullRows) {
            return 20 * maxHeight + 1.2 * aggrHeight + 25 * holes + bumps - 120 * fullRows;
        }
    
    function analyzeColumn(x) {
        thisColHeight = depth;
        for ( var y = depth - 1; y > 0; y--) {
            if ( (this.wellArray[y][x]) && (!(this.wellArray[y-1][x]) ) )
                holes++;
            if (!(this.wellArray[y][x]))
                thisColHeight = y;
            auxColumn[y] = auxColumn[y] || this.wellArray[y][x];
        }
        thisColHeight = depth - thisColHeight;
    }
    
    analyzeColumn.call(this, 0);
    for (x = 1; x < width; x++)
        {
            leftColHeight = thisColHeight;
            aHeight += thisColHeight;
            maxHeight = Math.max(maxHeight, thisColHeight);
            analyzeColumn.call(this, x);
            bumps += Math.abs(thisColHeight - leftColHeight);
        }
    aHeight += thisColHeight;
    maxHeight = Math.max(maxHeight, thisColHeight);
    for (y = 0; y < depth; y++)
        if (!(auxColumn[y]))
            fullRows++;
    var result = func(maxHeight, aHeight, holes, bumps, fullRows);
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