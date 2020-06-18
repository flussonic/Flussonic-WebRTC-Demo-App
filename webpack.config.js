const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  devtool: "source-map",

  entry: {
    'main': [path.resolve(__dirname, 'src/index.js')]
  },

  plugins: [
    new HtmlWebpackPlugin({
      title: "Flussonic WebRTC example",
      template: 'src/index.html'
    })
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

