const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  devtool: "source-map",

  entry: {
    'main': [path.resolve(__dirname, 'src/index.js')]
  },

  plugins: [
    new HtmlWebpackPlugin({
      title: "Flussonic WebRTC example",
      template: 'src/index.html'
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/fonts', to: '' },
        { from: 'src/styles', to: '' },
      ],
    }),
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: "babel-loader"
      },
    ],
  },

  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/')
  }
};

