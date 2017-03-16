var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: {
    app: ['./src/main.js'],
    vendor: ['ajv', 'babel-polyfill',
             'vue', 'vuex', 'vue-router', 'vuex-router-sync',
             'vue-apollo', 'apollo-client', 'graphql-tag',
             'plotly.js/lib/core',
             'element-ui',
             'webpack/hot/dev-server', 'webpack-hot-middleware/client']
  },
  output: {
    path: '/',
    publicPath: '/dist/',
    filename: 'app.js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
            // the "scss" and "sass" values for the lang attribute to the right configs here.
            // other preprocessors should work out of the box, no loader config like this nessessary.
            'scss': 'vue-style-loader!css-loader!postcss-loader!sass-loader',
            'sass': 'vue-style-loader!css-loader!postcss-loader!sass-loader?indentedSyntax',
            'less': 'vue-style-loader!css-loader!postcss-loader!less-loader'
          }
          // other vue-loader options go here
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      },
      {
          test: /\.css$/,
          loader: 'style-loader!css-loader'
      },
      {
          test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
          loader: 'file-loader'
      },
      {
          test: /\.md$/,
          loader: 'html-loader!markdown-loader'
      },
      {
        test: /\.tour/,
        loader: 'json-loader!./loaders/tour-loader.js'
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.common.js'
    }
  },
  devServer: {
    hot: true,
    inline: true,
    noInfo: true
  },
  devtool: '#eval-source-map',
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendor",
      filename: "vendor.bundle.js"
    })
  ]
}