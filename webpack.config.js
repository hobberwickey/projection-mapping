const path = require("path");
const fs = require("fs");
const url = require("url");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const RemoveEmptyScriptsPlugin = require("webpack-remove-empty-scripts");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const { JSDOM } = require("jsdom");

class WebComponentsLoader {
  static defaultOptions = {
    source: "/src/components",
    output: "/js/components.js",
  };

  constructor(options = {}) {
    this.options = { ...WebComponentsLoader.defaultOptions, ...options };
  }

  apply(compiler) {
    const pluginName = "WebComponentsLoader";

    const { webpack } = compiler;

    const { Compilation } = webpack;

    const { RawSource } = webpack.sources;

    // compiler.hooks.compilation.tap(
    //   "add-deps:compilation",
    //   function (compilation) {
    //     addDepPaths.forEach(function (depPath) {
    //       compilation.compilationDependencies.add(
    //         path.join(compiler.context, depPath),
    //       );
    //     });
    //   },
    // );

    // compiler.hooks.afterEmit.tap("add-deps:afterEmit", function (compilation) {
    //   addDepPaths.forEach(function (depPath) {
    //     compilation.fileDependencies.add(path.join(compiler.context, depPath));
    //   });
    // });

    // compiler.hooks.afterEmit.tap(
    //   "add-deps-using-contextDependencies:afterEmit",
    //   function (compilation) {
    //     addDepPaths.forEach(function (depPath) {
    //       compilation.contextDependencies.add(path.join(compiler.context));
    //     });
    //   },
    // );

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        (assets) => {
          let templates = [];

          let componentsTemplate = fs.readFileSync(
            path.join(__dirname, "/component.js"),
          );

          let folder = path.join(__dirname, this.options.source);

          compilation.contextDependencies.add(path.join(folder));
          fs.readdirSync(path.join(__dirname, this.options.source)).forEach(
            (file) => {
              let filecontent = fs.readFileSync(path.join(folder, file));
              let dom = new JSDOM(filecontent.toString());
              let doc = dom.window.document;

              let template = doc.querySelector("template");
              let script = doc.querySelector("script");
              let style = doc.querySelector("style");

              if (!script) {
                console.log(`File ${file} is not a valid component`);
                return;
              } else {
                console.log(`Bundling Component: ${file}`);
              }

              templates.push(
                `
              (() => {
                const name = '${file.replace(".html", "")}';
                const elementClass = ${script.textContent};
                const options = {};


                ${
                  !!style
                    ? `
                const style = document.createElement(style);
                      style.innerHTML = \`${style.innerHTML}

                options.style = style;
                `
                    : ""
                }

                ${
                  !!template
                    ? `
                const template = document.createElement("template");
                      template.innerHTML = \`${template.innerHTML}\`;

                options.template = template;
                `
                    : ""
                }
                
                ComponentRegistry.register(name, elementClass, options);
              })();`.trim(),
              );
            },
          );

          let outputStr = `${componentsTemplate.toString()} \n\n ${templates.join("\n\n")}`;
          console.log("Outputing", this.options.output);
          compilation.emitAsset(this.options.output, new RawSource(outputStr));
        },
      );
    });
  }
}

module.exports = {
  entry: {
    main: "/src/js/main.js",
    rebuild: "/src/js/rebuild.js",
    rescreen: "/src/js/rescreen.js",

    screen: "/src/js/screen.js",
    effects: "/src/js/effects.js",
    styles: ["/src/scss/main.scss"],
    restyle: ["/src/scss/restyle.scss"],
  },
  // watch: true,
  mode: "production",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "js/[name].js",
  },
  cache: false,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: false,
            },
          },
          {
            loader: "sass-loader",
            options: {
              sassOptions: {
                style: "expanded",
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|woff|woff2|eot|ttf|svg)$/,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 1000,
              name: "public/img/[name].[ext]",
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new RemoveEmptyScriptsPlugin(),
    new MiniCssExtractPlugin({
      filename: "css/[name].css",
    }),
    new WebComponentsLoader(),
  ],
  devServer: {
    watchFiles: "./src/**/*.html",
  },
};
