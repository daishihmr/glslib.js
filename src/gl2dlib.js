/** @namespace */
var gl2dlib = {};

(function(mat4, undefined) {

/**
 * @constructor
 * @param {HTMLCanvasElement} canvas
 */
gl2dlib.Scene = function(canvas) {
    /** @type {WebGLRenderingContext} */
    this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    /** @type {WebGLRenderingContext} */
    var gl = this.gl;
    if (!gl) {
        window.alert("failed initialize WebGL");
        throw new Error("failed initialize WebGL.");
    }

    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    var program = this.program = createProgram(
        gl,
        createShader(gl, "vs", VERTEX_SHADER),
        createShader(gl, "fs", FRAGMENT_SHADER));

    var attrPosition = gl.getAttribLocation(program, "position");
    var positionBuffer = createVbo(gl, VERTICES);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(attrPosition);
    gl.vertexAttribPointer(attrPosition, 3, gl.FLOAT, false, 0, 0);

    var attrTexCoord = gl.getAttribLocation(program, "texCoord");
    var texCoordBuffer = createVbo(gl, TEXTURE_COORDS);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(attrTexCoord);
    gl.vertexAttribPointer(attrTexCoord, 2, gl.FLOAT, false, 0, 0);

    this.viewMat = mat4.identity(mat4.create());
    this.projMat = mat4.identity(mat4.create());

    mat4.lookAt([0,0,16], [0,0,0], [0,1,0], this.viewMat)
    mat4.ortho(-16, 16, -16, 16, 0.1, 32, this.projMat);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1f(gl.getUniformLocation(program, "texture"), 0);

    this.uniformLocationsForSprite = getUniformLocationsForSprite(gl, program, ["status"]);

    this.updateMatrix();

    this.children = [];
    this._removedChildren = [];

    this.frame = 0;

    this.update = function() {};
};

/**
 * 
 */
gl2dlib.Scene.prototype.updateMatrix = function() {
    var gl = this.gl;
    var program = this.program;

    var temp = mat4.create();
    mat4.multiply(this.projMat, this.viewMat, temp);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "pvMat"), false, temp);
};

/**
 * 
 */
gl2dlib.Scene.prototype._update = function() {
    this.update();

    var children = this.children;
    var removedChildren = this._removedChildren;

    for (var i = 0, len = children.length; i < len; i++) {
        var c = children[i];
        c._update();
    }

    for (var i = 0, len = removedChildren.length; i < len; i++) {
        var index = this.children.indexOf(removedChildren[i]);
        if (index != -1) children.splice(index, 1);
    }
    this._removedChildren = [];

    this.frame++;
};

/**
 * 
 */
gl2dlib.Scene.prototype._draw = function() {
    var children = this.children;
    var gl = this.gl;
    var program = this.program;
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i = 0, len = children.length; i < len; i++) {
        children[i]._draw(gl);
    }

    gl.flush();
};

/**
 * 
 */
gl2dlib.Scene.prototype.clear = function() {
    var gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
};

/**
 * @param {gl2dlib.Sprite} sprite
 */
gl2dlib.Scene.prototype.addChild = function(sprite) {
    var c = this.children;
    c[c.length] = sprite;
    sprite.parent = this;
    sprite.uniforms = this.uniformLocationsForSprite;
};

/**
 * @param {gl2dlib.Sprite} sprite
 */
gl2dlib.Scene.prototype.removeChild = function(sprite) {
    if (sprite.parent !== this) return;
    sprite.parent = null;
    this._removedChildren[this._removedChildren.length] = sprite;
    sprite.onremoved();
};

/**
 * @constructor
 * @param {WebGLTexture=} texture
 */
gl2dlib.Sprite = function(texture) {
    this.age = 0;
    this.parent = null;

    this.x = 0;
    this.y = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = 0;

    this.texX = 0;
    this.texY = 0;
    this.texScale = 1;

    this.visible = true;

    this.alpha = 1;
    this.glow = 0;

    this.texture = null;
    if (texture) {
        this.texture = texture;
    }

    this.uniforms = {};
    this.status = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

    this.update = function() {};
    this.onremoved = function() {};
};

/**
 *
 */
gl2dlib.Sprite.prototype._update = function() {
    this.update();
};

/**
 * @param {WebGLRenderingContext} gl
 */
gl2dlib.Sprite.prototype._draw = function(gl) {
    if (!this.visible) return;

    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    this.status[0] = this.x;
    this.status[1] = this.y;
    this.status[2] = this.scaleX;
    this.status[3] = this.scaleY;
    this.status[4] = this.rotation;
    this.status[5] = this.texX;
    this.status[6] = this.texY;
    this.status[7] = this.texScale;
    this.status[8] = this.alpha;
    gl.uniformMatrix4fv(this.uniforms["status"], false, this.status);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};

/**
 * @param {HTMLElement} domElement
 */
gl2dlib.fitWindow = function(domElement) {
    domElement.style.position = "absolute";
    domElement.style.top = 0;
    domElement.style.left = 0;
    if (window.innerHeight < window.innerWidth) {
        domElement.width = window.innerHeight;
        domElement.height = window.innerHeight;
    } else {
        domElement.width = window.innerWidth;
        domElement.height = window.innerWidth;
    }
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {Image} image
 */
gl2dlib.createTexture = function(gl, image) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
};

/**
 * @param {WebGLRenderingContext} gl
 * @param {Object.<string,Image>} images
 */
gl2dlib.createTextures = function(gl, images) {
    var result = {};
    for (var key in images) {
        result[key] = gl2dlib.createTexture(gl, images[key]);
    }
    return result;
};

/**
 * @constructor
 * @param {function():*} generatingFunction
 * @param {number=} initialSize
 * @param {number=} incremental
 */
gl2dlib.Pool = function(generatingFunction, initialSize, incremental) {
    this.generatingFunction = generatingFunction;
    this.incremental = incremental || 100;

    this._pool = [];
    for (var i = 0, len = initialSize || 100; i < len; i++) {
        this._pool[this._pool.length] = generatingFunction();
    }
};

/**
 * @return {*}
 */
gl2dlib.Pool.prototype.get = function() {
    var p = this._pool.pop();
    if (p) {
        return p;
    } else {
        for (var i = 0; i < this.incremental; i++) {
            this._pool[this._pool.length] = this.generatingFunction();
        }
        return this._pool.pop();
    }
};

/**
 * param {*} obj
 */
gl2dlib.Pool.prototype.dispose = function(obj) {
    this._pool[this._pool.length] = obj;
};

/**
 * @param {WebGLRenderingContext} gl
 * @param {Array.<number>} data
 */
function createVbo(gl, data) {
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} vs
 * @param {WebGLShader} fs
 * @return {WebGLProgram}
 */
function createProgram(gl, vs, fs) {
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.useProgram(program);
        return program;
    } else {
        alert(gl.getProgramInfoLog(program));
        throw new Error();
    }
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {string} type
 * @param {string} script
 * @return {WebGLShader}
 */
function createShader(gl, type, script) {
    var shader;
    switch (type) {
        case "vs":
            shader = gl.createShader(gl.VERTEX_SHADER);
            break;
        case "fs":
            shader = gl.createShader(gl.FRAGMENT_SHADER);
            break;
        default:
            throw new Error();
    }

    gl.shaderSource(shader, script);
    gl.compileShader(shader);

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    } else {
        alert(gl.getShaderInfoLog(shader));
        throw new Error();
    }
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} program
 * @param {Array.<string>} names
 */
function getUniformLocationsForSprite(gl, program, names) {
    var result = {};
    names.map(function(name) {
        result[name] = gl.getUniformLocation(program, name);
    });
    return result;
}

var VERTICES = [
    -1,  1, 0,
    -1, -1, 0,
     1,  1, 0,
     1, -1, 0
];

var TEXTURE_COORDS = [
    0, 0,
    0, 64/512,
    64/512, 0,
    64/512, 64/512
];

var VERTEX_SHADER = "\n\
attribute vec3 position;\n\
attribute vec2 texCoord;\n\
uniform mat4 pvMat;\n\
uniform mat4 status;\n\
varying vec2 vTextureCoord;\n\
varying float vAlpha;\n\
\n\
mat4 model(vec2 xy, vec2 scale, float rot) {\n\
    mat4 result = mat4(\n\
        1.0, 0.0, 0.0, 0.0,\n\
        0.0, 1.0, 0.0, 0.0,\n\
        0.0, 0.0, 1.0, 0.0,\n\
        0.0, 0.0, 0.0, 1.0\n\
    );\n\
    result = result * mat4(\n\
        1.0, 0.0, 0.0, 0.0,\n\
        0.0, 1.0, 0.0, 0.0,\n\
        0.0, 0.0, 1.0, 0.0,\n\
        xy.x, xy.y, 0.0, 1.0\n\
    );\n\
    result = result * mat4(\n\
        scale.x, 0.0, 0.0, 0.0,\n\
        0.0, scale.y, 0.0, 0.0,\n\
        0.0, 0.0, 1.0, 0.0,\n\
        0.0, 0.0, 0.0, 1.0\n\
    );\n\
    result = result * mat4(\n\
        cos(radians(rot)), -sin(radians(rot)), 0.0, 0.0,\n\
        sin(radians(rot)), cos(radians(rot)), 0.0, 0.0,\n\
        0.0, 0.0, 1.0, 0.0,\n\
        0.0, 0.0, 0.0, 1.0\n\
    );\n\
    return result;\n\
}\n\
\n\
void main(void) {\
    vAlpha = status[1][3];\n\
    vTextureCoord = (texCoord * status[2][0]) + vec2(status[1][1]*0.125, status[1][2]*0.125);\n\
    gl_Position = pvMat * model(vec2(status[0][0], status[0][1]), vec2(status[0][2], status[0][3]), status[1][0]) * vec4(position, 1.0);\n\
}\n\
";

var FRAGMENT_SHADER = "\
precision mediump float;\n\
\n\
uniform sampler2D texture;\n\
varying vec2 vTextureCoord;\n\
varying float vAlpha;\n\
\n\
void main(void) {\n\
    vec4 col = texture2D(texture, vTextureCoord);\n\
    gl_FragColor = clamp(vec4(col.rgb, col.a * vAlpha), 0.0, 1.0);\n\
}\n\
";

})(mat4);
