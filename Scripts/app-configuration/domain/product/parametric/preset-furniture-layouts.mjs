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
                item('lounger-br4-bench50', 'PontoonBench50', 'FurnitureGroup_BR4', 0.833, 0.35, -0.81, 0),
                item('lounger-br4-chaise-left', 'ChaiseLoungeLeft', 'FurnitureGroup_BR4', 1.68, 0.35, -0.81, -90),
                item('lounger-bl3-chaise-right', 'ChaiseLoungeRight', 'FurnitureGroup_BL3',1.68, 0.35, 0.812, -90),
                item('lounger-bl3-bench50', 'PontoonBench50', 'FurnitureGroup_BL3',0.833, 0.35, 0.812, 180)
            ]
        },
        'cruiser-kit': {
            sourceConfig: 1,
            items: [
                item('cruiser-br4-helm', 'HelmStand', 'FurnitureGroup_BR4', -0.029, 0.35, -0.71, -90),
                item('cruiser-br4-bucket', 'BucketSeat', 'FurnitureGroup_BR4', 0.657, 0.35, -0.7, -90),
                item('cruiser-bl3-corner-cup', 'Corner3232Wcup', 'FurnitureGroup_BL3', 1.635, 0.35, 0.75, -90),
                item('cruiser-bl3-bench36-a', 'PontoonBench36', 'FurnitureGroup_BL3', 1.69, 0.35, -0.12, -90),
                item('cruiser-bl3-bench30', 'PontoonBench30', 'FurnitureGroup_BL3', 0.845, 0.35, 0.81, 180),
                item('cruiser-fr2-bench36', 'PontoonBench36', 'FurnitureGroup_FR2', -1.82, 0.35, -0.81, 0),
                item('cruiser-fr2-right-arm', 'PontoonRightArm', 'FurnitureGroup_FR2', -2.378, 0.35, -0.81, 180),
                item('cruiser-fl1-left-arm', 'PontoonLeftArm', 'FurnitureGroup_FL1', -2.378, 0.35, 0.815, 0),
                item('cruiser-fl1-bench36', 'PontoonBench36', 'FurnitureGroup_FL1', -1.82, 0.35, 0.81, 180)
            ]
        },
        'voyager-kit': {
            sourceConfig: 4,
            groupOverrides: { FurnitureGroup_BR4: { widthAnchor: 'fixed' } },
            items: [
                item('voyager-fr2-helm', 'HelmStand', 'FurnitureGroup_FR2', -0.296, 0.35, -0.71, -90),
                item('voyager-fr2-bucket', 'BucketSeat', 'FurnitureGroup_FR2', 0.39, 0.35, -0.7, -90),
                item('voyager-fr2-bench50', 'PontoonBench50', 'FurnitureGroup_FR2', -1.673, 0.35, -0.81, 0),
                item('voyager-fr2-right-arm', 'PontoonRightArm', 'FurnitureGroup_FR2', -2.408, 0.35, -0.81, 180),
                item('voyager-fr2-chaise-left', 'ChaiseLoungeLeft', 'FurnitureGroup_FR2', -0.827, 0.35, -0.81, -90),
                item('voyager-bl3-flip-flop', 'FlipFlopBench', 'FurnitureGroup_BL3', 0.449, 0.35, 0.694, -90),
                item('voyager-br4-left-arm', 'PontoonLeftArm', 'FurnitureGroup_BR4', 1.541, 0.35, 1.014, 90),
                item('voyager-br4-right-arm', 'PontoonRightArm', 'FurnitureGroup_BR4', 1.541, 0.35, -1.014, 90),
                item('voyager-br4-bench36-a', 'PontoonBench36', 'FurnitureGroup_BR4', 1.543, 0.35, -0.454, -90),
                item('voyager-br4-bench36-b', 'PontoonBench36', 'FurnitureGroup_BR4', 1.543, 0.35, 0.452, -90),
                item('voyager-fl1-left-arm', 'PontoonLeftArm', 'FurnitureGroup_FL1', -2.407, 0.35, 0.815, 0),
                item('voyager-fl1-bench50', 'PontoonBench50', 'FurnitureGroup_FL1', -1.673, 0.35, 0.812, 180),
                item('voyager-fl1-chaise-right', 'ChaiseLoungeRight', 'FurnitureGroup_FL1', -0.827, 0.35, 0.812, -90)
            ]
        },
        'explorer-kit': {
            sourceConfig: 2,
            items: [
                item('explorer-br4-helm', 'HelmStand', 'FurnitureGroup_BR4', 0.403, 0.35, -0.71, -90),
                item('explorer-br4-bucket', 'BucketSeat', 'FurnitureGroup_BR4', 1.086, 0.35, -0.7, -90),
                item('explorer-bl3-corner', 'Corner3232', 'FurnitureGroup_BL3', 1.94, 0.35, 0.671, -90),
                item('explorer-bl3-bench30-a', 'PontoonBench30', 'FurnitureGroup_BL3', 2.086, 0.35, -0.030, -90),
                item('explorer-bl3-bench30-b', 'PontoonBench30', 'FurnitureGroup_BL3', 1.241, 0.35, 0.815, 180),
                item('explorer-fr2-bench50', 'PontoonBench50', 'FurnitureGroup_FR2', -1.671, 0.35, -0.81, 0),
                item('explorer-fr2-right-arm', 'PontoonRightArm', 'FurnitureGroup_FR2', -2.407, 0.35, -0.81, 180),
                item('explorer-fl1-left-arm', 'PontoonLeftArm', 'FurnitureGroup_FL1', -2.407, 0.35, 0.815, 0),
                item('explorer-fl1-bench50', 'PontoonBench50', 'FurnitureGroup_FL1', -1.671, 0.35, 0.812, 180)
            ]
        }
    }
};

export default PRESET_FURNITURE_LAYOUTS;
