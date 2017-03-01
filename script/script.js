(function() {
    var $scoreHtml,
        $gameOver,
        $styleSlot,
        $well,
        $paused,
        $widthBox,
        $widthSlider,
        $setupDialog,
        paused = false,
        autoplay = false,
        maxWidth,
        minWidth,
        currentWidth = 10,
        well,
        preview,
        currentBrick, 
        nextBrick,
        lineCount = 0, 
        defaultStep = 1600,
        step = 200, 
        gameLoopId = 0, 
        animationId = 0;
    
    function pauseGame() {
        window.clearTimeout(gameLoopId);
        window.cancelAnimationFrame(animationId);
        gameLoopId = animationId = 0;
        paused = true;
    }

    function togglePause() {
        if (paused) {
            unpauseGame();
        } else {
            $paused.show();
            pauseGame();
        }
    }

    function toggleAuto() {
        autoplay = !autoplay;
        $(this).toggleClass("auto-on");
        this.blur();
    }

    function unpauseGame() {
    // Just clear all and every window possibly imposed on the well, restart the loops and reattach the keyboard listener.
        $paused.hide();
        $setupDialog.hide();
        $gameOver.hide();
        paused = false;
        gameLoopId = setTimeout(gameLoop, step);
        animationId = window.requestAnimationFrame(animationLoop);
        attachKeys();
    }

    function gameOver() {
        $gameOver.show();
        window.clearTimeout(gameLoopId);
        gameLoopId = 0;
        window.cancelAnimationFrame(animationId);
        animationId = 0;
        currentBrick = null;
    }

    function bringResizeDialog() {
        $paused.hide();
        $gameOver.hide();
        pauseGame();
        detachKeys();
        $widthBox.val(currentWidth);
        $widthSlider.val(currentWidth);
        $setupDialog.show();    
    }

    function submitWidthChange(e) {
        currentWidth = parseInt($widthBox.val());
        resizeGame(currentWidth);
        $setupDialog.hide();
        return false;
    }

    function handleWidthChange() {
    // Defines the behavior of the dialog responsible for resizing the well. Lot of stuff, so I put it in a separate function for clarity's sake.
        maxWidth = parseInt($widthBox.attr("max"));
        minWidth = parseInt($widthBox.attr("min"));
        $setupDialog.submit(submitWidthChange);
        $widthSlider.change(function(e) {
            $widthBox.val(e.target.value);
        });
        $widthBox.change(function(e) {
            var curVal = parseInt($widthBox.val());
            curVal = Math.min(curVal, maxWidth);
            curVal = Math.max(curVal, minWidth);
            $widthSlider.val(curVal);
        });
    }

/*

    function readKeyboard(e) {
        if (paused) {
            unpauseGame();
            return;
        }
        if (!(currentBrick)) return;
        switch (e.key.toLowerCase()) {
            case " ": currentBrick.drop();
                break;
            case "p": togglePause();
        }
    }


*/

    function readKeyboard(e) {
        if (paused) {
            unpauseGame();
            return;
        }
        if (!(currentBrick)) return;
        switch (e.key.toLowerCase()) {
            case "a": currentBrick.moveLeft();
                break;
            case "d": currentBrick.moveRight();
                break;
            case "s": currentBrick.rotate();
                break;
            case " ": currentBrick.drop();
                break;
            case "p": togglePause();
        }
    }

    function readButton() {
    // With a cunning usage of the HTML data attribute, we can translate from "button" to "keyboard" in one short line.
        this.blur();
        readKeyboard($(this).data());
    }

    function attachKeys() {
        $("body").off("keypress").on("keypress", readKeyboard);
    }

    function detachKeys() {
        $("body").off("keypress");
    }

    function animationLoop() {
        if(currentBrick)
            currentBrick.updateHtml();
        $scoreHtml.html(lineCount.toString());
        animationId = window.requestAnimationFrame(animationLoop);
    }

    protoBrick.playMe = function() {
        var bestPlace = this.findBestPlace();
        for (var a = 0; a < bestPlace.angle; a++) {
            this.rotate();
//            this.updateHtml();
        }
        while ( (this.getPos()[0] > bestPlace.position[0] ) && (this.moveLeft()  ) );
        while ( (this.getPos()[0] < bestPlace.position[0] ) && (this.moveRight() ) );
//            this.updateHtml();
    }

    function getNewBrick(well, preview) {
        currentBrick = nextBrick.rebase(well).initHtml();
        preview.clear();
        nextBrick = Object.create(protoHtmlBrick);
        nextBrick.init(preview);
        nextBrick.initHtml();
    }

    function gameLoop() {
        if(currentBrick.stepDown()) {
    // if it can fall, let it
            gameLoopId = setTimeout (gameLoop, step);
        } else {
    // and if it cannot: update the well with new bricks,
            currentBrick.updateHtml();
                /* that additional updateHtml, out of the animation loop, is necessary, as, every now and then, 
                weird timing would make a brick "killed" before the last update of the graphical representation 
                was made. Result: a brick looking as if hovering one row too high. */
            lineCount += currentBrick.done();  // The done() method, among doing other things, returns the number of lines that got completed and removed from the well.
                // get another block: can it move at all?
            getNewBrick(well, preview);
            if ( currentBrick.collision() ) {
                gameOver();
                return;
            }
            if (autoplay)
                currentBrick.playMe();
            gameLoopId = setTimeout(gameLoop, step);    
        }
    }

    function initGame() {
        lineCount = 0;
        window.clearTimeout(gameLoopId);
        well.resetDeadBlocks();
        nextBrick = Object.create(protoHtmlBrick);
        nextBrick.init(preview);
        getNewBrick(well, preview);
        unpauseGame();
    }

    function resizeGame(x) {
        var width = (100 / x).toFixed(3) + "%",
            height = (50 / x).toFixed(3) + "%";
        var newcss = "#well > .brick { width: " +
            width +
            "; height: " +
            height + 
            "; }";
        well = Object.create(protoHtmlWell);
        well.htmlInit(x, $well);
        step = Math.max(defaultStep / x, 20);
        $styleSlot.empty().html(newcss);
        well.fillWithRubble();
        paused = false;
    }

    function initPreview(htmlTarget) {
        preview = Object.create(protoHtmlWell);
        preview.htmlTarget = htmlTarget;
        preview.sqHeight = ["0", "50%"];
        preview.sqWidth = ["0", "25%", "50%", "75%"];
        preview.moveHtmlSquare = function (div, x, y) {
        // Simple: if movable, that is, if the indicated place in the well is unocuppied - move it.
            if((x >= this.width) || (y >= this.depth) ) return false;
            return div
                .css("left", this.sqWidth[x])
                .css("top", this.sqHeight[y]);
        }        
        preview.startPosition = [2, 0];
    }

    window.onload =  function initController() {
    // First, cache the DOM elements.    
        $well = $("#well");
        $scoreHtml = $("#score");
        $gameOver = $("#game-over");
        $styleSlot = $("#dynamic");
        $paused = $("#paused");
        $widthBox = $("#width-box");
        $widthSlider = $("#width-slider");
        $setupDialog = $("#setup-dialog");

    // Second, init the logic of the well and the preview window.    
        well = Object.create(protoHtmlWell);
        well.htmlInit(currentWidth, $well);
        initPreview($("#next"));
        well.fillWithRubble(); // Only for presentation, the game always starts with a nice, clean well.

    // Third, attach listeners.    
        $well.click(togglePause);
        $paused.click(togglePause);
        $gameOver.click(initGame);
        $("#left").off('click').click(readButton);
        $("#right").off('click').click(readButton);
        $("#rotate").off('click').click(readButton);
        $("#auto").off('click').click(toggleAuto);
        $("#new-game").click(
            function() {
                this.blur();
                initGame();
            }
        );
        handleWidthChange();
        $("#setup-width").click(bringResizeDialog);
        $("#close-width-dialog").click(unpauseGame);
    }    

})();