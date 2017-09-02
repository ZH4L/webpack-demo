// postcss.config.js
module.exports = {
    plugins: [
        require('autoprefixer')({
        	browsers: ['ie>=9','>1% in CN']
        })
    ]
}