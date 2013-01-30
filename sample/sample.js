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
    var gl = scene.gl;
    var textures = glslib.createTextures(gl, images);

    var spritePool = new glslib.Pool(function() {
        var sprite = new glslib.Sprite();
        sprite.texX = 1;
        sprite.texY = 1;
        sprite.scaleX = sprite.scaleY = 0.5;
        sprite.d = 0;
        sprite.update = function() {
            this.x += Math.cos(this.d) * 0.2;
            this.y += Math.sin(this.d) * 0.2;
            if (this.x < -17 || 17 < this.x || this.y < -17 || 17 < this.y) {
                scene.removeChild(this);
                spritePool.dispose(this);
            }
        };
        return sprite;
    }, 1000)

    var u = Math.PI*2/12;
    scene.update = function() {
        for (var i = 0; i < 12; i++) {
            var sprite = spritePool.get();
            sprite.x = 0;
            sprite.y = 0;
            sprite.d = scene.frame*0.1 + u*i;
            scene.addChild(sprite);

            sprite = spritePool.get();
            sprite.x = 0;
            sprite.y = 0;
            sprite.d = scene.frame*-0.1 + u*i;
            scene.addChild(sprite);
        }
    };

    var tick = function() {
        scene._update();
        scene._draw();
        setTimeout(tick, 1000/60);
    };
    tick();
};
