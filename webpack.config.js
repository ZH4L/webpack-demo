'use strict'
let webpack = require('webpack')
let path = require('path')
let glob = require('glob')

// 清空build目录
// var fs = require('fs')
// var rimraf = require('rimraf')
// var build_path = path.resolve(__dirname, './build')
// rimraf(build_path, fs, function cb() {
//   	console.log('build目录已清空')
// });

let HtmlWebpackPlugin = require('html-webpack-plugin')	// 用于生成html
let ExtractTextPlugin = require('extract-text-webpack-plugin')	// 抽出css

let srcDir = path.resolve(__dirname, './src/view')
let globOption = {
	cwd: srcDir, // 在src/view目录里找
	sync: true	 // 这里不能异步，只能同步
}
let globInstance = new glob.Glob('!(_)*/!(_)*', globOption) // 考虑到多个页面共用HTML等资源的情况，跳过以'_'开头的目录
let entriesArr = globInstance.found // 一个数组，形如['index/index', 'user/user', 'user/modify']

// 获取入口文件
let getEntry = () => {
	let entries = {}

	entriesArr.forEach(item => {
		entries[item] = path.resolve(srcDir, item + '/page')
	})
    return entries
}

let configPlugins = [	// plugin配置
	new webpack.optimize.CommonsChunkPlugin({
	    name: 'commons', // 这公共代码的chunk名为'commons'
	    filename: '[name].bundle.js?[hash:8]', // 生成后的文件名，虽说用了[name]，但实际上就是'commons.bundle.js'了
	    minChunks: 3, // 设定要有3个chunk（即3个页面）加载的js模块才会被纳入公共代码。这数目自己考虑吧，我认为3-5比较合适。
	}),
	new webpack.ProvidePlugin({
		// 为页面提供变量，可直接使用，不需要require
		$: 'jquery',
	    jQuery: 'jquery',
	    'window.jQuery': 'jquery',
	    'window.$': 'jquery'
	}),
	/* 抽取出webpack的runtime代码()，避免稍微修改一下入口文件就会改动commonChunk，导致原本有效的浏览器缓存失效 */
	// new webpack.optimize.CommonsChunkPlugin({
	//   	name: 'webpack-runtime',
	//   	filename: 'commons/commons/webpack-runtime.[hash].js',
	// }),
	// new webpack.HotModuleReplacementPlugin(),	//热加载插件，使用--hot就不需要手动配置
	/* 抽取出chunk的css */
	new ExtractTextPlugin('[name]/page.css?[contenthash:8]'),
]

// 配置各个chunk
entriesArr.forEach(item => {
	let htmlPlugin = new HtmlWebpackPlugin({
	    filename: item + '/page.html',
	    template: path.resolve(srcDir, item + '/page.html'),
	    chunks: ['commons', item],
	    hash: false, // 为静态资源生成hash值
	    minify: { removeAttributeQuotes: false }
	})

	configPlugins.push(htmlPlugin)
})
let indexOnly = new HtmlWebpackPlugin({
				    filename: 'index.html',
				    template: path.resolve(srcDir, 'index.html'),
				    chunks: [],
				})
configPlugins.push(indexOnly)


module.exports = {
	entry: getEntry(),	// 入口文件
	output: {
		// 输入配置
		path: path.resolve(__dirname, './build'),
		publicPath: '/',
		filename: '[name]/entry.js?[hash:8]',    // [name]表示entry每一项中的key，用以批量指定生成后文件的名称
		chunkFilename: '[id].[hash:8].bundle.js'
	},
	// devtool: 'eval-source-map',	// 开启source map方便调试
	resolve: {
		extensions: ['.js', '.css', '.scss', '.tpl', '.png', '.jpg'],
		alias: {
			'srcRoot': path.resolve(__dirname, 'src')	// src根目录
		}
	},
	plugins: configPlugins,	// 插件
	devServer: {
		// 本地调试服务器
	  	contentBase: './build/',
	  	host: 'localhost',
	  	port: 9000, // 默认8080
	  	inline: true, // 可以监控js变化
	  	hot: true, // 热启动
	  	compress: false,
	  	watchContentBase: false,
	},
	module: {
        rules: [
            {
                test: /(\.js)$/,
                use: {
                    loader: "babel-loader"
                },
                exclude: /node_modules/		// 排除/node_modules/
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: [{
                        loader: "css-loader"
                    }, {
                        loader: "postcss-loader"
                	}],
                }),
                exclude: /node_modules/
            },
            {
            	test: /\.(png|jpe?g|gif|ico)$/,
            	// loader: 'url-loader?limit=10240&name=./static/img/[hash].[ext]',
            	loader: 'url-loader',
            	options: {
            	  	limit: 10240,
            	  	name: './static/img/[hash:8].[name].[ext]'
            	}
            },
            {
	            test: /\.html$/,
	            loader: "html-loader"
            }
        ]
    }
}