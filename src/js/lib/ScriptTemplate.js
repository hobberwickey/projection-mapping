export const ScriptTemplate = function (script) {
	`
		class LFO {
		  constructor(min, max, interval) {
		    this.min = min;
		    this.max = max;
		    this.interval = interval;
		    this.epoch = Date.now();
		  }

		  getSin = () => {
		    const perc = this.getState();
		    return (
		      this.min +
		      (1 + Math.sin((perc * 360 * Math.PI) / 180)) * ((this.max - this.min) / 2)
		    );
		  };
		  getState = () => {
		    const ms = this.interval * 1000;
		    return ((Date.now() - this.epoch) % ms) / ms;
		  };
		}

		// TODO: API goes here

		return function() {
			${script}
		}
	`;
};
