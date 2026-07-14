/** АВТО-ЗГЕНЕРОВАНО з BiminiBoatConfig.xlsx / Rules1. Джерело істини: bindings.json. */
const BIMINI_PARAMETRIC_BINDINGS = {
  "meta": {
    "source": "BiminiBoatConfig.xlsx / Rules1",
    "note": "keyframes: {at: input-inches, value: transform-units}. mode 'lerp' = linear interpolation between keyframes; 'step' = discrete lookup. Діапазони/step атрибутів НЕ тут — єдине джерело: attributes-catalog.mjs.",
    "units": "inches (UI) -> meters (scene)"
  },
  "dimensions": {
    "DeckLength": {
      "mode": "lerp",
      "bindings": [
        {
          "variable": "moove_posD1",
          "fn": "MoveZ",
          "targets": [
            "boat_fence_moove1"
          ],
          "keyframes": [
            {
              "at": 168,
              "value": 0.0
            },
            {
              "at": 384,
              "value": 2.7432
            }
          ]
        },
        {
          "variable": "moove_negD1",
          "fn": "MoveZ",
          "targets": [
            "boat_engine"
          ],
          "keyframes": [
            {
              "at": 168,
              "value": 0.0
            },
            {
              "at": 384,
              "value": -2.7432
            }
          ]
        },
        {
          "variable": "deck_stretch",
          "fn": "StretchZ",
          "targets": [
            "Deck_front",
            "Deck_frame_front",
            "Under_deck_front",
            "Pontoon_front",
            "Deck_back",
            "Deck_frame_back",
            "Pontoon_back",
            "Under_deck_back"
          ],
          "keyframes": [
            {
              "at": 168,
              "value": 0.0
            },
            {
              "at": 384,
              "value": 2.7432
            }
          ],
          "note": "FIX ×2 (не з Rules1): SmartStretch росте на ±amount/2 від pivot; деко-меші лежать по обидва боки pivot (Z -5..+2 / -2..+5), тож для розльоту країв ±D (синхронно з fence +D та engine -D) amount = 2D."
        }
      ]
    },
    "FenceLength": {
      "mode": "lerp",
      "bindings": [
        {
          "variable": "moove_negF1",
          "fn": "MoveZ",
          "targets": [
            "boat_fence_back",
            "fence_unip"
          ],
          "keyframes": [
            {
              "at": 96,
              "value": 0.0
            },
            {
              "at": 335,
              "value": -6.0706
            }
          ],
          "note": "FIX hierarchy: Rules1 also lists round/square back variant children, but they are descendants of boat_fence_back. Moving both parent and children doubles the visible back-wall offset; variants inherit this parent move."
        },
        {
          "variable": "fence_stretch",
          "fn": "StretchZ",
          "targets": [
            "fence_unip_right_plane",
            "fence_unip_right_tube",
            "fence_unip_left_plane",
            "fence_unip_left_tube"
          ],
          "keyframes": [
            {
              "at": 96,
              "value": 0.0
            },
            {
              "at": 335,
              "value": 3.0353
            }
          ]
        },
        {
          "variable": "fence_stretch_recenter",
          "note": "КОМПЕНСАЦІЯ (не з Rules1): SmartStretch тягне симетрично від центру (±amount/2), а planes/tubes ще й успадковують -D від moove_negF1 (fence_unip — їх предок). Локальний зсув +D/2 фіксує передній край на місці і доводить задній до стінки. Якщо після перевірки щілина з іншого боку — інвертувати value.",
          "fn": "MoveZ",
          "targets": [
            "fence_unip_right_plane",
            "fence_unip_right_tube",
            "fence_unip_left_plane",
            "fence_unip_left_tube"
          ],
          "keyframes": [
            {
              "at": 96,
              "value": 0.0
            },
            {
              "at": 335,
              "value": 3.0353
            }
          ]
        }
      ]
    },
    "FenceWidth": {
      "mode": "lerp",
      "bindings": [
        {
          "variable": "fenceWstretch",
          "fn": "StretchX",
          "targets": [
            "square_fence_front_center_plane",
            "round_fence_front_center_plane",
            "round_fence_36_front_center_plane",
            "square_fence_back_center_plane",
            "round_fence_back_center_plane",
            "round_fence_36_back_center_plane",
            "square_fence_front_center_tube",
            "round_fence_front_center_tube",
            "round_fence_36_front_center_tube",
            "square_fence_back_center_tube",
            "round_fence_back_center_tube",
            "round_fence_36_back_center_tube"
          ],
          "keyframes": [
            {
              "at": 86,
              "value": 0.0
            },
            {
              "at": 100,
              "value": 0.3556
            }
          ],
          "note": "FIX ×2 + center group: Rules1 rows 289-291 define center_stretch as *_center_plane*/*_center_tube*. Center panels are pivot-centered and grow ±amount/2; side sections move ±D, so amount = 2D. Apply to front and back centers to keep the back wall closed."
        },
        {
          "variable": "move_w_neg",
          "fn": "MoveX",
          "targets": [
            "square_fence_front_right",
            "round_fence_front_right",
            "round_fence_36_front_right",
            "square_fence_back_right",
            "round_fence_back_right",
            "round_fence_36_back_right",
            "fence_unip_right"
          ],
          "keyframes": [
            {
              "at": 86,
              "value": 0.0
            },
            {
              "at": 100,
              "value": -0.1778
            }
          ]
        },
        {
          "variable": "move_w_pos",
          "fn": "MoveX",
          "targets": [
            "round_fence_36_front_left",
            "round_fence_front_left",
            "square_fence_front_left",
            "round_fence_36_back_left",
            "round_fence_back_left",
            "square_fence_back_left",
            "fence_unip_left"
          ],
          "keyframes": [
            {
              "at": 86,
              "value": 0.0
            },
            {
              "at": 100,
              "value": 0.1778
            }
          ]
        }
      ]
    },
    "FrontIndent": {
      "mode": "lerp",
      "note": "piecewise/non-linear in source; keep all keyframes",
      "bindings": [
        {
          "variable": "move_ind1",
          "fn": "MoveZ",
          "targets": [
            "boat_fence_moove3"
          ],
          "keyframes": [
            {
              "at": 0,
              "value": 1.2192
            },
            {
              "at": 1,
              "value": 1.1938
            },
            {
              "at": 47,
              "value": 0.0254
            },
            {
              "at": 48,
              "value": 0.0
            }
          ]
        }
      ]
    },
    "DeckWidth": {
      "mode": "step",
      "bindings": [
        {
          "variable": "deck_width_stretch",
          "note": "FIX: у Rules1 колонка позначена StretchZ, але Z вже займає deck_stretch (DeckLength); ширина деки = вісь X",
          "fn": "StretchX",
          "targets": [
            "Deck_back",
            "Deck_frame_back",
            "Pontoon_back",
            "Under_deck_back",
            "Deck_frame_front",
            "Deck_front",
            "Pontoon_front",
            "Under_deck_front"
          ],
          "keyframes": [
            {
              "at": 96,
              "value": 0.0
            },
            {
              "at": 102,
              "value": 0.0762
            }
          ]
        }
      ]
    }
  },
  "variants": {
    "FenceTypeFront": {
      "options": [
        "Square",
        "Round",
        "Round36"
      ],
      "targets": {
        "Square": {
          "enable": [
            "square_fence_front"
          ],
          "disable": [
            "round_fence_front",
            "round_fence_36_front"
          ]
        },
        "Round": {
          "enable": [
            "round_fence_front"
          ],
          "disable": [
            "square_fence_front",
            "round_fence_36_front"
          ]
        },
        "Round36": {
          "enable": [
            "round_fence_36_front"
          ],
          "disable": [
            "square_fence_front",
            "round_fence_front"
          ]
        }
      }
    },
    "FenceTypeBack": {
      "options": [
        "Square",
        "Round",
        "Round36"
      ],
      "targets": {
        "Square": {
          "enable": [
            "square_fence_back"
          ],
          "disable": [
            "round_fence_back",
            "round_fence_36_back"
          ]
        },
        "Round": {
          "enable": [
            "round_fence_back"
          ],
          "disable": [
            "square_fence_back",
            "round_fence_36_back"
          ]
        },
        "Round36": {
          "enable": [
            "round_fence_36_back"
          ],
          "disable": [
            "square_fence_back",
            "round_fence_back"
          ]
        }
      }
    }
  },
  "materials": {
    "DeckColor": {
      "options": {
        "Beige": "Deck Beige",
        "Grey": "Deck Grey"
      },
      "targets": [
        "Deck_back",
        "Deck_front"
      ]
    },
    "FenceColor": {
      "options": {
        "Black": "Black",
        "Navy": "Navy",
        "Maroon": "Maroon",
        "Red": "Red",
        "Blue": "Blue",
        "Gray": "Gray",
        "Tan": "Tan",
        "White": "White"
      },
      "targetGlobs": [
        "*_fence_*_plane",
        "fence_unip_*_plane"
      ]
    }
  }
};

export default BIMINI_PARAMETRIC_BINDINGS;
