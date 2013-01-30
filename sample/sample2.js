var ASSETS = [ "texture.png" ];
window.onload = function() {
    var images = {};
    var loaded = [];
    for (var i = 0, len = ASSETS.length; i < len; i++) {
        loaded[i] = false;
        var img = new Image();
        img.src = ASSETS[i];
        img.assetIndex = i;
        img.onload = function() {
            loaded[this.assetIndex] = true;
            images[ASSETS[this.assetIndex]] = this;
        };
    }

    var check = function() {
        if (loaded.some(function(l) { return !l; })) {
            setTimeout(check, 100);
        } else {
            main(images);
        }
    };
    check();
};

var main = function(images) {
    var Math = window.Math;

    var canvas = document.getElementById("world");
    glslib.fitWindow(canvas);
    var scene = new glslib.Scene(canvas, images["texture.png"]);

    var sprite = new glslib.Sprite();
    sprite.texX = 2;
    sprite.texY = 0;
    sprite.scaleX = sprite.scaleY = 2;
    sprite.glow = 0.5;
    sprite.d = 0;
    sprite.update = function() {
    };
    sprite.x = 0;
    sprite.y = 0;
    scene.addChild(sprite);

    var tick = function() {
        scene._update();
        scene._draw();
        setTimeout(tick, 1000);
    };
    tick();
};
