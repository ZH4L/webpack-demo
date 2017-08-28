'use strict'
let webpack = require('webpack')
let path = require('path')
let glob = require('glob')

let HtmlWebpackPlugin = require('html-webpack-plugin')	// 用于生成html

let srcDir = path.resolve(__dirname, './src/view')
let globOption = {
	cwd: srcDir, // 在src/view目录里找
	sync: true	 // 这里不能异步，只能同步
}
let globInstance = new glob.Glob('!(_)*/!(_)*', globOption) // 考虑到多个页面共用HTML等资源的情况，跳过以'_'开头的目录
let entriesArr = globInstance.found // 一个数组，形如['index/index', 'user/user', 'user/modify']

console.log(entriesArr)

// 获取入口文件
let getEntry = () => {
	let entries = {}

	entriesArr.forEach(item => {
		entries[item] = path.resolve(srcDir, item + '/page')
	})
    return entries
}

console.log(getEntry())


let configPlugins = [	// plugin配置
	new webpack.optimize.CommonsChunkPlugin({
	    name: 'commons', // 这公共代码的chunk名为'commons'
	    filename: '[name].bundle.js', // 生成后的文件名，虽说用了[name]，但实际上就是'commons.bundle.js'了
	    minChunks: 3, // 设定要有4个chunk（即4个页面）加载的js模块才会被纳入公共代码。这数目自己考虑吧，我认为3-5比较合适。
	}),
	new webpack.ProvidePlugin({
		// 为页面提供变量，可直接使用，不需要require
		$: 'jquery',
	    jQuery: 'jquery',
	    'window.jQuery': 'jquery',
	    'window.$': 'jquery'
	})
]

// 配置各个chunk
entriesArr.forEach(item => {
	let htmlPlugin = new HtmlWebpackPlugin({
	    filename: item + '/page.html',
	    template: path.resolve(srcDir, item + '/page.html'),
	    chunks: [item, 'commons'],
	    hash: true, // 为静态资源生成hash值
	    minify: { removeAttributeQuotes: true },
	    xhtml: true,
	})

	configPlugins.push(htmlPlugin)
})


module.exports = {
	entry: getEntry(),
	output: {
		path: path.resolve(__dirname, './build'),
		publicPath: '/',
		filename: '[name]/entry.[chunkhash].js',    // [name]表示entry每一项中的key，用以批量指定生成后文件的名称
		chunkFilename: '[id].[chunkhash].bundle.js'
	},
	module: {

	},
	resolve: {
		extensions: ['.js', '.css', '.scss', '.tpl', '.png', '.jpg'],
	},
	plugins: configPlugins,
	devServer: {
	  	contentBase: './build/',
	  	host: 'localhost',
	  	port: 8080, // 默认8080
	  	inline: true, // 可以监控js变化
	  	hot: true, // 热启动
	  	compress: false,
	  	watchContentBase: false,
	}
}