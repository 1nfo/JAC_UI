var webpack = require('webpack');
module.exports = {
  entry: [
    "./clientJS/app.js"
  ],
  output: {
    path: __dirname + '/static/js',
    filename: "bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react']
        },
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
  ]
};