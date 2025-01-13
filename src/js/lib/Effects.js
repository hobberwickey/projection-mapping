export const Effects = [
	{
		id: "video_controls",
		label: "Video Controls",
		opacity: "Opacity",
		effect_a: "Playback Speed",
		effect_b: "Start Offset",
		defaults: [0.5, 0.05],
		shader: null,
	},
	{
		id: "color_opacity",
		label: "Color Opacity",
		opacity: "Opacity",
		effect_a: "Hue",
		effect_b: "Sensitivity",
		defaults: [0.05, 0.05],
		shader: `
	    precision mediump float;
	    varying vec2 v_texcoord;
	    uniform sampler2D u_texture;

	    float PI = 3.14159265358;

	    uniform vec2 u_dimensions; 
	    uniform mediump float u_opacity;
	    uniform vec2 u_effect;

	    vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) 
	    {
	      return a + b*cos( 6.28318*(c*t+d) );
	    }

	    vec3 rgb2hsv(vec3 c)
	    {
	      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
	      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

	      float d = q.x - min(q.w, q.y);
	      float e = 1.0e-10;
	      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
	    }

	    void main() {
	      vec4 color = texture2D(u_texture, v_texcoord);
	      vec3 hsv = rgb2hsv(vec3(color[0], color[1], color[2]));

	      float hue_target = u_effect[0];
	      float hue_dist = 1.0 - (min(abs(hsv[0] - hue_target), 1.0 - abs(hsv[0] - hue_target)) / 0.5);
	      float hue_opacity =  sin(pow(hue_dist, 2.0) * (PI / 2.0));

	      gl_FragColor = vec4(color[0], color[1], color[2], 1.0 - hue_opacity * (u_effect[1]));
	    }
	  `,
	},
	{
		id: "cosine_palette",
		label: "Cosine Palette",
		opacity: "Opacity",
		effect_a: "Intensity",
		effect_b: "Shift",
		defaults: [0.05, 0.05],
		shader: `
	    precision mediump float;
	    varying vec2 v_texcoord;
	    uniform sampler2D u_texture;

	    uniform vec2 u_dimensions; 
	    uniform mediump float u_opacity;
	    uniform vec2 u_effect;

	    vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) 
	    {
	      return a + b*cos( 6.28318*(c*t+d) );
	    }
	    
	    vec3 rgb2hsv(vec3 c)
	    {
	      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
	      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

	      float d = q.x - min(q.w, q.y);
	      float e = 1.0e-10;
	      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
	    }

	    void main() {
	      vec4 color = texture2D(u_texture, v_texcoord);
	      vec3 hsv = rgb2hsv(vec3(color[0], color[1], color[2]));
	      vec3 effect = pal(hsv[2] + u_effect[1], vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
	      vec3 weighted = vec3(
	        color[0] * (1.0 - u_effect[0]) + effect[0] * u_effect[0],
	        color[1] * (1.0 - u_effect[0]) + effect[1] * u_effect[0],
	        color[2] * (1.0 - u_effect[0]) + effect[2] * u_effect[0]
	      );

	      gl_FragColor = vec4(weighted, color[3]);
	    }
	  `,
	},
	{
		id: "pixelate",
		label: "Pixelate",
		opacity: "Opacity",
		effect_a: "Pixel Size",
		effect_b: "Pallete Depth",
		defaults: [0.05, 0.05],
		shader: `
		  precision mediump float;
		  varying vec2 v_texcoord;
		  uniform sampler2D u_texture;

		  uniform vec2 u_dimensions; 
		  uniform mediump float u_opacity;
		  uniform vec2 u_effect;

		  void main() {
		    float pixelateX = u_dimensions[0] * floor(max(u_effect[0] * 30.0, 1.0));
		    float pixelateY = u_dimensions[1] * floor(max(u_effect[1] * 30.0, 1.0));
		    vec2 pixel_coords = vec2(
		      v_texcoord[0] - (v_texcoord[0] - floor(v_texcoord[0]/pixelateX) * pixelateX),
		      v_texcoord[1] - (v_texcoord[1] - floor(v_texcoord[1]/pixelateY) * pixelateY)
		    );

		    gl_FragColor = texture2D(u_texture, pixel_coords);
		  }
		`,
	},
	{
		id: "prism",
		label: "Prism",
		opacity: "Opacity",
		effect_a: "Horizontal",
		effect_b: "Vertical",
		defaults: [0.05, 0.05],
		shader: `
		  precision mediump float;
		  varying vec2 v_texcoord;
		  uniform sampler2D u_texture;

		  uniform vec2 u_dimensions; 
		  uniform mediump float u_opacity;
		  uniform vec2 u_effect;

		  void main() {
		    vec2 prism_values = vec2(floor(u_effect[0] * 9.0) + 1.0, floor(u_effect[1] * 9.0) + 1.0);
		    vec2 prism_coords = vec2(fract(v_texcoord[0] * prism_values[0]), fract(v_texcoord[1] * prism_values[1]));

		    gl_FragColor = texture2D(u_texture, prism_coords);
		  }
		`,
	},
	{
		id: "zoom",
		label: "Zoom",
		opacity: "Opacity",
		effect_a: "X-Zoom",
		effect_b: "Y-Zoom",
		defaults: [0.05, 0.05],
		shader: `
			precision mediump float;
		  varying vec2 v_texcoord;
		  uniform sampler2D u_texture;

		  uniform vec2 u_dimensions; 
		  uniform mediump float u_opacity;
		  uniform vec2 u_effect;

		  void main() {
		  	float x_intensity = (1.0 - u_effect[0]);
		  	float y_intensity = (1.0 - u_effect[1]);


		    vec2 prism_coords = vec2(
		    	(v_texcoord[0] * x_intensity) + (u_effect[0] / 2.0), 
		    	(v_texcoord[1] * y_intensity) + (u_effect[1] / 2.0)
		    );

		    gl_FragColor = texture2D(u_texture, prism_coords);
		  }
		`,
	},
];
