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
            main(Math, images);
        }
    };
    check();
};

var main = function(Math, images) {
    var canvas = document.getElementById("world");
    gl2dlib.fitWindow(canvas);
    var scene = new gl2dlib.Scene(canvas);
    var gl = scene.gl;
    var textures = gl2dlib.createTextures(gl, images);

    var spritePool = new gl2dlib.Pool(function() {
        var sprite = new gl2dlib.Sprite(textures["texture.png"]);
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

    scene.update = function() {
        for (var i = 0; i < 4; i++) {
            var sprite = spritePool.get();
            sprite.x = 0;
            sprite.y = 0;
            sprite.d = scene.frame*0.1 + Math.PI*0.5*i;
            scene.addChild(sprite);

            sprite = spritePool.get();
            sprite.x = 0;
            sprite.y = 0;
            sprite.d = scene.frame*-0.1 + Math.PI*0.5*i;
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
