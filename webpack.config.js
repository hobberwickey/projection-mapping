const path = require("path");
const fs = require("fs");
const url = require("url");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    main: "/src/js/main.js",
    screen: "/src/js/screen.js",
    effects: "/src/js/effects.js",
    styles: ["/src/scss/main.scss"],
  },
  // watch: true,
  mode: "production",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "js/[name].js",
  },
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
    new FixStyleOnlyEntriesPlugin(),
    new MiniCssExtractPlugin({
      filename: "css/[name].css",
    }),
  ],
};
