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
    var scene = new glslib.Scene(canvas);
    var gl = scene.gl;
    var textures = glslib.createTextures(gl, images);

    var spritePool = new glslib.Pool(function() {
        var sprite = new glslib.Sprite(textures["texture.png"]);
        sprite.texX = 2;
        sprite.texY = 0;
        sprite.scaleX = sprite.scaleY = 2;
        sprite.glow = 0.5;
        sprite.d = 0;
        sprite.update = function() {
            this.x += Math.cos(this.d) * 0.1;
            this.y += Math.sin(this.d) * 0.1;
            if (this.x < -17 || 17 < this.x || this.y < -17 || 17 < this.y) {
                scene.removeChild(this);
                spritePool.dispose(this);
            }
        };
        return sprite;
    }, 1000)

    scene.update = function() {
        if (this.frame % 100 === 0) {
            var s = spritePool.get();
            s.x = 0;
            s.y = 0;
            s.d = Math.random() * Math.PI * 2;
            this.addChild(s);
        }
    };

    var tick = function() {
        scene._update();
        scene._draw();
        setTimeout(tick, 1000/60);
    };
    tick();
};
