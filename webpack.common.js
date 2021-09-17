const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin') 
module.exports = {
    entry: {
        app: './src/main.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
    },
    module: {
        rules: [
            { 
                test: /\.css$/, 
                use: [
                    {loader: "vue-style-loader" },
                    { loader: "css-loader" },
                    { loader: "postcss-loader" },
                ]
            },
            { test: /\.(js|jsx)?$/, loader: 'babel-loader', exclude: /node_modules/ },
            { 
                test: /\.(ts|tsx)?$/, 
                use: [{
                    loader: 'ts-loader',
                    options: {
                        appendTsSuffixTo: [/.vue$/],
                    }
                }]
            },
            { test: /\.vue$/, use: 'vue-loader'},
            { }
        ]
    },
    resolve: {
        alias: {
            "@src": path.resolve(__dirname, 'src')
        },
        extensions: ['.js', '.css', '.ts', '.vue']
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html',
            filename:'index.html',
            chunks: ['app']
        })
    ]
}