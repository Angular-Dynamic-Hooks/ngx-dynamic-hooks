const { resolve } = require( 'path' );
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');

const isProduction = process.env.NODE_ENV === 'production';
const mode = isProduction ? 'production' : 'development';

module.exports = {
  mode: mode,
  entry: {
    main: './js/main.ts',
    styles: './css/main.scss',
  },
  output: {
    path: resolve(__dirname, 'assets/build'),
    filename: isProduction ? "[name].[contenthash].js" : "[name].js",
    // Clean folder after every build
    clean: true
  },
  module: {
    rules: [
      {
        // To properly load existing source maps from libraries in node_modules
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]?ss$/,
        use: [
          // require.resolve('style-loader'),
          // Extracts the collected CSS from the JS and outputs it as separate files
          MiniCssExtractPlugin.loader,
          {
            loader: require.resolve( 'css-loader' ),
            options: {
              sourceMap: ! isProduction,
              modules: {
                auto: true,
              },
            },
          },
          require.resolve('postcss-loader'),
          require.resolve('sass-loader')
        ]
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', 'css', 'scss'],
  },
  watchOptions: { ignored: [  
    resolve(__dirname, './node_modules'),
    resolve(__dirname, './assets')
  ]},
  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin(),         // Minifies JS
      new CssMinimizerPlugin()    // Minifies CSS
    ],
  },
  plugins: [
    // When used in combination with MiniCssExtractPlugin, auto-removes the leftover husk js files from which all CSS has been extracted
    new RemoveEmptyScriptsPlugin(),
    new MiniCssExtractPlugin({
      filename: isProduction ? "[name].[contenthash].css" : '[name].css'
    })
  ],
};