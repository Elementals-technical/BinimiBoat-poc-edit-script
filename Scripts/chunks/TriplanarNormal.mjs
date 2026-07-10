const triplanarNormalChunk = `
uniform sampler2D tri_normalTex;
uniform float tri_hasNormal;
uniform float tri_bumpiness;

uniform sampler2D tri_detailNormalTex;
uniform float tri_hasDetailNormal;
uniform float tri_detailBumpiness;

#ifndef TRI_DETAIL_PARAMS
#define TRI_DETAIL_PARAMS
    uniform float tri_detailTiling;
#endif

#ifndef TRI_PLANAR_COMMON
#define TRI_PLANAR_COMMON
    uniform float tri_scale;
    uniform float tri_rotation;
    #ifndef MATRIX_MODEL_DEFINED
    uniform mat4 matrix_model;
    #endif
    vec2 rotateUV(vec2 uv, float rotation) {
        float s = sin(rotation);
        float c = cos(rotation);
        return vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
    }
#endif

// ==================== GRAIN DIRECTION ====================
#ifndef GRAIN_FLIP_COMMON
#define GRAIN_FLIP_COMMON
    uniform float grain_mode;
    uniform float grain_stripWidth;

    vec2 applyGrainFlip(vec2 uv) {
        if (grain_mode < 0.5) return uv;
        float axis = (grain_mode < 1.5) ? uv.x : uv.y;
        float sw = max(grain_stripWidth, 0.001);
        float idx = floor(axis / sw);
        if (mod(idx, 2.0) > 0.5) {
            float local = axis - idx * sw;
            float mirrored = sw - local;
            if (grain_mode < 1.5) {
                uv.x = idx * sw + mirrored;
            } else {
                uv.y = idx * sw + mirrored;
            }
        }
        return uv;
    }
#endif
// =========================================================

vec3 triUnpack(vec4 n) {
    return n.rgb * 2.0 - 1.0;
}

float triSign(float v) {
    return v < 0.0 ? -1.0 : 1.0;
}

vec3 blendNormals(vec3 n1, vec3 n2) {
    n1 += vec3(0.0, 0.0, 1.0);
    n2 *= vec3(-1.0, -1.0, 1.0);
    return n1 * dot(n1, n2) / n1.z - n2;
}

vec3 triToWorld(vec3 tangentNormal, vec3 tangentAxis, vec3 bitangentAxis, vec3 normalAxis) {
    return normalize(
        tangentAxis * tangentNormal.x +
        bitangentAxis * tangentNormal.y +
        normalAxis * tangentNormal.z
    );
}

void getNormal() {
    vec3 offset = matrix_model[3].xyz;
    vec3 axisX = normalize(matrix_model[0].xyz);
    vec3 axisY = normalize(matrix_model[1].xyz);
    vec3 axisZ = normalize(matrix_model[2].xyz);
    mat3 rotationMatrix = mat3(axisX, axisY, axisZ);
    vec3 localPos = (vPositionW - offset) * rotationMatrix;

    vec3 worldNormal = normalize(dVertexNormalW);
    vec3 localNormal = normalize(worldNormal * rotationMatrix);
    vec3 blend = vec3(abs(localNormal.x), abs(localNormal.y), abs(localNormal.z));
    blend /= (dot(blend, vec3(1.0)) + 0.0001);

    float sX = (tri_scale > 0.001) ? tri_scale : 1.0;
    
    vec2 uvX = -vec2(localPos.z, localPos.y) / sX;
    vec2 uvY = -vec2(localPos.x, localPos.z) / sX;
    vec2 uvZ = -vec2(localPos.x, localPos.y) / sX;

    vec2 r_uvX = applyGrainFlip(rotateUV(uvX, tri_rotation));
    vec2 r_uvY = applyGrainFlip(rotateUV(uvY, tri_rotation));
    vec2 r_uvZ = applyGrainFlip(rotateUV(uvZ, tri_rotation));

    vec3 flatNormal = vec3(0.0, 0.0, 1.0);
    vec3 nX = flatNormal;
    vec3 nY = flatNormal;
    vec3 nZ = flatNormal;

    if (tri_hasNormal > 0.5) {
        nX = triUnpack(texture2D(tri_normalTex, r_uvX));
        nY = triUnpack(texture2D(tri_normalTex, r_uvY));
        nZ = triUnpack(texture2D(tri_normalTex, r_uvZ));

        nX = normalize(mix(flatNormal, nX, tri_bumpiness));
        nY = normalize(mix(flatNormal, nY, tri_bumpiness));
        nZ = normalize(mix(flatNormal, nZ, tri_bumpiness));
    }
    
    if (tri_hasDetailNormal > 0.5) {
        vec2 dUVX = r_uvX * tri_detailTiling;
        vec2 dUVY = r_uvY * tri_detailTiling;
        vec2 dUVZ = r_uvZ * tri_detailTiling;

        vec3 dnX = triUnpack(texture2D(tri_detailNormalTex, dUVX));
        vec3 dnY = triUnpack(texture2D(tri_detailNormalTex, dUVY));
        vec3 dnZ = triUnpack(texture2D(tri_detailNormalTex, dUVZ));

        dnX = normalize(mix(flatNormal, dnX, tri_detailBumpiness));
        dnY = normalize(mix(flatNormal, dnY, tri_detailBumpiness));
        dnZ = normalize(mix(flatNormal, dnZ, tri_detailBumpiness));

        nX = normalize(blendNormals(nX, dnX));
        nY = normalize(blendNormals(nY, dnY));
        nZ = normalize(blendNormals(nZ, dnZ));
    }

    vec3 wX = triToWorld(nX, axisZ, axisY, axisX * triSign(localNormal.x));
    vec3 wY = triToWorld(nY, axisX, axisZ, axisY * triSign(localNormal.y));
    vec3 wZ = triToWorld(nZ, axisX, axisY, axisZ * triSign(localNormal.z));

    dNormalW = normalize(wX * blend.x + wY * blend.y + wZ * blend.z);
}
`;

export default triplanarNormalChunk;
