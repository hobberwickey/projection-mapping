import { Config } from "../js/lib/Config.js";

export const defaultState = () => {
  let config = Config.default;

  return {
    selected: {
      video: null,
      effect: null,
      script: null,
    },
    videos: new Array(config.video_count).fill().map((_, idx) => {
      return {
        id: idx,
        label: `Video ${idx + 1}`,
        opacity: 0.5,
      };
    }),

    values: {
      effects: new Array(config.video_count).fill().map(() => {
        return new Array(config.effect_count).fill().map(() => {
          return new Array(config.effect_parameter_count).fill(0.2);
        });
      }),
      scripts: new Array(config.effect_count).fill().map(() => {
        return new Array(config.effect_parameter_count).fill(0);
      }),
    },

    scripts: new Array(config.script_count).fill().map((_, idx) => {
      return null;
    }),

    effects: new Array(config.effect_count).fill().map((_, idx) => {
      return null;
    }),

    shapes: [
      {
        id: 0,
        type: "quad",
        label: "Quad 1",
        opacity: new Array(config.video_count).fill(0.5),
        tris: [
          {
            input: [
              [0, 0],
              [1, 0],
              [1, 1],
            ],
            output: [
              [0, 0],
              [1, 0],
              [1, 1],
            ],
          },
          {
            input: [
              [0, 0],
              [1, 1],
              [0, 1],
            ],
            output: [
              [0, 0],
              [1, 1],
              [0, 1],
            ],
          },
        ],
      },
      // {
      //   id: 0,
      //   type: "tri",
      //   label: "Tri 1",
      //   opacity: new Array(config.video_count).fill(1),
      //   tris: [
      //     {
      //       input: [
      //         [0, 0],
      //         [1, 0],
      //         [1, 1],
      //       ],
      //       output: [
      //         [0, 0],
      //         [1, 0],
      //         [1, 1],
      //       ],
      //     },
      //   ],
      // },
    ],

    // TODO: this shouldn't be hardcoded. Build a learn setting
    notes: {
      buttons: {
        48: 0,
        53: 1,
        50: 2,
        51: 3,
        49: 4,
        52: 5,
      },
      knobs: {
        43: 0,
        44: 1,
      },
      sliders: {
        input: {
          56: 2,
          54: 1,
          55: 0,
        },
        output: {
          45: 0,
          46: 1,
          47: 2,
        },
      },
    },
  };
};
