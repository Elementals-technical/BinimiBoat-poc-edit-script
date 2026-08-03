/**
 * Preset furniture layouts supplied for the Bimini boat.
 * Positions and rotations are local to the target FurnitureGroup_* entity.
 * Group offsets are applied separately when Fence dimensions change.
 */
const p = (x, y, z, rotationY) => ({
    position: { x, y, z },
    rotation: { x: 0, y: rotationY, z: 0 }
});

const item = (id, template, group, x, y, z, rotationY) => ({
    id, template, group, ...p(x, y, z, rotationY)
});

const GROUPS = {
    FurnitureGroup_FL1: { lengthAnchor: 'front', widthAnchor: 'left' },
    FurnitureGroup_FR2: { lengthAnchor: 'front', widthAnchor: 'right' },
    FurnitureGroup_BL3: { lengthAnchor: 'back', widthAnchor: 'left' },
    FurnitureGroup_BR4: { lengthAnchor: 'back', widthAnchor: 'right' }
};

const PRESET_FURNITURE_LAYOUTS = {
    meta: {
        positionSpace: 'target-group-local',
        defaultDimensions: {
            DeckLength: 240,
            FenceLength: 216,
            FenceWidth: 90,
            FrontIndent: 0,
            DeckWidth: 96
        },
        axes: { length: 'x', width: 'z' }
    },
    groups: GROUPS,
    layouts: {
        'lounger-kit': {
            sourceConfig: 3,
            items: [
                item('lounger-br4-bench50', 'PontoonBench50', 'FurnitureGroup_BR4', 1.204, 0.35, -0.765, 0),
                item('lounger-br4-chaise-left', 'ChaiseLoungeLeft', 'FurnitureGroup_BR4', 2.05, 0.35, -0.761, -90),
                item('lounger-bl3-chaise-right', 'ChaiseLoungeRight', 'FurnitureGroup_BL3', 2.05, 0.35, 0.76, -90),
                item('lounger-bl3-bench50', 'PontoonBench50', 'FurnitureGroup_BL3', 1.204, 0.35, 0.764, 180)
            ]
        },
        'cruiser-kit': {
            sourceConfig: 1,
            items: [
                item('cruiser-br4-helm', 'HelmStand', 'FurnitureGroup_BR4', 0.433, 0.35, -0.656, 90),
                item('cruiser-br4-bucket', 'BucketSeat', 'FurnitureGroup_BR4', 1.119, 0.35, -0.653, -90),
                item('cruiser-bl3-corner-cup', 'Corner3232Wcup', 'FurnitureGroup_BL3', 3.236, 0.456, 0.709, -90),
                item('cruiser-bl3-bench36-a', 'PontoonBench36', 'FurnitureGroup_BL3', 2.053, 0.35, -0.155, -90),
                item('cruiser-bl3-bench30', 'PontoonBench30', 'FurnitureGroup_BL3', 1.209, 0.35, 0.761, 180),
                item('cruiser-fr2-bench36', 'PontoonBench36', 'FurnitureGroup_FR2', -1.527, 0.35, -0.763, 0),
                item('cruiser-fr2-right-arm', 'PontoonRightArm', 'FurnitureGroup_FR2', -2.09, 0.35, -0.773, 180),
                item('cruiser-fl1-left-arm', 'PontoonLeftArm', 'FurnitureGroup_FL1', -2.09, 0.35, 0.781, 0),
                item('cruiser-fl1-bench36', 'PontoonBench36', 'FurnitureGroup_FL1', -1.527, 0.35, 0.768, 180)
            ]
        },
        'voyager-kit': {
            sourceConfig: 4,
            groupOverrides: { FurnitureGroup_BR4: { widthAnchor: 'fixed' } },
            items: [
                item('voyager-fr2-helm', 'HelmStand', 'FurnitureGroup_FR2', 0.025, 0.35, -0.637, 90),
                item('voyager-fr2-bucket', 'BucketSeat', 'FurnitureGroup_FR2', 0.711, 0.35, -0.633, -90),
                item('voyager-fr2-bench50', 'PontoonBench50', 'FurnitureGroup_FR2', -1.352, 0.35, -0.731, 0),
                item('voyager-fr2-right-arm', 'PontoonRightArm', 'FurnitureGroup_FR2', -2.09, 0.35, -0.747, 180),
                item('voyager-fr2-chaise-left', 'ChaiseLoungeLeft', 'FurnitureGroup_FR2', -0.506, 0.35, -0.767, -90),
                item('voyager-bl3-flip-flop', 'FlipFlopBench', 'FurnitureGroup_BL3', 0.77, 0.35, 0.694, -90),
                item('voyager-br4-left-arm', 'PontoonLeftArm', 'FurnitureGroup_BR4', 1.928, 0.35, 0.092, 90),
                item('voyager-br4-right-arm', 'PontoonRightArm', 'FurnitureGroup_BR4', 1.928, 0.35, -1.018, 90),
                item('voyager-br4-bench36-a', 'PontoonBench36', 'FurnitureGroup_BR4', 1.931, 0.35, -0.459, -90),
                item('voyager-br4-bench36-b', 'PontoonBench36', 'FurnitureGroup_BR4', 1.931, 0.35, 0.435, -90),
                item('voyager-fl1-left-arm', 'PontoonLeftArm', 'FurnitureGroup_FL1', -2.086, 0.35, 0.768, 0),
                item('voyager-fl1-bench50', 'PontoonBench50', 'FurnitureGroup_FL1', -1.352, 0.35, 0.752, 180),
                item('voyager-fl1-chaise-right', 'ChaiseLoungeRight', 'FurnitureGroup_FL1', -0.506, 0.35, 0.748, -90)
            ]
        },
        'explorer-kit': {
            sourceConfig: 2,
            items: [
                item('explorer-br4-helm', 'HelmStand', 'FurnitureGroup_BR4', 0.744, 0.35, -0.667, -90),
                item('explorer-br4-bucket', 'BucketSeat', 'FurnitureGroup_BR4', 1.426, 0.35, -0.672, -90),
                item('explorer-bl3-corner', 'Corner3232', 'FurnitureGroup_BL3', 2.21, 0.35, 0.618, -90),
                item('explorer-bl3-bench30-a', 'PontoonBench30', 'FurnitureGroup_BL3', 2.356, 0.35, -0.075, -90),
                item('explorer-bl3-bench30-b', 'PontoonBench30', 'FurnitureGroup_BL3', 1.516, 0.35, 0.77, 180),
                item('explorer-fr2-bench50', 'PontoonBench50', 'FurnitureGroup_FR2', -1.355, 0.35, -0.767, 0),
                item('explorer-fr2-right-arm', 'PontoonRightArm', 'FurnitureGroup_FR2', -2.09, 0.35, -0.765, 180),
                item('explorer-fl1-left-arm', 'PontoonLeftArm', 'FurnitureGroup_FL1', -2.09, 0.35, 0.766, 0),
                item('explorer-fl1-bench50', 'PontoonBench50', 'FurnitureGroup_FL1', -1.355, 0.35, 0.77, 180)
            ]
        }
    }
};

export default PRESET_FURNITURE_LAYOUTS;
