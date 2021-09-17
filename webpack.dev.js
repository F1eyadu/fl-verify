const common = require('./webpack.common')
const { merge } = require('webpack-merge')
const webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader').VueLoaderPlugin
module.exports = merge(common, {
    mode: 'development',
    devtool: 'eval-cheap-source-map',
    devServer: {
        port: 9999,
        hot: true,
        open: true,
        host: '0.0.0.0',
        liveReload: true
    },
    optimization: {
        moduleIds: 'named'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new VueLoaderPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development')
        })
    ]
})  