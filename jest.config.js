module.exports = {
    globals: {
		'ts-jest': {
			tsConfigFile: 'tsconfig.json'
		}
	},
    "transform": {
        "^.+\\.tsx?$": "ts-jest"
    },
    "testMatch": ["**/test/**/*.test.(ts|js)"],
    "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json", "node"],
    "testEnvironment": "node"
}