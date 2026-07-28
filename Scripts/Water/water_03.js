var Water = pc.createScript('water');

Water.prototype.initialize = function() {
    const self = this;

    const app = self.app;
    const device = app.graphicsDevice;
    const chunks = pc.ShaderChunks;

    const shaderTime = app.graphicsDevice.scope.resolve("globalTime");
    const reflectionCamera = app.root.findByName('Reflection Camera');
    const mainCamera = app.root.findByName('Main Camera');
    const frag = app.assets.find('waterPS', 'shader').resource;
    let material;

    let rt, rtBlur, rtBlurH, rtNormal, rtNormal2, normalShader, normalShader2;
    let planeAW, planeBW, planeCW, planeDW;
    let planeAV, planeBV, planeCV, planeDV;
    let world2refl;
    let removeReflectionCameraHooks = null;

    let time = 0;

    const tmpView = new pc.Mat4();
    const planePosV = new pc.Vec3();
    const planeNormalV = new pc.Vec3();
    const planeQ = new pc.Vec4();
    const projInv = new pc.Mat4();
    const planeV = new pc.Vec4();
    const world2reflGlobal = new pc.Mat4();
    const planePosW = new pc.Vec3();
    const planeNormalW = new pc.Vec3();

    _updateMaterial();
    _updateReflectionCamera();


    // ---------------------------------------------------------------------------------------


    self.onUpdate = update;


    // ---------------------------------------------------------------------------------------


    device.on('resizecanvas', updateRenderTargets);
    self.on('destroy', destroy);


    // ---------------------------------------------------------------------------------------


    function update(dt) {
        _syncReflectionCameraProperties();

        time += dt;
        shaderTime.setValue(time);

        pc.drawQuadWithShader(device, rtNormal, normalShader);
        pc.drawQuadWithShader(device, rtNormal2, normalShader2);
    }

    function updateRenderTargets() {
        _clearOldTargets();
        _updateMaterial();
        _updateReflectionCamera();
    }

    function destroy() {
        device.off('resizecanvas', updateRenderTargets);

        if (removeReflectionCameraHooks) {
            removeReflectionCameraHooks();
            removeReflectionCameraHooks = null;
        }

        _clearOldTargets();
    }


    // ---------------------------------------------------------------------------------------


    function _updateMaterial() {
        let texFormat = pc.PIXELFORMAT_R8_G8_B8_A8;
        if (device.isWebGL2 && device.extTextureFloatRenderable) {
            texFormat = pc.PIXELFORMAT_111110F;
        } else if (device.extTextureHalfFloatRenderable && device.extTextureHalfFloatLinear) {
            texFormat = pc.PIXELFORMAT_RGBA16F;
        }
        
        const tex = _getTexture(Math.floor(device.width * 0.5), Math.floor(device.height * 0.5), texFormat, false, pc.ADDRESS_CLAMP_TO_EDGE);
        const texBlur = _getTexture(Math.floor(tex.width * 0.5), Math.floor(tex.height * 0.5), texFormat, false, pc.ADDRESS_CLAMP_TO_EDGE);
        const texBlurH = _getTexture(Math.floor(tex.width * 0.5), Math.floor(tex.height * 0.5), texFormat, false, pc.ADDRESS_CLAMP_TO_EDGE);

        rt = new pc.RenderTarget({ colorBuffer: tex, depth: true });
        rtBlur = new pc.RenderTarget({ colorBuffer: texBlur, depth: false });
        rtBlurH = new pc.RenderTarget({ colorBuffer: texBlurH, depth: false });
        
        device.scope.resolve("waterReflTex").setValue(tex);
        device.scope.resolve("waterReflTexBlur").setValue(texBlur);
        device.scope.resolve("uvOffsetAmount").setValue(0);
        
        // ДОДАНО ДЛЯ КОЛЬОРУ ВОДИ
        device.scope.resolve("waterColor").setValue(new Float32Array([0.3, 0.7, 0.8]));
        device.scope.resolve("waterBrightness").setValue(1.5);

        // Get all required shader chunks
        const shaderChunks = pc.ShaderChunks.get(device, pc.SHADERLANGUAGE_GLSL);
        
        // For fragment shader, include the necessary chunks
        const gammaPS = shaderChunks.get('gammaPS') || '';
        const tonemappingPS = shaderChunks.get('tonemappingPS') || shaderChunks.get('tonemappingAcesPS') || '';
        const screenDepthPS = shaderChunks.get('screenDepthPS') || '';

        // Create ShaderMaterial with proper includes
        material = new pc.ShaderMaterial({
            uniqueName: 'WaterShader',
            vertexGLSL: `
                varying vec3 vPositionW;
                varying vec3 vNormalW;
                attribute vec3 vertex_position;
                attribute vec3 vertex_normal;
                attribute vec4 vertex_tangent;
                attribute vec2 vertex_texCoord0;
                attribute vec2 vertex_texCoord1;
                attribute vec4 vertex_color;
                uniform mat4 matrix_viewProjection;
                uniform mat4 matrix_model;
                uniform mat3 matrix_normal;
                vec3 dPositionW;
                mat4 dModelMatrix;
                mat3 dNormalMatrix;
                mat4 getModelMatrix() {
                    return matrix_model;
                }
                vec4 getPosition() {
                    dModelMatrix = getModelMatrix();
                    vec3 localPos = vertex_position;
                    vec4 posW = dModelMatrix * vec4(localPos, 1.0);
                    dPositionW = posW.xyz;
                    vec4 screenPos;
                    screenPos = matrix_viewProjection * posW;
                    return screenPos;
                }
                vec3 getWorldPosition() {
                    return dPositionW;
                }
                vec3 getNormal() {
                    dNormalMatrix = matrix_normal;
                    vec3 tempNormal = vertex_normal;
                    return normalize(dNormalMatrix * tempNormal);
                }
                void main(void) {
                    gl_Position = getPosition();
                    vPositionW = getWorldPosition();
                    vNormalW = getNormal();
                }
            `,
            fragmentGLSL: `
                ${gammaPS}
                ${tonemappingPS}
                ${screenDepthPS}
                ${frag}
            `,
            attributes: {
                vertex_position: pc.SEMANTIC_POSITION,
                vertex_normal: pc.SEMANTIC_NORMAL,
                vertex_tangent: pc.SEMANTIC_TANGENT,
                vUv0: pc.SEMANTIC_TEXCOORD0
            },
            uniforms: {
                globalTime: { type: 'float', value: 0, scope: 'global' },
                waterNormalTex: { type: 'texture', value: null },
                waterNormalTex2: { type: 'texture', value: null },
                waterReflTex: { type: 'texture', value: tex },
                waterReflTexBlur: { type: 'texture', value: texBlur },
                uvOffsetAmount: { type: 'float', value: 0 },
                view_position: { type: 'vec3', value: [0, 0, 0], scope: 'view' },
                matrix_viewProjection: { type: 'mat4', value: new pc.Mat4(), scope: 'viewProjection' },
                waterSkyTexture: { type: 'texture', value: null },
                noiseTex: { type: 'texture', value: null },
                waterHeight: { type: 'float', value: 0 },
                waterColor: { type: 'vec3', value: [0.3, 0.7, 0.8], scope: 'global' },
                waterBrightness: { type: 'float', value: 1.5, scope: 'global' }
            }
        });

        material.name = 'WaterMaterial';
        material.cull = pc.CULLFACE_NONE;
        material.blendType = pc.BLEND_NORMAL;
        
        self.entity.render.meshInstances[0].material = material;
        
        // Create normal shaders using fullscreen quad
        const fullscreenQuadVS = shaderChunks.get('fullscreenQuadVS');
        normalShader = new pc.Shader(device, {
            attributes: { vertex_position: pc.SEMANTIC_POSITION },
            vshader: fullscreenQuadVS,
            fshader: app.assets.find("waterNormalPS").resource
        });

        const texNormal = _getTexture(256, 256, pc.PIXELFORMAT_R8_G8_B8_A8, true);
        rtNormal = new pc.RenderTarget({ colorBuffer: texNormal, depth: false });     

        normalShader2 = new pc.Shader(device, {
            attributes: { vertex_position: pc.SEMANTIC_POSITION },
            vshader: fullscreenQuadVS,
            fshader: app.assets.find("waterNormal2PS").resource
        });

        const texNormal2 = _getTexture(256, 256, pc.PIXELFORMAT_R8_G8_B8_A8, false);
        rtNormal2 = new pc.RenderTarget({ colorBuffer: texNormal2, depth: false });

        material.setParameter('waterNormalTex', rtNormal.colorBuffer);
        material.setParameter('waterNormalTex2', rtNormal2.colorBuffer);
        material.update();
    }

    function _getTexture(width, height, format, autoMipmap, uv = pc.ADDRESS_REPEAT) {
        const texture = new pc.Texture(device, { width, height, format, autoMipmap });

        texture.addressU = uv;
        texture.addressV = uv;
        texture.magFilter = pc.FILTER_LINEAR;
        texture.minFilter = pc.FILTER_LINEAR;

        return texture;
    }

    function _syncReflectionCameraProperties() {
        const source = mainCamera.camera;
        const target = reflectionCamera.camera;

        target.projection = source.projection;
        target.fov = source.fov;
        target.horizontalFov = source.horizontalFov;
        target.orthoHeight = source.orthoHeight;
        target.nearClip = source.nearClip;
        target.farClip = source.farClip;
        target.aperture = source.aperture;
        target.sensitivity = source.sensitivity;
        target.shutter = source.shutter;
    }

    function _updateReflectionCamera() {
        if (removeReflectionCameraHooks) {
            removeReflectionCameraHooks();
            removeReflectionCameraHooks = null;
        }

        const tex = rt.colorBuffer;
        
        // Get shader chunks
        const shaderChunks = chunks.get(device, pc.SHADERLANGUAGE_GLSL);
        const fullscreenQuadVS = shaderChunks.get('fullscreenQuadVS');
        
        // Create blur shader
        const blurShader = new pc.Shader(device, {
            attributes: { vertex_position: pc.SEMANTIC_POSITION },
            vshader: fullscreenQuadVS,
            fshader: app.assets.find('blurPS').resource
        });

        const constantSource = device.scope.resolve("source");
        const constantOffset = device.scope.resolve("pixelOffset");
        const pixelOffsetH = new pc.Vec2(1.5 / tex.width, 0);
        const pixelOffsetV = new pc.Vec2(0, 1.5 / tex.height);
        const cam = reflectionCamera.camera;
        
        planeAW = 0;
        planeBW = -1;
        planeCW = 0;
        planeDW = 0;
        world2refl = _reflectionMatrix(planeAW, planeBW, planeCW, planeDW);
        planeDW = -0.1;
        planePosW.set(planeAW*planeDW, planeBW*planeDW, planeCW*planeDW);
        planeNormalW.set(planeAW, planeBW, planeCW);

        _syncReflectionCameraProperties();
        cam.renderTarget = rt;
        cam.calculateTransform = _customTransformFunc;
        cam.calculateProjection = _customProjFunc;
        cam.cullFaces = true;
        cam.flipFaces = true;

        const postRender = (cameraComponent) => {
            if (cameraComponent !== cam) {
                return;
            }

            constantSource.setValue(rt.colorBuffer);
            constantOffset.setValue(new Float32Array([ pixelOffsetH.x, pixelOffsetH.y ]));
            pc.drawQuadWithShader(device, rtBlurH, blurShader);
            constantSource.setValue(rtBlurH.colorBuffer);
            constantOffset.setValue(new Float32Array([ pixelOffsetV.x, pixelOffsetV.y ]));
            pc.drawQuadWithShader(device, rtBlur, blurShader);
        };

        const postRenderHandle = app.scene.on(pc.EVENT_POSTRENDER, postRender);
        removeReflectionCameraHooks = () => {
            postRenderHandle.off();
        };
    }

    function _reflectionMatrix(a,b,c,d) {
        const m = new pc.Mat4();
        
        m.data[0] = 1.0 - 2*a*a;
        m.data[1] = -2*a*b;
        m.data[2] = -2*a*c;
        m.data[3] = -2*a*d;
        
        m.data[4] = -2*a*b;
        m.data[5] = 1.0 - 2*b*b;
        m.data[6] = -2*b*c;
        m.data[7] = -2*b*d;
        
        m.data[8] = -2*a*c;
        m.data[9] = -2*b*c;
        m.data[10] = 1.0 - 2*c*c;
        m.data[11] = -2*c*d;
        
        m.data[12] = 0;
        m.data[13] = 0;
        m.data[14] = 0;
        m.data[15] = 1;
        
        m.transpose();

        return m;
    }

    function _sgn(a) {
        if (a > 0) return 1;
        if (a < 0) return -1;
        return 0;
    }

    function _customTransformFunc(mat, mode) {
        const pos = this.node.getPosition();
        const rot = this.node.getRotation();    
        mat.setTRS(pos, rot, pc.Vec3.ONE);
        mat.mul2(world2reflGlobal, mat);
        mat.mul2(world2refl, mat);
    }

    function _customProjFunc(mat, mode) {        
        const cam = this;
        
        if (cam.projection === pc.PROJECTION_PERSPECTIVE) {
            mat.setPerspective(cam.fov, cam.aspectRatio, cam.nearClip, cam.farClip, cam.horizontalFov);
        } else {
            const y = cam.orthoHeight;
            const x = y * cam.aspectRatio;
            mat.setOrtho(-x, x, -y, y, cam.nearClip, cam.farClip);
        }
        
        // Transform world space plane to view space
        const pos = cam.node.getPosition();
        const rot = cam.node.getRotation();
        tmpView.setTRS(pos, rot, pc.Vec3.ONE).invert();
        tmpView.transformPoint(planePosW, planePosV);
        tmpView.transformVector(planeNormalW, planeNormalV).normalize();
        planeAV = planeNormalV.x;
        planeBV = planeNormalV.y;
        planeCV = planeNormalV.z;
        planeDV = -planePosV.dot(planeNormalV);
        planeV.set(planeAV, planeBV, planeCV, planeDV);
        
        // Apply oblique transform
        projInv.copy(mat).invert();
        planeQ.set(_sgn(planeAV), _sgn(planeBV), 1, 1);
        projInv.transformVec4(planeQ, planeQ);
        planeV.scale( 2 / planeV.dot(planeQ) );
        // third row = clip plane - fourth row
        const projection = mat.data;
        projection[2] = planeV.x - projection[3];
        projection[6] = planeV.y - projection[7];
        projection[10] = planeV.z - projection[11];
        projection[14] = planeV.w - projection[15];
    }

    function _clearOldTargets() {
        _destroyRT(rt);
        _destroyRT(rtBlur);
        _destroyRT(rtBlurH);
        _destroyRT(rtNormal);
        _destroyRT(rtNormal2);
    }

    function _destroyRT(target) {
        if (target) {
            target.colorBuffer.destroy();
            target.destroy();
        }
    }
};

Water.prototype.update = function(dt) {
    this.onUpdate(dt);
};
