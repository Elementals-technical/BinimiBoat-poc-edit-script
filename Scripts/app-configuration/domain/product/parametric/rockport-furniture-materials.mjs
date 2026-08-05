/**
 * Material assignments for furniture cloned by LayoutRockportSeries.
 * Each node can use a different material; ao is applied as the material light map.
 */
const row = (node, Grey, Beige, ao = null) => ({ node, Grey, Beige, ao });

const ROCKPORT_FURNITURE_MATERIALS = {
    BucketSeat: [
        row('Bucket_Seat_Fabric', 'Fabric Gray Main', 'Fabric Beige Main', 'BucketSeat_AO'),
        row('Bucket_Seat_Leather', 'Leather Gray Main', 'Leather Beige Main', 'BucketSeat_AO'),
        row('Bucket_Seat_Stitches', 'Stitch Gray Main', 'Stitch Beige Main')
    ],
    ChaiseLoungeLeft: [
        row('Chaise_Base', 'Base Gray Main', 'Base Beige Main', 'ChaiseLoungeLeft_Right_AO'),
        row('Chaise_Fabric', 'Fabric Gray Main', 'Fabric Beige Main', 'ChaiseLoungeLeft_Right_AO'),
        row('Chaise_Leather', 'Leather Gray Main', 'Leather Beige Main', 'ChaiseLoungeLeft_Right_AO'),
        row('Chaise_Metal', 'Chrome Main', 'Metal Beige Main'),
        row('Chaise_Metal_Chrome', 'Chrome Main', 'Chrome Dark Main'),
        row('Chaise_Stitches', 'Stitch Gray Main', 'Stitch Beige Main'),
        row('Chaise_Tape', 'Tape Gray Main', 'Tape Beige Main')
    ],
    ChaiseLoungeRight: [
        row('Chaise_Base', 'Base Gray Main', 'Base Beige Main', 'ChaiseLoungeLeft_Right_AO'),
        row('Chaise_Fabric', 'Fabric Gray Main', 'Fabric Beige Main', 'ChaiseLoungeLeft_Right_AO'),
        row('Chaise_Leather', 'Leather Gray Main', 'Leather Beige Main', 'ChaiseLoungeLeft_Right_AO'),
        row('Chaise_Metal', 'Chrome Main', 'Metal Beige Main'),
        row('Chaise_Metal_Chrome', 'Chrome Main', 'Chrome Dark Main'),
        row('Chaise_Stitches', 'Stitch Gray Main', 'Stitch Beige Main'),
        row('Chaise_Tape', 'Tape Gray Main', 'Tape Beige Main')
    ],
    Corner3232: [
        row('Corner_3232_Base', 'Base Gray Main', 'Base Beige Main', 'Corner3232_AO'),
        row('Corner_3232_Belt', 'Tape Gray Main', 'Tape Beige Main'),
        row('Corner_3232_Fabric', 'Fabric Gray Main', 'Fabric Beige Main', 'Corner3232_AO'),
        row('Corner_3232_Leather', 'Leather Gray Main', 'Leather Beige Main', 'Corner3232_AO'),
        row('Corner_3232_Metal', 'Chrome Main', 'Chrome Dark Main', 'Corner3232_AO'),
        row('Corner_3232_Stitches', 'Stitch Gray Main', 'Stitch Beige Main')
    ],
    Corner3232Wcup: [
        row('Corner_3232_Base', 'Base Gray Main', 'Base Beige Main', 'Corner3232Wcup_AO'),
        row('Corner_3232_Belt', 'Tape Gray Main', 'Tape Beige Main'),
        row('Corner_3232_Fabric', 'Fabric Gray Main', 'Fabric Beige Main', 'Corner3232Wcup_AO'),
        row('Corner_3232_Leather', 'Leather Gray Main', 'Leather Beige Main', 'Corner3232Wcup_AO'),
        row('Corner_3232_Metal', 'Chrome Main', 'Chrome Dark Main'),
        row('Corner_3232_Stitches', 'Stitch Gray Main', 'Stitch Beige Main')
    ],
    FlipFlopBench: [
        row('FL_FL_Base', 'Base Gray Main', 'Base Beige Main', 'FlipFlopBench_AO'),
        row('FL_FL_Fabric', 'Fabric Gray Main', 'Fabric Beige Main', 'FlipFlopBench_AO'),
        row('FL_FL_Leather', 'Leather Gray Main', 'Leather Beige Main', 'FlipFlopBench_AO'),
        row('FL_FL_Metal_Matte', 'Plastic Black Noise Main', 'Plastic Black Noise Main', 'FlipFlopBench_AO'),
        row('FL_FL_Metal_Polished', 'Chrome Main', 'Chrome Main'),
        row('FL_FL_Metal_Screws', 'Chrome Main', 'Chrome Main'),
        row('FL_FL_Plastic', 'Plastic Black Noise Main', 'Plastic Black Noise Main', 'FlipFlopBench_AO'),
        row('FL_FL_Stitches', 'Stitch Gray Main', 'Stitch Beige Main')
    ],
    HelmStand: [
        row('Helm_Stand_Base', 'Base Gray Main', 'Base Beige Main', 'Helm_Stand_1k_AO'),
        row('Helm_Stand_Chrome', 'Chrome Main', 'Chrome Dark Main'),
        row('Helm_Stand_Fabric', 'Fabric Gray Main', 'Fabric Beige Main', 'Helm_Stand_1k_AO'),
        row('Helm_Stand_Leather', 'Leather Gray Main', 'Leather Beige Main', 'Helm_Stand_1k_AO'),
        row('Helm_Stand_Plate', 'Plastic Black Noise Main', 'Plastic Black Noise Main', 'Helm_Stand_1k_AO'),
        row('Helm_Stand_Stitches', 'Stitch Gray Main', 'Stitch Beige Main')
    ],
    PontoonBench30: [
        row('Bench_30_Fabric', 'Fabric Gray Main', 'Fabric Beige Main', 'PontoonBench30_AO'),
        row('Bench_30_Leather', 'Leather Gray Main', 'Leather Beige Main', 'PontoonBench30_AO'),
        row('Bench_30_Logo', 'TM Logo Main', 'TM Logo Main'),
        row('Bench_30_Stiches', 'Stitch Gray Main', 'Stitch Beige Main'),
        row('Bench_30_Tape', 'Tape Gray Main', 'Tape Beige Main'),
        row('Bench_30_base', 'Base Gray Main', 'Base Beige Main', 'PontoonBench30_AO')
    ],
    PontoonBench36: [
        row('Bench_36_Base', 'Base Gray Main', 'Base Beige Main', 'PontoonBench36_AO'),
        row('Bench_36_Fabric', 'Fabric Gray Main', 'Fabric Beige Main', 'PontoonBench36_AO'),
        row('Bench_36_Leather', 'Leather Gray Main', 'Leather Beige Main', 'PontoonBench36_AO'),
        row('Bench_36_Logo', 'TM Logo Main', 'TM Logo Main'),
        row('Bench_36_Stitches', 'Stitch Gray Main', 'Stitch Beige Main'),
        row('Bench_36_Tape', 'Tape Gray Main', 'Tape Beige Main')
    ],
    PontoonBench50: [
        row('Bench_37_Base', 'Base Gray Main', 'Base Beige Main', 'PontoonBench50_AO'),
        row('Bench_37_Fabric', 'Fabric Gray Main', 'Fabric Beige Main', 'PontoonBench50_AO'),
        row('Bench_37_Leather', 'Leather Gray Main', 'Leather Beige Main', 'PontoonBench50_AO'),
        row('Bench_37_Logo', 'TM Logo Main', 'TM Logo Main'),
        row('Bench_37_Stitches', 'Stitch Gray Main', 'Stitch Beige Main'),
        row('Bench_37_Tape', 'Tape Gray Main', 'Tape Beige Main')
    ],
    PontoonLeftArm: [
        row('Arm_Chrome', 'Chrome Main', 'Chrome Dark Main'),
        row('Arm_Fabric', 'Fabric Gray Main', 'Fabric Beige Main', 'Pontoon_Arm_AO_1k.jpg'),
        row('Arm_Leather', 'Leather Gray Main', 'Leather Beige Main', 'Pontoon_Arm_AO_1k.jpg'),
        row('Arm_Net', 'Arm Net Gray Main', 'Arm Net Beige Main'),
        row('Arm_Stitches_Additional', 'Stitch White Main', 'Stitch White Main'),
        row('Arm_Stitches_Original', 'Stitch Gray Main', 'Tape Beige Main')
    ],
    PontoonRightArm: [
        row('Arm_Chrome', 'Chrome Main', 'Chrome Dark Main'),
        row('Arm_Fabric', 'Fabric Gray Main', 'Fabric Beige Main', 'Pontoon_Arm_AO_1k.jpg'),
        row('Arm_Leather', 'Leather Gray Main', 'Leather Beige Main', 'Pontoon_Arm_AO_1k.jpg'),
        row('Arm_Net', 'Arm Net Gray Main', 'Arm Net Beige Main'),
        row('Arm_Stitches_Additional', 'Stitch White Main', 'Stitch White Main'),
        row('Arm_Stitches_Original', 'Stitch Gray Main', 'Tape Beige Main')
    ],
    RockportHelms: [
        row('Helm_metal', 'Chrome Main', 'Chrome Main'),
        row('Helms_Fabric', 'Fabric Gray Main', 'Fabric Beige Main', 'HelmStand_AO.jpg'),
        row('Helms_Leather', 'Leather Gray Main', 'Leather Beige Main', 'HelmStand_AO.jpg'),
        row('Helms_Net', 'Arm Net Gray Main', 'Arm Net Beige Main'),
        row('Helms_Plastic', 'Plastic Black Noise Main', 'Plastic Black Noise Main'),
        row('Helms_Stitch', 'Stitch White Main', 'Stitch White Main'),
        row('Helms_Stitch.001', 'Stitch Gray Main', 'Stitch Beige Main'),
        row('Helms_zip', 'Plastic Black Noise Main', 'Plastic Black Noise Main')
    ],
    CupHolder: [
        row('CupH_Chrome', 'Chrome Main', 'Chrome Dark Main'),
        row('CupH_Leather', 'Leather Gray Main', 'Leather Beige Main', 'CupHolder_AO.jpg'),
        row('CupH_Stitches', 'Stitch Gray Main', 'Stitch Beige Main')
    ]
};

export default ROCKPORT_FURNITURE_MATERIALS;
