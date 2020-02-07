module.exports = {
    globals: {
		'ts-jest': {
			tsConfig: 'tsconfig.json'
		}
	},
    "transform": {
        "^.+\\.tsx?$": "ts-jest"
    },
    "testMatch": ["**/test/**/*.test.(ts|js)"],
    "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json", "node"],
    "testEnvironment": "node"
}