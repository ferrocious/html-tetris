// (function() {
    var $scoreHtml,
        $gameOver,
        $styleSlot,
        $well,
        $paused,
        $widthBox,
        $widthSlider,
        $setupDialog,
        paused = false,
        maxWidth,
        minWidth,
        currentWidth = 10,
        well,
        preview,
        currentBlock, 
        nextBlock,
        lineCount = 0, 
        step = 200, 
        gameLoopId = 0, 
        animationId = 0;

    function getNewBlock(well, preview) {
        currentBlock = nextBlock.rebase(well).initHtml();
        preview.clear();
        nextBlock = new HTMLBlock(preview);
        nextBlock.initHtml();
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

    function gameOver() {
        $gameOver.show();
        window.clearTimeout(gameLoopId);
        window.cancelAnimationFrame(animationId);
        currentBlock = null;
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
            $widthSlider.val($widthBox.val(curVal));
        });
    }

    function readKeyboard(e) {
        if (paused) {
            unpauseGame();
            return;
        }
        if (!(currentBlock)) return;
        switch (e.key.toLowerCase()) {
            case "a": currentBlock.moveLeft();
                break;
            case "d": currentBlock.moveRight();
                break;
            case "s": currentBlock.rotate();
                break;
            case " ": currentBlock.drop();
                break;
            case ".": currentBlock.auto();
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
        if(currentBlock)
            currentBlock.updateHtml();
        $scoreHtml.html(lineCount.toString());
        animationId = window.requestAnimationFrame(animationLoop);
    }

    function gameLoop() {
        if(currentBlock.stepDown()) {
    // if it can fall, let it
            gameLoopId = setTimeout (gameLoop, step);
        } else {
    // and if it cannot: update the well with new bricks,
            currentBlock.updateHtml();     
    /* that additional updateHtml, out of the animation loop, is necessary, as, every now and then, 
    weird timing would make a brick "killed" before the last update of the graphical representation 
    was made. Result: a brick looking as if hovering one row too high. */

            lineCount += currentBlock.done();  // The done() method, among doing other things, returns the number of lines that got completed and removed from the well.
    // get another block: can it move at all?
            getNewBlock(well, preview);
            if (currentBlock.collision(currentBlock.xy, currentBlock.pos)) {
                gameOver();
                return;
            }
        gameLoopId = setTimeout(gameLoop, step);    
        }
    }

    function resizeGame(x) {
        var width = (100 / x).toFixed(3) + "%",
            height = (50 / x).toFixed(3) + "%";
        var newcss = "#well > .brick { width: " +
            width +
            "; height: " +
            height + 
            "; }";
        well = new HTMLWell($well, x);
        $styleSlot.empty().html(newcss);
        well.fillWithRubble();
        paused = false;
    }

    function initGame() {
        lineCount = 0;
        window.clearTimeout(gameLoopId);
        well.resetDeadBlocks();
        nextBlock = new HTMLBlock(preview);
        getNewBlock(well, preview);
        unpauseGame();
    }

    function initPreview(htmlTarget) {
        preview = Object.create(well);
        preview.htmlTarget = htmlTarget;
        preview.sqHeight = ["0", "50%"];
        preview.sqWidth = ["0", "25%", "50%", "75%"];
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

        well = new HTMLWell($("#well"));
        initPreview($("#next"));
        well.fillWithRubble(); // Only for presentation, the game always starts with a nice, clean well.

    // Third, attach listeners.    
        $well.click(togglePause);
        $paused.click(togglePause);
        $gameOver.click(initGame);
        $("#left").off('click').click(readButton);
        $("#right").off('click').click(readButton);
        $("#rotate").off('click').click(readButton);
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
// })();